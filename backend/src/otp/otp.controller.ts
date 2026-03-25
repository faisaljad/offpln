import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { IsString, IsIn, IsNotEmpty } from 'class-validator';
import { OtpService } from './otp.service';

class SendOtpDto {
  @IsString() @IsNotEmpty() target: string;
  @IsIn(['email', 'sms', 'whatsapp']) channel: 'email' | 'sms' | 'whatsapp';
}

class VerifyOtpDto {
  @IsString() @IsNotEmpty() target: string;
  @IsString() @IsNotEmpty() code: string;
}

@Controller('auth/otp')
export class OtpController {
  constructor(private otpService: OtpService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  send(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto.target, dto.channel);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verify(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto.target, dto.code);
  }
}
