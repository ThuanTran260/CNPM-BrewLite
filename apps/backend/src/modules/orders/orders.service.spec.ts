import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { VouchersService } from '../vouchers/vouchers.service';
import { OrderStatus, Role, Size } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;
  let vouchersService: any;

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(41),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    vouchersService = {
      validateVoucher: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: VouchersService, useValue: vouchersService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('nên ném NotFoundException nếu không tìm thấy món', async () => {
      prisma.product.findMany.mockResolvedValueOnce([]);

      await expect(
        service.createOrder('user-1', {
          items: [{ productId: 'invalid-id', size: Size.M, toppings: [], qty: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('nên ném ConflictException nếu số lượng tồn kho không đủ', async () => {
      prisma.product.findMany.mockResolvedValueOnce([
        {
          id: 'prod-1',
          name: 'Cà phê',
          price: 30000,
          stock: 2,
          version: 0,
        },
      ]);

      await expect(
        service.createOrder('user-1', {
          items: [{ productId: 'prod-1', size: Size.M, toppings: [], qty: 5 }],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('nên tạo đơn PENDING và trừ kho nếu hợp lệ', async () => {
      prisma.product.findMany.mockResolvedValueOnce([
        {
          id: 'prod-1',
          name: 'Cà phê',
          price: 30000,
          stock: 10,
          version: 0,
        },
      ]);

      prisma.product.updateMany = jest.fn().mockResolvedValueOnce({ count: 1 });
      prisma.order.create.mockResolvedValueOnce({
        id: 'order-1',
        code: '#1042',
        status: OrderStatus.PENDING,
        total: 35000,
      });

      const result = await service.createOrder('user-1', {
        items: [{ productId: 'prod-1', size: Size.M, toppings: [], qty: 1 }],
      });

      expect(result.code).toBe('#1042');
      expect(result.status).toBe(OrderStatus.PENDING);
    });
  });

  describe('cancelOrder', () => {
    it('nên ném BadRequestException nếu khách hủy đơn đã PAID', async () => {
      prisma.order.findUnique.mockResolvedValueOnce({
        id: 'order-1',
        userId: 'user-1',
        status: OrderStatus.PAID,
        items: [],
      });

      await expect(
        service.cancelOrder('user-1', Role.CUSTOMER, 'order-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('nên cho phép khách hủy đơn PENDING và hoàn kho', async () => {
      prisma.order.findUnique.mockResolvedValueOnce({
        id: 'order-1',
        userId: 'user-1',
        status: OrderStatus.PENDING,
        items: [{ productId: 'prod-1', qty: 2 }],
      });

      prisma.product.update.mockResolvedValueOnce({});
      prisma.order.update.mockResolvedValueOnce({
        id: 'order-1',
        status: OrderStatus.CANCELLED,
      });

      const result = await service.cancelOrder('user-1', Role.CUSTOMER, 'order-1');

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stock: { increment: 2 }, version: { increment: 1 } },
      });
    });
  });
});
