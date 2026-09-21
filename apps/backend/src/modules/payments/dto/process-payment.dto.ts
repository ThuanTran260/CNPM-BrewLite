import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class ProcessPaymentDto {
  @IsString({ message: 'orderId phải là chuỗi hợp lệ' })
  @IsNotEmpty({ message: 'orderId không được để trống' })
  orderId: string;

  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán phải là E_WALLET hoặc BANK_CARD' })
  method: PaymentMethod;

  @IsBoolean({ message: 'forceFail phải là giá trị boolean' })
  @IsOptional()
  forceFail?: boolean;
}
