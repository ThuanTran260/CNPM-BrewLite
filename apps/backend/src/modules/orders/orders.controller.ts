import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(userId, dto);
  }

  @Post(':id/cancel')
  async cancelOrder(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.cancelOrder(userId, userRole, orderId);
  }

  @Get('me')
  async getMyOrders(@CurrentUser('id') userId: string) {
    return this.ordersService.getOrdersMe(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @Get('staff/active')
  async getActiveOrdersForStaff() {
    return this.ordersService.getAllActiveOrdersForStaff();
  }

  @Get(':id')
  async getOrder(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.getOrderById(userId, userRole, orderId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') orderId: string,
    @Body('to') nextStatus: OrderStatus,
  ) {
    if (!nextStatus) {
      throw new BadRequestException('Vui lòng cung cấp trạng thái mới (to)');
    }
    return this.ordersService.updateOrderStatus(orderId, nextStatus);
  }
}
