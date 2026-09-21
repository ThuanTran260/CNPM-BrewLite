import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';

describe('Task 10: Idempotent Payment E2E Test Suite', () => {
  let paymentsService: PaymentsService;
  let mockPrisma: any;

  // In-memory data store mô phỏng CSDL PostgreSQL
  let paymentStore: Map<string, any>;
  let orderStore: Map<string, any>;
  let userStore: Map<string, any>;

  beforeEach(async () => {
    paymentStore = new Map();
    orderStore = new Map();
    userStore = new Map();

    // Khởi tạo dữ liệu người dùng và đơn hàng
    userStore.set('user-100', {
      id: 'user-100',
      email: 'customer@brewlite.vn',
      loyaltyPoints: 10,
    });

    orderStore.set('order-1', {
      id: 'order-1',
      code: '#1042',
      userId: 'user-100',
      status: OrderStatus.PENDING,
      total: 55000,
      voucherCode: 'WELCOME10',
      items: [{ productId: 'prod-cold-brew', qty: 1 }],
    });

    orderStore.set('order-2', {
      id: 'order-2',
      code: '#1043',
      userId: 'user-100',
      status: OrderStatus.PENDING,
      total: 70000,
      voucherCode: null,
      items: [{ productId: 'prod-cappuccino', qty: 2 }],
    });

    mockPrisma = {
      payment: {
        findUnique: jest.fn(async ({ where }: { where: { idempotencyKey: string } }) => {
          const p = paymentStore.get(where.idempotencyKey);
          if (!p) return null;
          return {
            ...p,
            order: orderStore.get(p.orderId),
          };
        }),
        create: jest.fn(async ({ data }: { data: any }) => {
          if (paymentStore.has(data.idempotencyKey)) {
            // Giả lập lỗi Unique Constraint P2002 của Prisma khi bị race condition
            throw new Prisma.PrismaClientKnownRequestError(
              'Unique constraint failed on the fields: (`idempotencyKey`)',
              {
                code: 'P2002',
                clientVersion: '5.10.0',
                meta: { target: ['idempotencyKey'] },
              },
            );
          }
          const record = { id: `pay-${paymentStore.size + 1}`, ...data };
          paymentStore.set(data.idempotencyKey, record);
          return record;
        }),
      },
      order: {
        findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
          return orderStore.get(where.id) || null;
        }),
        update: jest.fn(async ({ where, data }: { where: { id: string }; data: any }) => {
          const current = orderStore.get(where.id);
          if (!current) throw new Error('Order not found');
          const updated = { ...current, ...data };
          orderStore.set(where.id, updated);
          return updated;
        }),
      },
      product: {
        update: jest.fn(async () => ({})),
      },
      user: {
        update: jest.fn(async ({ where, data }: { where: { id: string }; data: any }) => {
          const current = userStore.get(where.id);
          if (data.loyaltyPoints?.increment) {
            current.loyaltyPoints += data.loyaltyPoints.increment;
          }
          userStore.set(where.id, current);
          return current;
        }),
      },
      voucher: {
        update: jest.fn(async () => ({})),
      },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => {
        return cb(mockPrisma);
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    paymentsService = moduleRef.get<PaymentsService>(PaymentsService);
  });

  describe('1. Kiểm tra tính hợp lệ của Idempotency-Key Header', () => {
    it('phải từ chối với BadRequestException nếu thiếu Idempotency-Key header', async () => {
      await expect(
        paymentsService.processPayment('user-100', '', {
          orderId: 'order-1',
          method: PaymentMethod.E_WALLET,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('phải từ chối nếu Idempotency-Key chỉ toàn khoảng trắng', async () => {
      await expect(
        paymentsService.processPayment('user-100', '   ', {
          orderId: 'order-1',
          method: PaymentMethod.E_WALLET,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Idempotent Replay tuần tự (Sequential Replay)', () => {
    it('gửi 2 request tuần tự cùng key và orderId: chỉ trừ tiền và cộng loyalty 1 lần duy nhất', async () => {
      const idempotencyKey = 'unique-key-seq-001';

      // Lần gọi 1: Thanh toán thành công lần đầu
      const firstResult = await paymentsService.processPayment(
        'user-100',
        idempotencyKey,
        {
          orderId: 'order-1',
          method: PaymentMethod.E_WALLET,
        },
      );

      expect(firstResult.status).toBe('PAID');
      expect(firstResult.idempotentReplay).toBeUndefined();
      expect(firstResult.loyaltyPointsEarned).toBe(5); // 55000 / 10000 = 5 điểm

      // Kiểm tra trạng thái trong store
      const orderAfterFirst = orderStore.get('order-1');
      expect(orderAfterFirst.status).toBe(OrderStatus.PAID);
      expect(userStore.get('user-100').loyaltyPoints).toBe(15); // 10 ban đầu + 5 mới
      expect(paymentStore.size).toBe(1);

      // Lần gọi 2: Gửi lại cùng key và orderId (Giả lập rớt mạng / user click lặp)
      const secondResult = await paymentsService.processPayment(
        'user-100',
        idempotencyKey,
        {
          orderId: 'order-1',
          method: PaymentMethod.E_WALLET,
        },
      );

      // Phải trả về Idempotent Replay ngay lập tức
      expect(secondResult.idempotentReplay).toBe(true);
      expect(secondResult.status).toBe('PAID');
      expect(secondResult.code).toBe('#1042');

      // Điểm loyalty TUYỆT ĐỐI không bị cộng thêm lần 2
      expect(userStore.get('user-100').loyaltyPoints).toBe(15);
      // Bảng Payment không bị chèn thêm record thứ 2
      expect(paymentStore.size).toBe(1);
    });
  });

  describe('3. Chống xung đột sử dụng lại Key cho đơn hàng khác (Key Collision / Reuse)', () => {
    it('ném lỗi 422 UnprocessableEntityException khi tái sử dụng key của đơn khác', async () => {
      const reusedKey = 'shared-key-test-999';

      // Bước 1: Thanh toán đơn order-1 với key này
      await paymentsService.processPayment('user-100', reusedKey, {
        orderId: 'order-1',
        method: PaymentMethod.E_WALLET,
      });

      // Bước 2: Cố tình dùng reusedKey cho đơn order-2
      await expect(
        paymentsService.processPayment('user-100', reusedKey, {
          orderId: 'order-2',
          method: PaymentMethod.BANK_CARD,
        }),
      ).rejects.toThrow(UnprocessableEntityException);

      // Đơn order-2 vẫn phải giữ nguyên PENDING
      expect(orderStore.get('order-2').status).toBe(OrderStatus.PENDING);
    });
  });

  describe('4. Chống Race Condition song song (Prisma P2002 Race Defense)', () => {
    it('xử lý an toàn khi 2 request song song cùng lọt qua bước lookup và gặp lỗi P2002', async () => {
      const raceKey = 'race-concurrent-key-777';

      // Để mô phỏng race condition: 
      // Ở bước 1 findUnique, cả 2 request cùng chạy song song nên cả 2 đều nhận kết quả null
      let findUniqueCallCount = 0;
      mockPrisma.payment.findUnique.mockImplementation(async ({ where }: any) => {
        findUniqueCallCount++;
        // Lần gọi thứ 1 và 2 (ở bước 1 của 2 request) đều trả về null
        if (findUniqueCallCount <= 2) {
          return null;
        }
        // Lần gọi thứ 3 (trong catch block P2002) trả về record đã được request 1 tạo
        return {
          id: 'pay-race-winner',
          orderId: 'order-1',
          idempotencyKey: raceKey,
          status: PaymentStatus.SUCCESS,
          order: orderStore.get('order-1'),
        };
      });

      // Bắn 2 request hoàn toàn song song
      const [res1, res2] = await Promise.all([
        paymentsService.processPayment('user-100', raceKey, {
          orderId: 'order-1',
          method: PaymentMethod.E_WALLET,
        }),
        paymentsService.processPayment('user-100', raceKey, {
          orderId: 'order-1',
          method: PaymentMethod.E_WALLET,
        }),
      ]);

      // Một trong 2 request sẽ là người tạo đầu tiên, request kia nhận kết quả qua cơ chế P2002 Defense
      const results = [res1, res2];
      const primaryResult = results.find((r) => !r.idempotentReplay);
      const defendedResult = results.find((r) => r.idempotentReplay);

      expect(primaryResult).toBeDefined();
      expect(primaryResult?.status).toBe('PAID');

      expect(defendedResult).toBeDefined();
      expect(defendedResult?.idempotentReplay).toBe(true);
      expect(defendedResult?.status).toBe('PAID');

      // Đơn hàng cuối cùng chuyển thành PAID
      expect(orderStore.get('order-1').status).toBe(OrderStatus.PAID);
    });
  });
});
