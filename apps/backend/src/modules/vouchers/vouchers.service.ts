import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { VoucherType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VouchersService {
  constructor(private readonly prisma: PrismaService) {}

  async validateVoucher(code: string, subtotal: number) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code: code.toUpperCase().trim() },
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
}
