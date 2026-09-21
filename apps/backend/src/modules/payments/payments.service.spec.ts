import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      payment: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      product: {
        update: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
      voucher: {
        update: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('nên ném BadRequestException nếu thiếu Idempotency-Key', async () => {
    await expect(
      service.processPayment('user-1', '', {
        orderId: 'order-1',
        method: PaymentMethod.E_WALLET,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('nên trả về kết quả cũ nếu cùng idempotencyKey và cùng orderId (Idempotent Replay)', async () => {
    prisma.payment.findUnique.mockResolvedValueOnce({
      id: 'pay-1',
      orderId: 'order-1',
      idempotencyKey: 'test-key-1',
      status: PaymentStatus.SUCCESS,
      order: { code: '#1042' },
    });

    const result = await service.processPayment('user-1', 'test-key-1', {
      orderId: 'order-1',
      method: PaymentMethod.E_WALLET,
    });

    expect(result.idempotentReplay).toBe(true);
    expect(result.status).toBe('PAID');
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('nên ném UnprocessableEntityException nếu dùng trùng key cho đơn hàng khác', async () => {
    prisma.payment.findUnique.mockResolvedValueOnce({
      id: 'pay-1',
      orderId: 'other-order',
      idempotencyKey: 'test-key-1',
      status: PaymentStatus.SUCCESS,
      order: { code: '#9999' },
    });

    await expect(
      service.processPayment('user-1', 'test-key-1', {
        orderId: 'order-1',
        method: PaymentMethod.E_WALLET,
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('nên thanh toán thành công, chuyển đơn sang PAID và cộng điểm loyalty', async () => {
    prisma.payment.findUnique.mockResolvedValueOnce(null);
    prisma.order.findUnique.mockResolvedValueOnce({
      id: 'order-1',
      code: '#1042',
      userId: 'user-1',
      status: OrderStatus.PENDING,
      total: 35000,
      items: [],
    });

    const result = await service.processPayment('user-1', 'new-key-123', {
      orderId: 'order-1',
      method: PaymentMethod.E_WALLET,
    });

    expect(result.status).toBe('PAID');
    expect(result.loyaltyPointsEarned).toBe(3); // 35000 / 10000 = 3 điểm
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        status: PaymentStatus.SUCCESS,
      }),
    });
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: OrderStatus.PAID },
    });
  });

  it('nên chuyển đơn sang PAYMENT_FAILED và hoàn kho nếu forceFail=true', async () => {
    prisma.payment.findUnique.mockResolvedValueOnce(null);
    prisma.order.findUnique.mockResolvedValueOnce({
      id: 'order-1',
      code: '#1042',
      userId: 'user-1',
      status: OrderStatus.PENDING,
      total: 35000,
      items: [{ productId: 'prod-1', qty: 2 }],
    });

    const result = await service.processPayment('user-1', 'new-key-456', {
      orderId: 'order-1',
      method: PaymentMethod.E_WALLET,
      forceFail: true,
    });

    expect(result.status).toBe('FAILED');
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: OrderStatus.PAYMENT_FAILED },
    });
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { stock: { increment: 2 }, version: { increment: 1 } },
    });
  });
});
