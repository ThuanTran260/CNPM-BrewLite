import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { VouchersService } from './vouchers.service';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post('validate')
  async validate(@Body() body: { code: string; subtotal: number }) {
    if (!body.code || typeof body.subtotal !== 'number') {
      throw new BadRequestException('Vui lòng cung cấp mã giảm giá và tổng tiền');
    }
    return this.vouchersService.validateVoucher(body.code, body.subtotal);
  }
}
