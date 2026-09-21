import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { assertTransition } from '../../common/state-machine/order-state-machine';

export interface PaymentResult {
  status: string;
  message: string;
  orderId: string;
  code?: string;
  idempotentReplay?: boolean;
  loyaltyPointsEarned?: number;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('PaymentsService');

  constructor(private readonly prisma: PrismaService) {}

  async processPayment(
    userId: string,
    idempotencyKey: string,
    dto: ProcessPaymentDto,
  ): Promise<PaymentResult> {
    if (!idempotencyKey || idempotencyKey.trim() === '') {
      throw new BadRequestException('Bắt buộc phải có header [Idempotency-Key]');
    }

    const trimmedKey = idempotencyKey.trim();

    // 1. Kiểm tra Idempotency-Key trong bảng Payment
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: trimmedKey },
      include: { order: true },
    });

    if (existingPayment) {
      // Nếu cùng orderId: Idempotent Replay -> Trả về kết quả cũ, không trừ tiền lần 2
      if (existingPayment.orderId === dto.orderId) {
        this.logger.log(
          `Idempotent replay for key [${trimmedKey}], order [${dto.orderId}], status: ${existingPayment.status}`,
        );
        return {
          idempotentReplay: true,
          status: existingPayment.status === PaymentStatus.SUCCESS ? 'PAID' : 'FAILED',
          message:
            existingPayment.status === PaymentStatus.SUCCESS
              ? 'Thanh toán thành công (Phản hồi Idempotent)'
              : 'Giao dịch thanh toán trước đó đã thất bại',
          orderId: existingPayment.orderId,
          code: existingPayment.order.code,
        };
      } else {
        // Khác orderId mà trùng key -> ném 422 Unprocessable Entity
        throw new UnprocessableEntityException(
          `Idempotency-Key [${trimmedKey}] đã được sử dụng cho một đơn hàng khác`,
        );
      }
    }

    // 2. Tìm đơn hàng cần thanh toán
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng: ${dto.orderId}`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Bạn không phải là chủ sở hữu đơn hàng này');
    }

    // 3. Kiểm tra tính hợp lệ qua State Machine
    const targetStatus = dto.forceFail ? OrderStatus.PAYMENT_FAILED : OrderStatus.PAID;
    assertTransition(order.status, targetStatus);

    // 4. Xử lý thanh toán trong Transaction có bắt lỗi P2002 (ADR-007 chống Race Condition)
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.forceFail) {
          // Kịch bản GIẢ LẬP LỖI (Để demo kiểm thử Task 8 & 10)
          await tx.payment.create({
            data: {
              orderId: order.id,
              idempotencyKey: trimmedKey,
              amount: order.total,
              method: dto.method,
              status: PaymentStatus.FAILED,
            },
          });

          await tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.PAYMENT_FAILED },
          });

          // Hoàn trả lại tồn kho vào sản phẩm
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.qty },
                version: { increment: 1 },
              },
            });
          }

          this.logger.warn(`Payment FAILED (simulated) for order ${order.code}, stock restocked`);
          return {
            status: 'FAILED',
            message: 'Thanh toán thất bại (Giả lập lỗi: Thẻ không đủ số dư)',
            orderId: order.id,
            code: order.code,
          };
        } else {
          // Kịch bản THANH TOÁN THÀNH CÔNG
          await tx.payment.create({
            data: {
              orderId: order.id,
              idempotencyKey: trimmedKey,
              amount: order.total,
              method: dto.method,
              status: PaymentStatus.SUCCESS,
            },
          });

          await tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.PAID },
          });

          // Nếu có dùng voucher, tăng usedCount
          if (order.voucherCode) {
            await tx.voucher.update({
              where: { code: order.voucherCode },
              data: { usedCount: { increment: 1 } },
            });
          }

          // Cộng điểm thưởng Loyalty: 1 điểm cho mỗi 10.000đ
          const pointsEarned = Math.floor(order.total / 10000);
          if (pointsEarned > 0) {
            await tx.user.update({
              where: { id: userId },
              data: { loyaltyPoints: { increment: pointsEarned } },
            });
          }

          this.logger.log(
            `Payment SUCCESS for order ${order.code}. Earned +${pointsEarned} loyalty points.`,
          );

          return {
            status: 'PAID',
            message: 'Thanh toán không tiền mặt thành công',
            orderId: order.id,
            code: order.code,
            loyaltyPointsEarned: pointsEarned,
          };
        }
      });
    } catch (err: any) {
      // Bắt lỗi Prisma P2002 nếu có 2 request song song lọt qua lookup bước 1
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        this.logger.warn(`Caught P2002 race condition on key [${trimmedKey}]. Fetching existing payment.`);
        const racePayment = await this.prisma.payment.findUnique({
          where: { idempotencyKey: trimmedKey },
          include: { order: true },
        });

        if (racePayment) {
          return {
            idempotentReplay: true,
            status: racePayment.status === PaymentStatus.SUCCESS ? 'PAID' : 'FAILED',
            message: 'Thanh toán thành công (Bắt qua cơ chế P2002 Race-Defense)',
            orderId: racePayment.orderId,
            code: racePayment.order.code,
          };
        }
      }
      throw err;
    }
  }
}
