import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, VoucherType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const OWNER_MISMATCH_MESSAGE = 'Mã đổi thưởng này không thuộc về tài khoản của bạn';

// 4 ký tự đầu của uuid (bỏ dấu gạch ngang), viết hoa. VD: abcd1234-... -> ABCD
export function toShortId(userId: string): string {
  return userId.replace(/-/g, '').slice(0, 4).toUpperCase();
}

const REDEEM_SPECS: Record<
  number,
  { type: VoucherType; value: number; minOrder: number; usageLimit: number }
> = {
  20: { type: VoucherType.FIXED, value: 20000, minOrder: 50000, usageLimit: 1 },
  50: { type: VoucherType.FIXED, value: 50000, minOrder: 100000, usageLimit: 1 },
};

const MAX_CODE_ATTEMPTS = 5;

@Injectable()
export class VouchersService {
  constructor(private readonly prisma: PrismaService) {}

  async validateVoucher(code: string, subtotal: number, userId?: string) {
    const normalized = code.toUpperCase().trim();

    // Khóa owner cho mã đổi thưởng RW-: chỉ chủ sở hữu mới được dùng
    if (
      userId &&
      normalized.startsWith('RW-') &&
      !normalized.startsWith(`RW-${toShortId(userId)}-`)
    ) {
      throw new BadRequestException(OWNER_MISMATCH_MESSAGE);
    }

    const voucher = await this.prisma.voucher.findUnique({
      where: { code: normalized },
    });

    if (!voucher) {
      throw new NotFoundException(`Mã giảm giá [${code}] không tồn tại`);
    }

    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      throw new BadRequestException(`Mã giảm giá [${code}] đã hết hạn sử dụng`);
    }

    if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
      throw new BadRequestException(`Mã giảm giá [${code}] đã hết lượt sử dụng`);
    }

    if (subtotal < voucher.minOrder) {
      throw new BadRequestException(
        `Mã giảm giá này chỉ áp dụng cho đơn hàng tối thiểu từ ${voucher.minOrder.toLocaleString('vi-VN')}đ`,
      );
    }

    let discountAmount = 0;
    if (voucher.type === VoucherType.PERCENT) {
      discountAmount = Math.round((subtotal * voucher.value) / 100);
    } else if (voucher.type === VoucherType.FIXED) {
      discountAmount = voucher.value;
    }

    // Không giảm vượt quá subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return {
      valid: true,
      voucher,
      discountAmount,
    };
  }

  async redeemPoints(userId: string, pointsCost: 20 | 50) {
    const spec = REDEEM_SPECS[pointsCost];
    if (!spec) {
      throw new BadRequestException('Số điểm đổi thưởng chỉ chấp nhận 20 hoặc 50 điểm');
    }

    const shortId = toShortId(userId);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Trừ điểm nguyên tử (chống race condition) + tạo voucher.
    // Toàn bộ transaction được thử lại khi trùng mã (P2002) vì rollback
    // đã hoàn lại số điểm đã trừ, nên thử lại là an toàn.
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const deduct = await tx.user.updateMany({
            where: { id: userId, loyaltyPoints: { gte: pointsCost } },
            data: { loyaltyPoints: { decrement: pointsCost } },
          });

          if (deduct.count === 0) {
            throw new BadRequestException(
              'Số dư điểm tích lũy không đủ hoặc có giao dịch đang xử lý đồng thời',
            );
          }

          const code = `RW-${shortId}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

          const voucher = await tx.voucher.create({
            data: {
              code,
              type: spec.type,
              value: spec.value,
              minOrder: spec.minOrder,
              usageLimit: spec.usageLimit,
              expiresAt,
            },
          });

          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { loyaltyPoints: true },
          });

          return {
            voucher: {
              code: voucher.code,
              type: voucher.type,
              value: voucher.value,
              minOrder: voucher.minOrder,
              expiresAt: voucher.expiresAt,
            },
            remainingPoints: user?.loyaltyPoints ?? 0,
          };
        });
      } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          continue;
        }
        throw err;
      }
    }

    throw new BadRequestException(
      'Không thể tạo mã đổi thưởng lúc này, vui lòng thử lại sau',
    );
  }

  async getMyVouchers(userId: string) {
    const prefix = `RW-${toShortId(userId)}-`;
    const now = new Date();

    const vouchers = await this.prisma.voucher.findMany({
      where: {
        AND: [
          {
            OR: [
              // Mã của chính caller
              { code: { startsWith: prefix } },
              // Mã dùng chung toàn sàn (không phải mã RW- của bất kỳ ai)
              { NOT: { code: { startsWith: 'RW-' } } },
            ],
          },
          // Còn hạn sử dụng (hoặc không có hạn)
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        ],
      },
    });

    // Lọc lượt dùng còn lại trong JS vì Prisma không so sánh 2 cột
    // (usedCount < usageLimit); mã riêng usageLimit 1 nên chỉ còn mã chưa dùng.
    return vouchers
      .filter((v) => v.usageLimit === null || v.usedCount < v.usageLimit)
      .map((v) => ({
        code: v.code,
        type: v.type,
        value: v.value,
        minOrder: v.minOrder,
        expiresAt: v.expiresAt,
      }));
  }
}
