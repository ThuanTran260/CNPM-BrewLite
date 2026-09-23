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

    it('nên từ chối khi đặt nhiều size của cùng 1 món mà tổng số lượng vượt quá tồn kho', async () => {
      prisma.product.findMany.mockResolvedValueOnce([
        {
          id: 'prod-1',
          name: 'Americano',
          price: 40000,
          stock: 3,
          version: 0,
        },
      ]);

      await expect(
        service.createOrder('user-1', {
          items: [
            { productId: 'prod-1', size: Size.S, toppings: [], qty: 2 },
            { productId: 'prod-1', size: Size.L, toppings: [], qty: 2 }, // Tổng 4 > tồn kho 3
          ],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('nên gộp trừ kho chính xác khi đặt nhiều size/topping của cùng 1 món', async () => {
      prisma.product.findMany.mockResolvedValueOnce([
        {
          id: 'prod-1',
          name: 'Americano',
          price: 40000,
          stock: 10,
          version: 0,
        },
      ]);

      prisma.product.updateMany = jest.fn().mockResolvedValueOnce({ count: 1 });
      prisma.order.create.mockResolvedValueOnce({
        id: 'order-1',
        code: '#1043',
        status: OrderStatus.PENDING,
        total: 90000,
      });

      const result = await service.createOrder('user-1', {
        items: [
          { productId: 'prod-1', size: Size.S, toppings: [], qty: 1 },
          { productId: 'prod-1', size: Size.L, toppings: [], qty: 2 }, // Tổng 3
        ],
      });

      expect(result.code).toBe('#1043');
      expect(prisma.product.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'prod-1',
          version: 0,
          stock: { gte: 3 },
        },
        data: {
          stock: { decrement: 3 },
          version: { increment: 1 },
        },
      });
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

  describe('createOrder (owner lock mã RW-)', () => {
    const product = {
      id: 'prod-1',
      name: 'Cà phê',
      price: 60000,
      stock: 10,
      version: 0,
    };

    it('nên chặn mã RW- của người khác trước khi validate', async () => {
      prisma.product.findMany.mockResolvedValueOnce([product]);

      await expect(
        service.createOrder('user-1', {
          items: [{ productId: 'prod-1', size: Size.M, toppings: [], qty: 1 }],
          voucherCode: 'RW-ABCD-WXYZ',
        }),
      ).rejects.toThrow('Mã đổi thưởng này không thuộc về tài khoản của bạn');
      expect(vouchersService.validateVoucher).not.toHaveBeenCalled();
    });

    it('nên cho qua mã RW- của chính chủ và truyền userId cho validate', async () => {
      prisma.product.findMany.mockResolvedValueOnce([product]);
      vouchersService.validateVoucher.mockResolvedValueOnce({
        valid: true,
        voucher: { code: 'RW-USER-AAAA' },
        discountAmount: 20000,
      });
      prisma.product.updateMany = jest.fn().mockResolvedValueOnce({ count: 1 });
      prisma.order.create.mockResolvedValueOnce({
        id: 'order-1',
        code: '#1042',
        status: OrderStatus.PENDING,
        total: 40000,
      });

      const result = await service.createOrder('user-1', {
        items: [{ productId: 'prod-1', size: Size.M, toppings: [], qty: 1 }],
        voucherCode: 'RW-USER-AAAA',
      });

      expect(vouchersService.validateVoucher).toHaveBeenCalledWith(
        'RW-USER-AAAA',
        expect.any(Number),
        'user-1',
      );
      expect(result.code).toBe('#1042');
    });

    it('nên cho qua mã dùng chung (WELCOME10) không cần prefix', async () => {
      prisma.product.findMany.mockResolvedValueOnce([product]);
      vouchersService.validateVoucher.mockResolvedValueOnce({
        valid: true,
        voucher: { code: 'WELCOME10' },
        discountAmount: 6000,
      });
      prisma.product.updateMany = jest.fn().mockResolvedValueOnce({ count: 1 });
      prisma.order.create.mockResolvedValueOnce({
        id: 'order-1',
        code: '#1042',
        status: OrderStatus.PENDING,
        total: 54000,
      });

      const result = await service.createOrder('user-1', {
        items: [{ productId: 'prod-1', size: Size.M, toppings: [], qty: 1 }],
        voucherCode: 'WELCOME10',
      });

      expect(vouchersService.validateVoucher).toHaveBeenCalledWith(
        'WELCOME10',
        expect.any(Number),
        'user-1',
      );
      expect(result.code).toBe('#1042');
    });
  });
});
