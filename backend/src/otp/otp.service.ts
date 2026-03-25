import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OtpService {
  private transporter: nodemailer.Transporter | null = null;
  private twilioClient: any = null;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    this.initEmail();
    this.initTwilio();
  }

  private initEmail() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) return;
    this.transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
  }

  private initTwilio() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Twilio = require('twilio');
    this.twilioClient = Twilio(sid, token);
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private isEmail(target: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target);
  }

  async sendOtp(target: string, channel: 'email' | 'sms' | 'whatsapp') {
    // Validate target matches channel
    if (channel === 'email' && !this.isEmail(target)) {
      throw new BadRequestException('A valid email address is required for email OTP');
    }
    if ((channel === 'sms' || channel === 'whatsapp') && this.isEmail(target)) {
      throw new BadRequestException('A phone number is required for SMS/WhatsApp OTP');
    }

    // Check user exists
    const user = this.isEmail(target)
      ? await this.prisma.user.findUnique({ where: { email: target } })
      : await this.prisma.user.findFirst({ where: { phone: target } });

    if (!user) throw new NotFoundException('No account found with this ' + (this.isEmail(target) ? 'email' : 'phone number'));

    // Invalidate old unused OTPs for this target
    await this.prisma.otpCode.updateMany({
      where: { target, used: false },
      data: { used: true },
    });

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.otpCode.create({ data: { target, code, channel, expiresAt } });

    if (channel === 'email') {
      await this.sendEmail(target, code);
    } else {
      await this.sendTwilio(target, code, channel);
    }

    return { sent: true, channel, maskedTarget: this.mask(target) };
  }

  async verifyOtp(target: string, code: string) {
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        target,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new UnauthorizedException('Invalid or expired OTP');

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    const user = this.isEmail(target)
      ? await this.prisma.user.findUnique({ where: { email: target } })
      : await this.prisma.user.findFirst({ where: { phone: target } });

    if (!user) throw new NotFoundException('Account not found');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const { password, ...safeUser } = user as any;
    return { user: safeUser, ...tokens };
  }

  private mask(target: string): string {
    if (this.isEmail(target)) {
      const [local, domain] = target.split('@');
      return local.slice(0, 2) + '***@' + domain;
    }
    return target.slice(0, 4) + '****' + target.slice(-3);
  }

  private async sendEmail(to: string, code: string) {
    if (!this.transporter) throw new BadRequestException('Email service not configured');
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    await this.transporter.sendMail({
      from: `"OffPlan" <${from}>`,
      to,
      subject: `Your OffPlan verification code: ${code}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <div style="background:#0c4a6e;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <h1 style="color:#fbbf24;margin:0;font-size:28px;letter-spacing:-1px">OffPlan</h1>
            <p style="color:#7dd3fc;margin:8px 0 0;font-size:13px">Fractional Property Investment</p>
          </div>
          <h2 style="color:#111827;font-size:20px;margin:0 0 8px">Your verification code</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Enter this code to sign in to your account. It expires in 10 minutes.</p>
          <div style="background:#f9fafb;border:2px dashed #e5e7eb;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#0c4a6e">${code}</span>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
    });
  }

  private async sendTwilio(to: string, code: string, channel: 'sms' | 'whatsapp') {
    if (!this.twilioClient) throw new BadRequestException('SMS/WhatsApp service not configured');

    const message = `Your OffPlan verification code is: ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.`;

    if (channel === 'whatsapp') {
      const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
      await this.twilioClient.messages.create({
        from,
        to: `whatsapp:${to}`,
        body: message,
      });
    } else {
      await this.twilioClient.messages.create({
        from: process.env.TWILIO_FROM_PHONE,
        to,
        body: message,
      });
    }
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  }
}
