import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VouchersService } from '../src/modules/vouchers/vouchers.service';
import { OrdersCleanupService } from '../src/modules/orders/orders-cleanup.service';
import { OrdersService } from '../src/modules/orders/orders.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { OrderStatus, Role, VoucherType } from '@prisma/client';

describe('Task 10: Voucher Validation & Expired Orders Cleanup E2E Test Suite', () => {
  describe('Phần 1: Nghiệp vụ Voucher (VouchersService)', () => {
    let vouchersService: VouchersService;
    let mockPrisma: any;
    let voucherStore: Map<string, any>;

    beforeEach(async () => {
      voucherStore = new Map();

      // Khởi tạo các mã voucher theo tài liệu đặc tả BrewLite & seed.ts
      voucherStore.set('WELCOME10', {
        id: 'vouch-1',
        code: 'WELCOME10',
        type: VoucherType.PERCENT,
        value: 10, // Giảm 10%
        minOrder: 50000,
        usageLimit: 100,
        usedCount: 5,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Còn hạn 30 ngày
      });

      voucherStore.set('FIXED20K', {
        id: 'vouch-2',
        code: 'FIXED20K',
        type: VoucherType.FIXED,
        value: 20000, // Giảm 20.000đ
        minOrder: 100000,
        usageLimit: 50,
        usedCount: 10,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      voucherStore.set('EXPIRED_CODE', {
        id: 'vouch-3',
        code: 'EXPIRED_CODE',
        type: VoucherType.FIXED,
        value: 15000,
        minOrder: 30000,
        usageLimit: 100,
        usedCount: 0,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Đã hết hạn hôm qua
      });

      voucherStore.set('OUT_OF_LIMIT', {
        id: 'vouch-4',
        code: 'OUT_OF_LIMIT',
        type: VoucherType.PERCENT,
        value: 50,
        minOrder: 30000,
        usageLimit: 10,
        usedCount: 10, // Đã dùng hết lượt
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      mockPrisma = {
        voucher: {
          findUnique: jest.fn(async ({ where }: { where: { code: string } }) => {
            return voucherStore.get(where.code) || null;
          }),
        },
      };

      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          VouchersService,
          { provide: PrismaService, useValue: mockPrisma },
        ],
      }).compile();

      vouchersService = moduleRef.get<VouchersService>(VouchersService);
    });

    it('tính đúng giảm giá 10% với WELCOME10 khi đơn hàng đạt giá trị tối thiểu', async () => {
      const subtotal = 80000;
      const result = await vouchersService.validateVoucher('WELCOME10', subtotal);

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(8000); // 10% của 80.000đ = 8.000đ
    });

    it('ném lỗi BadRequestException nếu đơn hàng chưa đạt giá trị tối thiểu minOrder của WELCOME10', async () => {
      const subtotal = 40000; // Nhỏ hơn 50.000đ
      await expect(
        vouchersService.validateVoucher('WELCOME10', subtotal),
      ).rejects.toThrow(BadRequestException);
    });

    it('tính đúng số tiền giảm cố định 20.000đ với FIXED20K', async () => {
      const subtotal = 120000;
      const result = await vouchersService.validateVoucher('FIXED20K', subtotal);

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(20000);
    });

    it('ném lỗi BadRequestException nếu đơn hàng chưa đạt giá trị tối thiểu của FIXED20K', async () => {
      const subtotal = 80000; // Nhỏ hơn 100.000đ
      await expect(
        vouchersService.validateVoucher('FIXED20K', subtotal),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném lỗi NotFoundException nếu mã voucher không tồn tại trong hệ thống', async () => {
      await expect(
        vouchersService.validateVoucher('KHONG_TON_TAI', 100000),
      ).rejects.toThrow(NotFoundException);
    });

    it('ném lỗi BadRequestException nếu mã voucher đã hết hạn sử dụng', async () => {
      await expect(
        vouchersService.validateVoucher('EXPIRED_CODE', 100000),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném lỗi BadRequestException nếu mã voucher đã hết lượt sử dụng (usedCount >= usageLimit)', async () => {
      await expect(
        vouchersService.validateVoucher('OUT_OF_LIMIT', 100000),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Phần 2: Tự động dọn dẹp đơn PENDING quá hạn 15 phút & Hoàn kho', () => {
    let cleanupService: OrdersCleanupService;
    let ordersService: OrdersService;
    let mockPrisma: any;

    let productState: { id: string; stock: number; version: number };
    let expiredOrder: any;
    let activeOrder: any;

    beforeEach(async () => {
      productState = {
        id: 'prod-latte',
        stock: 5, // Tồn kho hiện tại là 5
        version: 1,
      };

      // Đơn hàng PENDING đã hết hạn (tạo cách đây 20 phút)
      expiredOrder = {
        id: 'order-expired-1',
        code: '#1099',
        userId: 'user-expired',
        status: OrderStatus.PENDING,
        total: 45000,
        expiresAt: new Date(Date.now() - 5 * 60 * 1000), // Quá hạn 5 phút trước
        items: [
          {
            id: 'item-1',
            orderId: 'order-expired-1',
            productId: 'prod-latte',
            qty: 2, // Đã giữ 2 ly
          },
        ],
      };

      // Đơn hàng PENDING còn hạn (còn 10 phút)
      activeOrder = {
        id: 'order-active-1',
        code: '#1100',
        userId: 'user-active',
        status: OrderStatus.PENDING,
        total: 50000,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        items: [
          {
            id: 'item-2',
            orderId: 'order-active-1',
            productId: 'prod-latte',
            qty: 1,
          },
        ],
      };

      mockPrisma = {
        order: {
          findMany: jest.fn(async ({ where }: any) => {
            const results = [];
            // Quét các đơn PENDING có expiresAt < now
            if (
              expiredOrder.status === OrderStatus.PENDING &&
              expiredOrder.expiresAt < new Date()
            ) {
              results.push(expiredOrder);
            }
            return results;
          }),
          findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
            if (where.id === expiredOrder.id) return expiredOrder;
            if (where.id === activeOrder.id) return activeOrder;
            return null;
          }),
          update: jest.fn(async ({ where, data }: any) => {
            if (where.id === expiredOrder.id) {
              expiredOrder.status = data.status;
              return expiredOrder;
            }
            if (where.id === activeOrder.id) {
              activeOrder.status = data.status;
              return activeOrder;
            }
          }),
        },
        product: {
          update: jest.fn(async ({ where, data }: any) => {
            if (where.id === productState.id) {
              if (data.stock?.increment) {
                productState.stock += data.stock.increment;
              }
              if (data.version?.increment) {
                productState.version += data.version.increment;
              }
              return productState;
            }
          }),
        },
        $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => {
          return cb(mockPrisma);
        }),
      };

      const mockVouchersService = {
        validateVoucher: jest.fn(),
      };

      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          OrdersCleanupService,
          OrdersService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: VouchersService, useValue: mockVouchersService },
        ],
      }).compile();

      cleanupService = moduleRef.get<OrdersCleanupService>(OrdersCleanupService);
      ordersService = moduleRef.get<OrdersService>(OrdersService);
    });

    it('tác vụ cron cleanup tự động chuyển đơn quá hạn sang CANCELLED và hoàn trả tồn kho', async () => {
      expect(productState.stock).toBe(5);
      expect(expiredOrder.status).toBe(OrderStatus.PENDING);

      // Chạy cron cleanup
      await cleanupService.handleExpiredOrdersCleanup();

      // Đơn quá hạn phải chuyển sang CANCELLED
      expect(expiredOrder.status).toBe(OrderStatus.CANCELLED);

      // Tồn kho sản phẩm phải được hoàn trả 2 ly (5 + 2 = 7)
      expect(productState.stock).toBe(7);
      expect(productState.version).toBe(2);
    });

    it('cơ chế Lazy-Check khi gọi getOrderById phát hiện đơn quá hạn và tự hủy + hoàn kho', async () => {
      // Khởi tạo lại trạng thái đơn PENDING quá hạn
      expiredOrder.status = OrderStatus.PENDING;
      productState.stock = 5;

      const orderResult = await ordersService.getOrderById(
        'user-expired',
        Role.CUSTOMER,
        'order-expired-1',
      );

      expect(orderResult.status).toBe(OrderStatus.CANCELLED);
      expect(productState.stock).toBe(7);
    });

    it('đơn hàng PENDING còn thời hạn (chưa quá 15 phút) KHÔNG bị hủy', async () => {
      // Đảm bảo không có đơn expired nào khác trong DB
      expiredOrder.status = OrderStatus.CANCELLED;
      expect(activeOrder.status).toBe(OrderStatus.PENDING);
      const originalStock = productState.stock;

      // Chạy cron cleanup
      await cleanupService.handleExpiredOrdersCleanup();

      // Đơn còn hạn không bị thay đổi
      expect(activeOrder.status).toBe(OrderStatus.PENDING);
      // Tồn kho không bị cộng thừa
      expect(productState.stock).toBe(originalStock);
    });
  });
});
