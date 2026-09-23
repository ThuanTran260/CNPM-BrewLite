import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SIZE_PRICES, TOPPING_PRICES } from '../../common/constants/drink-options';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return {
      items: products.map((p) => ({
        ...p,
        inStock: p.stock > 0,
      })),
      options: {
        sizes: Object.entries(SIZE_PRICES).map(([name, priceDelta]) => ({
          name,
          priceDelta,
        })),
        toppings: Object.entries(TOPPING_PRICES).map(([name, priceDelta]) => ({
          name,
          priceDelta,
        })),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có ID: ${id}`);
    }

    return {
      ...product,
      inStock: product.stock > 0,
      options: {
        sizes: Object.entries(SIZE_PRICES).map(([name, priceDelta]) => ({
          name,
          priceDelta,
        })),
        toppings: Object.entries(TOPPING_PRICES).map(([name, priceDelta]) => ({
          name,
          priceDelta,
        })),
      },
    };
  }

  async createProduct(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        price: dto.price,
        stock: dto.stock,
        // Schema yêu cầu description/imageUrl (NOT NULL, không default)
        // nên DTO optional phải được thay bằng chuỗi rỗng khi vắng mặt.
        description: dto.description ?? '',
        imageUrl: dto.imageUrl ?? '',
        version: 0,
      },
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có ID: ${id}`);
    }

    // Thay đổi stock hoặc price làm tăng version để Optimistic Locking
    // của đơn hàng đang xử lý phát hiện xung đột (409) thay vì ghi đè lặng lẽ.
    const bumpVersion = dto.stock !== undefined || dto.price !== undefined;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        ...(bumpVersion ? { version: { increment: 1 } } : {}),
      },
    });
  }
}
