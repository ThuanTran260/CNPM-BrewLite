import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VouchersService, toShortId, OWNER_MISMATCH_MESSAGE } from '../vouchers/vouchers.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { calculateItemUnitPrice } from '../../common/constants/drink-options';
import { assertTransition } from '../../common/state-machine/order-state-machine';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger('OrdersService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly vouchersService: VouchersService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Đơn hàng phải có ít nhất một món');
    }

    // 1. Tải danh sách sản phẩm từ DB để bảo vệ tính toàn vẹn giá (chống fake giá client)
    const productIds = dto.items.map((i) => i.productId);
    const dbProducts = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 2. Tính toán chi phí đơn hàng và kiểm tra tổng tồn kho theo từng món
    const totalQtyByProductId = new Map<string, number>();
    for (const item of dto.items) {
      totalQtyByProductId.set(
        item.productId,
        (totalQtyByProductId.get(item.productId) || 0) + item.qty,
      );
    }

    for (const [productId, totalQty] of totalQtyByProductId.entries()) {
      const product = productMap.get(productId);
      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm có ID: ${productId}`);
      }

      if (product.stock < totalQty) {
        throw new ConflictException(
          `Sản phẩm [${product.name}] không đủ số lượng tồn kho (chỉ còn ${product.stock} ly)`,
        );
      }
    }

    let subtotal = 0;
    const computedItems: Array<{
      productId: string;
      productName: string;
      size: any;
      toppings: string[];
      qty: number;
      unitPrice: number;
      lineTotal: number;
      curVersion: number;
    }> = [];

    for (const item of dto.items) {
      const product = productMap.get(item.productId)!;
      const unitPrice = calculateItemUnitPrice(product.price, item.size, item.toppings);
      const lineTotal = unitPrice * item.qty;
      subtotal += lineTotal;

      computedItems.push({
        productId: product.id,
        productName: product.name,
        size: item.size,
        toppings: item.toppings || [],
        qty: item.qty,
        unitPrice,
        lineTotal,
        curVersion: product.version,
      });
    }

    // 3. Xử lý Voucher (nếu có)
    let discountAmount = 0;
    let appliedVoucherCode: string | null = null;

    if (dto.voucherCode) {
      // Khóa owner: mã đổi thưởng RW- chỉ chủ sở hữu mới được dùng,
      // chặn trước khi validate/use. Mã dùng chung (WELCOME10...) không ảnh hưởng.
      const normalizedCode = dto.voucherCode.toUpperCase().trim();
      if (
        normalizedCode.startsWith('RW-') &&
        !normalizedCode.startsWith(`RW-${toShortId(userId)}-`)
      ) {
        throw new BadRequestException(OWNER_MISMATCH_MESSAGE);
      }
      const voucherResult = await this.vouchersService.validateVoucher(
        dto.voucherCode,
        subtotal,
        userId,
      );
      discountAmount = voucherResult.discountAmount;
      appliedVoucherCode = voucherResult.voucher.code;
    }

    const total = Math.max(0, subtotal - discountAmount);

    // 4. Mở Database Transaction với Optimistic Locking
    const order = await this.prisma.$transaction(async (tx) => {
      // Trừ kho có điều kiện (version check theo từng món duy nhất để tránh race giữa các dòng cùng món)
      for (const [productId, totalQty] of totalQtyByProductId.entries()) {
        const product = productMap.get(productId)!;
        const updateResult = await tx.product.updateMany({
          where: {
            id: productId,
            version: product.version,
            stock: { gte: totalQty },
          },
          data: {
            stock: { decrement: totalQty },
            version: { increment: 1 },
          },
        });

        // Nếu số dòng update = 0 nghĩa là có race condition (version đã bị thay đổi bởi người khác)
        if (updateResult.count === 0) {
          throw new ConflictException(
            `Sản phẩm [${product.name}] đã có thay đổi tồn kho hoặc vừa hết hàng. Vui lòng thử lại.`,
          );
        }
      }

      // Tạo mã đơn hàng duy nhất, ví dụ: #1042
      const orderCount = await tx.order.count();
      const code = `#${1001 + orderCount}`;

      // Thiết lập timeout 15 phút cho PENDING theo ADR-007
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Lưu Order
      const newOrder = await tx.order.create({
        data: {
          code,
          userId,
          status: OrderStatus.PENDING,
          subtotal,
          discountAmount,
          total,
          voucherCode: appliedVoucherCode,
          expiresAt,
          items: {
            create: computedItems.map((ci) => ({
              productId: ci.productId,
              productName: ci.productName,
              size: ci.size,
              toppings: ci.toppings,
              qty: ci.qty,
              unitPrice: ci.unitPrice,
              lineTotal: ci.lineTotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return newOrder;
    });

    this.logger.log(`Created order ${order.code} (PENDING) for user ${userId}`);
    return order;
  }

  async cancelOrder(userId: string, userRole: Role, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng có ID: ${orderId}`);
    }

    // Phân quyền hủy theo ADR-007:
    // - Khách hàng chỉ được hủy đơn của mình khi PENDING hoặc PAYMENT_FAILED
    // - Staff / Admin được hủy khi đơn ở trạng thái PAID (chưa sang PREPARING)
    const isOwner = order.userId === userId;
    const isStaffOrAdmin = userRole === Role.STAFF || userRole === Role.ADMIN;

    if (!isOwner && !isStaffOrAdmin) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này');
    }

    if (isStaffOrAdmin) {
      // Nhân viên hoặc Quản trị viên được phép hủy đơn PENDING, PAYMENT_FAILED hoặc PAID (chưa chuyển sang PREPARING)
      if (
        order.status !== OrderStatus.PENDING &&
        order.status !== OrderStatus.PAYMENT_FAILED &&
        order.status !== OrderStatus.PAID
      ) {
        throw new BadRequestException('Chỉ được hủy đơn khi chưa bắt đầu pha chế');
      }
    } else if (isOwner) {
      // Khách hàng thông thường chỉ được hủy đơn khi chưa thanh toán (PENDING hoặc PAYMENT_FAILED)
      if (
        order.status !== OrderStatus.PENDING &&
        order.status !== OrderStatus.PAYMENT_FAILED
      ) {
        throw new BadRequestException('Khách hàng chỉ được hủy đơn khi chưa thanh toán');
      }
    }

    // Kiểm tra tính hợp lệ qua State Machine
    assertTransition(order.status, OrderStatus.CANCELLED);

    // Transaction cập nhật CANCELLED và hoàn trả tồn kho
    const cancelledOrder = await this.prisma.$transaction(async (tx) => {
      // Chỉ hoàn kho nếu đơn hàng đang chiếm giữ tồn kho (PENDING hoặc PAID).
      // Đối với đơn PAYMENT_FAILED, tồn kho đã được hoàn tự động lúc thanh toán thất bại, tuyệt đối không hoàn lần 2.
      if (order.status !== OrderStatus.PAYMENT_FAILED) {
        const totalQtyByProductId = new Map<string, number>();
        for (const item of order.items) {
          totalQtyByProductId.set(
            item.productId,
            (totalQtyByProductId.get(item.productId) || 0) + item.qty,
          );
        }

        for (const [productId, totalQty] of totalQtyByProductId.entries()) {
          await tx.product.update({
            where: { id: productId },
            data: {
              stock: { increment: totalQty },
              version: { increment: 1 },
            },
          });
        }
      }

      return tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
        },
        include: { items: true },
      });
    });

    this.logger.log(`Order ${order.code} cancelled (restocked: ${order.status !== OrderStatus.PAYMENT_FAILED}) by user ${userId}`);
    return cancelledOrder;
  }

  async getOrdersMe(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(userId: string, userRole: Role, orderId: string) {
    let order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng: ${orderId}`);
    }

    // Kiểm tra quyền sở hữu
    if (order.userId !== userId && userRole !== Role.STAFF && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này');
    }

    // Cơ chế Lazy-Check Timeout 15p theo ADR-007
    if (
      order.status === OrderStatus.PENDING &&
      order.expiresAt &&
      order.expiresAt.getTime() < Date.now()
    ) {
      this.logger.warn(`Order ${order.code} expired (15m timeout). Auto-cancelling lazily.`);
      order = await this.cancelExpiredOrder(order.id);
    }

    return order;
  }

  async updateOrderStatus(orderId: string, nextStatus: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng: ${orderId}`);
    }

    assertTransition(order.status, nextStatus);

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
      include: { items: true },
    });
  }

  async getAllActiveOrdersForStaff() {
    return this.prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY],
        },
      },
      include: {
        items: true,
        user: {
          select: { email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async cancelExpiredOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });

    if (!order || order.status !== OrderStatus.PENDING) return order;

    return this.prisma.$transaction(async (tx) => {
      const totalQtyByProductId = new Map<string, number>();
      for (const item of order.items) {
        totalQtyByProductId.set(
          item.productId,
          (totalQtyByProductId.get(item.productId) || 0) + item.qty,
        );
      }

      for (const [productId, totalQty] of totalQtyByProductId.entries()) {
        await tx.product.update({
          where: { id: productId },
          data: {
            stock: { increment: totalQty },
            version: { increment: 1 },
          },
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
        include: { items: true, payments: true },
      });
    });
  }
}
