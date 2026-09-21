import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersCleanupService } from './orders-cleanup.service';
import { OrdersController } from './orders.controller';
import { VouchersModule } from '../vouchers/vouchers.module';

@Module({
  imports: [VouchersModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersCleanupService],
  exports: [OrdersService],
})
export class OrdersModule {}
