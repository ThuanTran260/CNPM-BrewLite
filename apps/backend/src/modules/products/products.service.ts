import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SIZE_PRICES, TOPPING_PRICES } from '../../common/constants/drink-options';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

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

  async syncInventory() {
    // 1. Lấy toàn bộ sản phẩm
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // 2. Lấy toàn bộ order items của các đơn hàng đang hoạt động hoặc hoàn tất
    // (PENDING, PAID, PREPARING, READY, COMPLETED).
    // Các đơn CANCELLED hoặc PAYMENT_FAILED đã được hoàn kho tự động nên không tính vào số lượng tiêu thụ.
    const activeStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.COMPLETED,
    ];

    const activeOrderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          status: { in: activeStatuses },
        },
      },
      select: {
        productId: true,
        qty: true,
      },
    });

    // 3. Tính tổng số ly đã đặt theo từng productId
    const consumedMap = new Map<string, number>();
    for (const item of activeOrderItems) {
      consumedMap.set(
        item.productId,
        (consumedMap.get(item.productId) || 0) + item.qty,
      );
    }

    // 4. Đối chiếu tồn kho lý thuyết (Base Stock - Consumed)
    // Quy chuẩn base stock mặc định: 1 cho sản phẩm Limited/Giới hạn, 100 cho các món tiêu chuẩn
    const adjustedProducts: Array<{
      id: string;
      name: string;
      oldStock: number;
      newStock: number;
      consumed: number;
    }> = [];

    await this.prisma.$transaction(async (tx) => {
      for (const p of products) {
        const isLimited = p.name.includes('Limited') || p.name.includes('Giới hạn');
        const baseStock = isLimited ? 1 : 100;
        const consumed = consumedMap.get(p.id) || 0;
        const newStock = Math.max(0, baseStock - consumed);

        if (p.stock !== newStock) {
          await tx.product.update({
            where: { id: p.id },
            data: {
              stock: newStock,
              version: { increment: 1 },
            },
          });

          adjustedProducts.push({
            id: p.id,
            name: p.name,
            oldStock: p.stock,
            newStock,
            consumed,
          });
        }
      }
    });

    this.logger.log(
      `[InventorySync] Hoàn tất đồng bộ tồn kho: ${adjustedProducts.length}/${products.length} sản phẩm được điều chỉnh.`,
    );

    return {
      message: `Đã đồng bộ tồn kho thành công cho ${products.length} món trong thực đơn`,
      adjustedCount: adjustedProducts.length,
      adjustedProducts,
    };
  }
}
