import { Module } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [PropertiesModule],
  providers: [InvestmentsService],
  controllers: [InvestmentsController],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
