import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SIZE_PRICES, TOPPING_PRICES } from '../../common/constants/drink-options';

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
}
