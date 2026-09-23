import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProductDto {
  @IsString({ message: 'Tên sản phẩm phải là chuỗi hợp lệ' })
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @IsOptional()
  name?: string;

  @IsInt({ message: 'Giá phải là số nguyên' })
  @Min(0, { message: 'Giá tối thiểu là 0' })
  @IsOptional()
  price?: number;

  @IsInt({ message: 'Tồn kho phải là số nguyên' })
  @Min(0, { message: 'Tồn kho tối thiểu là 0' })
  @IsOptional()
  stock?: number;

  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @IsOptional()
  description?: string;

  @IsString({ message: 'URL hình ảnh phải là chuỗi ký tự' })
  @IsOptional()
  imageUrl?: string;
}
