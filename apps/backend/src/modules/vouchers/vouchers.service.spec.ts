import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Prisma, VoucherType } from '@prisma/client';
import {
  VouchersService,
  toShortId,
  OWNER_MISMATCH_MESSAGE,
} from './vouchers.service';
import { PrismaService } from '../prisma/prisma.service';

const USER_ID = 'abcd1234-5678-90ab-cdef-1234567890ab'; // shortId ABCD
const FOREIGN_CODE = 'RW-ZZZZ-QQQQ';
const OWN_CODE = 'RW-ABCD-WXYZ';

describe('VouchersService', () => {
  let service: VouchersService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      voucher: {
        findUnique: jest.fn(),
        create: jest.fn((args) => Promise.resolve({ ...args.data, usedCount: 0 })),
        findMany: jest.fn(),
      },
      user: {
        updateMany: jest.fn(),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VouchersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<VouchersService>(VouchersService);
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('toShortId', () => {
    it('nên lấy 4 ký tự đầu của uuid viết hoa', () => {
      expect(toShortId(USER_ID)).toBe('ABCD');
    });
  });

  describe('redeemPoints', () => {
    it('nên đổi 20 điểm đúng spec và trừ điểm nguyên tử', async () => {
      prisma.user.updateMany.mockResolvedValueOnce({ count: 1 });
      prisma.user.findUnique.mockResolvedValueOnce({ loyaltyPoints: 80 });

      const before = Date.now();
      const result = await service.redeemPoints(USER_ID, 20);
      const after = Date.now();

      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: USER_ID, loyaltyPoints: { gte: 20 } },
        data: { loyaltyPoints: { decrement: 20 } },
      });
      expect(prisma.voucher.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: VoucherType.FIXED,
          value: 20000,
          minOrder: 50000,
          usageLimit: 1,
        }),
      });
      expect(result.voucher.value).toBe(20000);
      expect(result.voucher.minOrder).toBe(50000);
      expect(result.remainingPoints).toBe(80);
      const expiresAt = new Date(result.voucher.expiresAt).getTime();
      expect(expiresAt).toBeGreaterThanOrEqual(before + 30 * 24 * 60 * 60 * 1000);
      expect(expiresAt).toBeLessThanOrEqual(after + 30 * 24 * 60 * 60 * 1000);
    });

    it('nên đổi 50 điểm đúng spec', async () => {
      prisma.user.updateMany.mockResolvedValueOnce({ count: 1 });
      prisma.user.findUnique.mockResolvedValueOnce({ loyaltyPoints: 10 });

      const result = await service.redeemPoints(USER_ID, 50);

      expect(prisma.voucher.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: VoucherType.FIXED,
          value: 50000,
          minOrder: 100000,
          usageLimit: 1,
        }),
      });
      expect(result.voucher.value).toBe(50000);
      expect(result.remainingPoints).toBe(10);
    });

    it('nên sinh mã định dạng RW-XXXX-YYYY viết hoa', async () => {
      prisma.user.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 60 });

      const result = await service.redeemPoints(USER_ID, 20);

      expect(result.voucher.code).toMatch(/^RW-ABCD-[A-Z0-9]{4}$/);
    });

    it('nên ném BadRequestException khi số dư không đủ (count 0)', async () => {
      prisma.user.updateMany.mockResolvedValueOnce({ count: 0 });

      await expect(service.redeemPoints(USER_ID, 20)).rejects.toThrow(
        'Số dư điểm tích lũy không đủ hoặc có giao dịch đang xử lý đồng thời',
      );
      expect(prisma.voucher.create).not.toHaveBeenCalled();
    });

    it('nên ném BadRequestException khi pointsCost không hợp lệ', async () => {
      await expect(service.redeemPoints(USER_ID, 30 as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it('nên thử lại với mã mới khi trùng mã (P2002)', async () => {
      prisma.user.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 80 });
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`code`)',
        { code: 'P2002', clientVersion: 'test' },
      );
      prisma.voucher.create
        .mockRejectedValueOnce(p2002)
        .mockImplementationOnce((args) => Promise.resolve({ ...args.data, usedCount: 0 }));

      const result = await service.redeemPoints(USER_ID, 20);

      expect(prisma.voucher.create).toHaveBeenCalledTimes(2);
      expect(result.voucher.code).toMatch(/^RW-ABCD-[A-Z0-9]{4}$/);
    });
  });

  describe('validateVoucher (owner lock)', () => {
    const usableVoucher = {
      code: OWN_CODE,
      type: VoucherType.FIXED,
      value: 20000,
      minOrder: 50000,
      usageLimit: 1,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 86400000),
    };

    it('nên chặn mã RW- của người khác khi có userId', async () => {
      await expect(service.validateVoucher(FOREIGN_CODE, 200000, USER_ID)).rejects.toThrow(
        OWNER_MISMATCH_MESSAGE,
      );
      expect(prisma.voucher.findUnique).not.toHaveBeenCalled();
    });

    it('nên cho qua mã RW- của chính chủ', async () => {
      prisma.voucher.findUnique.mockResolvedValueOnce(usableVoucher);

      const result = await service.validateVoucher(OWN_CODE, 60000, USER_ID);

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(20000);
    });

    it('nên cho qua mã dùng chung (WELCOME10) khi có userId', async () => {
      prisma.voucher.findUnique.mockResolvedValueOnce({
        code: 'WELCOME10',
        type: VoucherType.PERCENT,
        value: 10,
        minOrder: 0,
        usageLimit: null,
        usedCount: 5,
        expiresAt: null,
      });

      const result = await service.validateVoucher('WELCOME10', 100000, USER_ID);

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(10000);
    });

    it('nên giữ nguyên hành vi ẩn danh khi không có userId', async () => {
      prisma.voucher.findUnique.mockResolvedValueOnce({
        ...usableVoucher,
        code: FOREIGN_CODE,
      });

      const result = await service.validateVoucher(FOREIGN_CODE, 60000);

      expect(result.valid).toBe(true);
      expect(prisma.voucher.findUnique).toHaveBeenCalledWith({
        where: { code: FOREIGN_CODE },
      });
    });
  });

  describe('getMyVouchers', () => {
    it('nên chỉ trả mã dùng chung còn lượt + mã của chính chủ chưa dùng', async () => {
      prisma.voucher.findMany.mockResolvedValueOnce([
        {
          code: 'WELCOME10',
          type: VoucherType.PERCENT,
          value: 10,
          minOrder: 0,
          usageLimit: null,
          usedCount: 99,
          expiresAt: null,
        },
        {
          code: 'HETHAN',
          type: VoucherType.FIXED,
          value: 5000,
          minOrder: 0,
          usageLimit: 10,
          usedCount: 10,
          expiresAt: null,
        },
        {
          code: OWN_CODE,
          type: VoucherType.FIXED,
          value: 20000,
          minOrder: 50000,
          usageLimit: 1,
          usedCount: 0,
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          code: 'RW-ABCD-USED',
          type: VoucherType.FIXED,
          value: 20000,
          minOrder: 50000,
          usageLimit: 1,
          usedCount: 1,
          expiresAt: new Date(Date.now() + 86400000),
        },
      ]);

      const result = await service.getMyVouchers(USER_ID);
      const codes = result.map((v) => v.code);

      expect(codes).toContain('WELCOME10');
      expect(codes).toContain(OWN_CODE);
      expect(codes).not.toContain('HETHAN');
      expect(codes).not.toContain('RW-ABCD-USED');
      expect(Object.keys(result[0]).sort()).toEqual(
        ['code', 'expiresAt', 'minOrder', 'type', 'value'],
      );
    });

    it('nên lọc theo prefix của caller và loại trừ RW- lạ bằng startsWith', async () => {
      prisma.voucher.findMany.mockResolvedValueOnce([]);

      await service.getMyVouchers(USER_ID);

      expect(prisma.voucher.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                { code: { startsWith: 'RW-ABCD-' } },
                { NOT: { code: { startsWith: 'RW-' } } },
              ]),
            }),
          ]),
        }),
      });
    });
  });
});
