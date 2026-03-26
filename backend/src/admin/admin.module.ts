import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PropertiesModule } from '../properties/properties.module';
import { InvestmentsModule } from '../investments/investments.module';
import { UsersModule } from '../users/users.module';
import { StorageModule } from '../storage/storage.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PropertiesModule, InvestmentsModule, UsersModule, StorageModule, PaymentsModule, NotificationsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
