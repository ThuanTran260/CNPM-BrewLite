import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { OrdersService } from '../src/modules/orders/orders.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { VouchersService } from '../src/modules/vouchers/vouchers.service';
import { OrderStatus, Size } from '@prisma/client';

describe('Task 10: Inventory Concurrency & Optimistic Locking E2E Test Suite', () => {
  let ordersService: OrdersService;
  let mockPrisma: any;

  // Dữ liệu mô phỏng CSDL PostgreSQL với phiên bản (Optimistic Locking)
  let productDb: {
    id: string;
    name: string;
    price: number;
    stock: number;
    version: number;
  };
  let ordersList: any[];

  beforeEach(async () => {
    // Khởi tạo sản phẩm Cold Brew Phiên Bản Giới Hạn với TỒN KHO = 1, VERSION = 0
    productDb = {
      id: 'prod-limited-cold-brew',
      name: 'Cà phê Phiên bản Giới hạn (Limited Cold Brew)',
      price: 55000,
      stock: 1,
      version: 0,
    };
    ordersList = [];

    mockPrisma = {
      product: {
        findMany: jest.fn(async ({ where }: { where: { id: { in: string[] } } }) => {
          if (where.id.in.includes(productDb.id)) {
            // Trả về bản sao trạng thái hiện tại của sản phẩm
            return [{ ...productDb }];
          }
          return [];
        }),
        updateMany: jest.fn(
          async ({
            where,
            data,
          }: {
            where: { id: string; version: number; stock: { gte: number } };
            data: { stock: { decrement: number }; version: { increment: number } };
          }) => {
            // Giả lập cơ chế Atomic Conditional Update của PostgreSQL
            // WHERE id = ? AND version = ? AND stock >= ?
            if (
              productDb.id === where.id &&
              productDb.version === where.version &&
              productDb.stock >= where.stock.gte
            ) {
              productDb.stock -= data.stock.decrement;
              productDb.version += data.version.increment;
              return { count: 1 };
            }
            // Không khớp version hoặc không đủ stock -> update 0 dòng (Báo hiệu xung đột)
            return { count: 0 };
          },
        ),
      },
      order: {
        count: jest.fn(async () => ordersList.length),
        create: jest.fn(async ({ data }: { data: any }) => {
          const orderRecord = {
            id: `ord-${ordersList.length + 1}`,
            ...data,
            createdAt: new Date(),
          };
          ordersList.push(orderRecord);
          return orderRecord;
        }),
      },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => {
        // Thực thi transaction callback với mockPrisma
        return cb(mockPrisma);
      }),
    };

    const mockVouchersService = {
      validateVoucher: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: VouchersService, useValue: mockVouchersService },
      ],
    }).compile();

    ordersService = moduleRef.get<OrdersService>(OrdersService);
  });

  describe('1. Kiểm thử tranh chấp tồn kho với 10 Request song song', () => {
    it('khi tồn kho = 1, 10 request đồng thời: chính xác 1 thành công (201), 9 nhận 409 Conflict, tồn kho cuối = 0 (không âm)', async () => {
      expect(productDb.stock).toBe(1);
      expect(productDb.version).toBe(0);

      // Tạo 10 request đặt món đồng thời cho 10 khách hàng khác nhau
      const concurrentOrderRequests = Array.from({ length: 10 }, (_, index) => {
        return ordersService.createOrder(`user-${index + 1}`, {
          items: [
            {
              productId: productDb.id,
              size: Size.M,
              toppings: [],
              qty: 1,
            },
          ],
        });
      });

      // Thực thi 10 request đồng thời bằng Promise.allSettled
      const results = await Promise.allSettled(concurrentOrderRequests);

      // 1. Phân loại kết quả
      const successfulOrders = results.filter(
        (r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled',
      );
      const failedOrders = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      );

      // 2. Kiểm chứng: Đúng 1 request thành công
      expect(successfulOrders.length).toBe(1);
      const createdOrder = successfulOrders[0].value;
      expect(createdOrder.status).toBe(OrderStatus.PENDING);
      expect(createdOrder.code).toBe('#1001');

      // 3. Kiểm chứng: Đúng 9 request còn lại bị từ chối
      expect(failedOrders.length).toBe(9);

      // 4. Kiểm chứng: Cả 9 request thất bại đều nhận ConflictException (HTTP 409)
      for (const failure of failedOrders) {
        expect(failure.reason).toBeInstanceOf(ConflictException);
        expect(failure.reason.message).toContain(
          'đã có thay đổi tồn kho hoặc vừa hết hàng',
        );
      }

      // 5. Kiểm chứng trạng thái CSDL:
      // Tồn kho cuối cùng phải là 0
      expect(productDb.stock).toBe(0);
      // Tồn kho tuyệt đối không bị âm
      expect(productDb.stock).toBeGreaterThanOrEqual(0);
      // Version tăng đúng 1 lần
      expect(productDb.version).toBe(1);
      // Chỉ có duy nhất 1 đơn hàng được tạo trong hệ thống
      expect(ordersList.length).toBe(1);
    });
  });

  describe('2. Đặt hàng khi sản phẩm đã hết tồn kho (stock = 0)', () => {
    it('bị từ chối ngay lập tức từ bước kiểm tra ban đầu với ConflictException', async () => {
      // Đặt tồn kho về 0
      productDb.stock = 0;
      productDb.version = 1;

      await expect(
        ordersService.createOrder('user-late', {
          items: [
            {
              productId: productDb.id,
              size: Size.M,
              toppings: [],
              qty: 1,
            },
          ],
        }),
      ).rejects.toThrow(ConflictException);

      // Kiểm tra thông điệp lỗi rõ ràng
      try {
        await ordersService.createOrder('user-late', {
          items: [
            {
              productId: productDb.id,
              size: Size.M,
              toppings: [],
              qty: 1,
            },
          ],
        });
      } catch (err: any) {
        expect(err.message).toContain('không đủ số lượng tồn kho');
      }
    });
  });
});
