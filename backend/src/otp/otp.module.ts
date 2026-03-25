import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret',
    }),
  ],
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule {}
