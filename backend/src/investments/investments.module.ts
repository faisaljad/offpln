import { Module } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { PropertiesModule } from '../properties/properties.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PropertiesModule, NotificationsModule],
  providers: [InvestmentsService],
  controllers: [InvestmentsController],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
