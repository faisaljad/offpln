import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      });
    }
  }

  async sendRegisterOtp(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    // Invalidate old OTPs
    await this.prisma.otpCode.updateMany({
      where: { target: email, channel: 'register', used: false },
      data: { used: true },
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otpCode.create({
      data: { target: email, code: otp, channel: 'register', expiresAt },
    });

    await this.sendVerificationEmail(email, otp);
    return { otpSent: true, email, message: 'Verification code sent to your email' };
  }

  async register(dto: RegisterDto & { otpCode: string }) {
    // Verify OTP first
    const otp = await this.prisma.otpCode.findFirst({
      where: { target: dto.email, code: dto.otpCode, channel: 'register', used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new UnauthorizedException('Invalid or expired verification code');

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashed,
        role: 'USER',
        isVerified: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return { user: this.sanitize(user), ...tokens };
  }

  private async sendVerificationEmail(to: string, code: string) {
    if (!this.transporter) return;
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    await this.transporter.sendMail({
      from: `"OffPlan" <${from}>`,
      to,
      subject: `Verify your email — ${code}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <div style="background:#0c4a6e;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <h1 style="color:#fbbf24;margin:0;font-size:28px;letter-spacing:-1px">OffPlan</h1>
            <p style="color:#7dd3fc;margin:8px 0 0;font-size:13px">Fractional Property Investment</p>
          </div>
          <h2 style="color:#111827;font-size:20px;margin:0 0 8px">Verify Your Email</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Enter this code to verify your email and create your account. It expires in 10 minutes.</p>
          <div style="background:#f9fafb;border:2px dashed #e5e7eb;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#0c4a6e">${code}</span>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // All users: send OTP for verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Invalidate old OTPs
    await this.prisma.otpCode.updateMany({
      where: { target: user.email, channel: 'login', used: false },
      data: { used: true },
    });

    await this.prisma.otpCode.create({
      data: { target: user.email, code: otp, channel: 'login', expiresAt },
    });

    await this.sendLoginOtp(user.email, otp);

    return { otpRequired: true, email: user.email, message: 'OTP sent to your email' };
  }

  async verifyLoginOtp(email: string, code: string) {
    const otp = await this.prisma.otpCode.findFirst({
      where: { target: email, code, channel: 'login', used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new UnauthorizedException('Invalid or expired OTP');

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return { user: this.sanitize(user), ...tokens };
  }

  private async sendLoginOtp(to: string, code: string) {
    if (!this.transporter) return; // silently skip if no SMTP
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    await this.transporter.sendMail({
      from: `"OffPlan" <${from}>`,
      to,
      subject: `Your OffPlan login code: ${code}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <div style="background:#0c4a6e;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <h1 style="color:#fbbf24;margin:0;font-size:28px;letter-spacing:-1px">OffPlan</h1>
            <p style="color:#7dd3fc;margin:8px 0 0;font-size:13px">Fractional Property Investment</p>
          </div>
          <h2 style="color:#111827;font-size:20px;margin:0 0 8px">Login Verification</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Enter this code to complete your sign in. It expires in 10 minutes.</p>
          <div style="background:#f9fafb;border:2px dashed #e5e7eb;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#0c4a6e">${code}</span>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  }

  async refresh(userId: string, refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.userId !== userId || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
    );
    await this.prisma.refreshToken.delete({ where: { token: refreshToken } });
    await this.saveRefreshToken(stored.user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId, token: refreshToken },
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
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
    await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  private sanitize(user: any) {
    const { password, ...rest } = user;
    return rest;
  }
}
