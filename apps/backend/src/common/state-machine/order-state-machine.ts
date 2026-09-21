import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

/**
 * Ma trận chuyển đổi trạng thái đơn hàng (Order State Machine)
 * Định nghĩa chuẩn hóa theo Mục 9.1 trong tài liệu đặc tả BrewLite & ADR-007:
 *
 * PENDING -> [PAID, PAYMENT_FAILED, CANCELLED]
 * PAYMENT_FAILED -> [PENDING, CANCELLED]
 * PAID -> [PREPARING, CANCELLED]
 * PREPARING -> [READY]
 * READY -> [COMPLETED]
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PAID,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAYMENT_FAILED]: [
    OrderStatus.PENDING,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAID]: [
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PREPARING]: [
    OrderStatus.READY,
  ],
  [OrderStatus.READY]: [
    OrderStatus.COMPLETED,
  ],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function assertTransition(currentStatus: OrderStatus, nextStatus: OrderStatus): void {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new BadRequestException(
      `Chuyển đổi trạng thái không hợp lệ: Không thể chuyển từ [${currentStatus}] sang [${nextStatus}]`,
    );
  }
}
