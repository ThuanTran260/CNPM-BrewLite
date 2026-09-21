import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertTransition } from '../../common/state-machine/order-state-machine';

@Injectable()
export class OrdersCleanupService {
  private readonly logger = new Logger('OrdersCleanupService');

  constructor(private readonly prisma: PrismaService) {}

  // Quét định kỳ mỗi 5 phút dọn các đơn PENDING quá hạn 15 phút theo ADR-007
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredOrdersCleanup() {
    this.logger.log('Bắt đầu quét đơn hàng PENDING hết hạn (Timeout 15 phút)...');

    const now = new Date();
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        expiresAt: {
          lt: now,
        },
      },
      include: {
        items: true,
      },
    });

    if (expiredOrders.length === 0) {
      return;
    }

    this.logger.warn(`Phát hiện ${expiredOrders.length} đơn PENDING quá hạn. Bắt đầu hoàn kho và hủy đơn...`);

    for (const order of expiredOrders) {
      try {
        assertTransition(order.status, OrderStatus.CANCELLED);

        await this.prisma.$transaction(async (tx) => {
          // 1. Hoàn lại số lượng tồn kho cho các sản phẩm
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.qty },
                version: { increment: 1 },
              },
            });
          }

          // 2. Chuyển trạng thái đơn sang CANCELLED
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.CANCELLED,
            },
          });
        });

        this.logger.log(`✅ Đã tự động thu hồi kho & hủy đơn quá hạn: ${order.code}`);
      } catch (err) {
        this.logger.error(`❌ Lỗi khi dọn dẹp đơn ${order.code}:`, err);
      }
    }
  }
}
