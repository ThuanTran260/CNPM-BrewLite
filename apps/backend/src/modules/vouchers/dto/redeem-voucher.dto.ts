import { IsIn } from 'class-validator';

export class RedeemVoucherDto {
  @IsIn([20, 50], { message: 'Số điểm đổi thưởng chỉ chấp nhận 20 hoặc 50 điểm' })
  pointsCost: 20 | 50;
}
