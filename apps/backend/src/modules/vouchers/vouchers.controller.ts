import {
  Controller,
  Post,
  Get,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { RedeemVoucherDto } from './dto/redeem-voucher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post('validate')
  @UseGuards(OptionalJwtAuthGuard)
  async validate(
    @Body() body: { code: string; subtotal: number },
    @CurrentUser('id') userId?: string,
  ) {
    if (!body.code || typeof body.subtotal !== 'number') {
      throw new BadRequestException('Vui lòng cung cấp mã giảm giá và tổng tiền');
    }
    return this.vouchersService.validateVoucher(body.code, body.subtotal, userId ?? undefined);
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  async redeem(@CurrentUser('id') userId: string, @Body() dto: RedeemVoucherDto) {
    if (!userId) {
      throw new BadRequestException('Vui lòng đăng nhập để đổi điểm thưởng');
    }
    return this.vouchersService.redeemPoints(userId, dto.pointsCost);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyVouchers(@CurrentUser('id') userId: string) {
    return this.vouchersService.getMyVouchers(userId);
  }
}
