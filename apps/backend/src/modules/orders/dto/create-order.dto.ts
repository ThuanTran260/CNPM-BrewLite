import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Size } from '@prisma/client';

export class CreateOrderItemDto {
  @IsString({ message: 'productId phải là chuỗi hợp lệ' })
  @IsNotEmpty({ message: 'productId không được để trống' })
  productId: string;

  @IsEnum(Size, { message: 'Size không hợp lệ (chỉ chấp nhận S, M, L)' })
  size: Size;

  @IsArray({ message: 'toppings phải là danh sách mảng' })
  @IsString({ each: true, message: 'Tên topping phải là chuỗi' })
  @IsOptional()
  toppings: string[] = [];

  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  qty: number;
}

export class CreateOrderDto {
  @IsArray({ message: 'Danh sách món đặt hàng không hợp lệ' })
  @ArrayMinSize(1, { message: 'Đơn hàng phải có ít nhất 1 món' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString({ message: 'Mã voucher phải là chuỗi ký tự' })
  @IsOptional()
  voucherCode?: string;
}
