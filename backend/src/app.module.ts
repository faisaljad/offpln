import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { InvestmentsModule } from './investments/investments.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { StorageModule } from './storage/storage.module';
import { OtpModule } from './otp/otp.module';
import { SettingsModule } from './settings/settings.module';
import { TransfersModule } from './transfers/transfers.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60') * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    InvestmentsModule,
    PaymentsModule,
    AdminModule,
    StorageModule,
    OtpModule,
    SettingsModule,
    TransfersModule,
  ],
})
export class AppModule {}
