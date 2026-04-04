import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const TRANSFER_INCLUDE = {
  investment: {
    include: {
      property: {
        select: { id: true, title: true, location: true, images: true, roi: true, pricePerShare: true },
      },
      payments: true,
    },
  },
  seller: { select: { id: true, name: true, email: true, phone: true } },
  buyer:  { select: { id: true, name: true, email: true } },
};

@Injectable()
export class TransfersService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
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

  // ── Seller: list investment for sale ──────────────────────────────────────
  async createListing(sellerId: string, investmentId: string, askPrice: number, notes?: string) {
    const investment = await this.prisma.investment.findFirst({
      where: { id: investmentId, userId: sellerId },
      include: { property: { select: { status: true } } },
    });
    if (!investment) throw new NotFoundException('Investment not found');
    if (investment.status !== 'APPROVED') {
      throw new BadRequestException('Only approved investments can be listed for sale');
    }
    if ((investment as any).property?.status === 'SOLD') {
      throw new BadRequestException('This property has been sold — shares can no longer be listed');
    }

    const existing = await this.prisma.shareTransfer.findUnique({
      where: { investmentId },
    });

    // Block re-listing if there's already an active transfer in progress
    const activeStatuses = ['PENDING_APPROVAL', 'LISTED', 'REQUESTED', 'OTP_PENDING'];
    if (existing && activeStatuses.includes(existing.status)) {
      throw new BadRequestException('This investment is already listed for sale');
    }

    // Re-listing after rejection/cancellation — reuse the existing row
    const listing = await this.prisma.shareTransfer.upsert({
      where: { investmentId },
      create: { investmentId, sellerId, askPrice, notes, status: 'PENDING_APPROVAL' },
      update: {
        sellerId,
        askPrice,
        notes,
        status: 'PENDING_APPROVAL',
        buyerId: null,
        otpCode: null,
        otpExpiresAt: null,
      },
      include: TRANSFER_INCLUDE,
    });

    // Notify admin about new listing request
    const seller = (listing as any).seller;
    const propertyTitle = (listing as any).investment?.property?.title ?? 'Unknown';
    this.notifications.notifyAdmin(
      `New Listing Request: ${seller?.name} — ${propertyTitle}`,
      'New Share Listing Request',
      [
        { label: 'Seller', value: seller?.name ?? '' },
        { label: 'Email', value: seller?.email ?? '' },
        { label: 'Property', value: propertyTitle },
        { label: 'Ask Price', value: `AED ${askPrice.toLocaleString()}` },
        ...(notes ? [{ label: 'Notes', value: notes }] : []),
      ],
    ).catch(() => {});

    return listing;
  }

  // ── Seller: cancel listing ────────────────────────────────────────────────
  async cancelListing(sellerId: string, transferId: string) {
    const transfer = await this.prisma.shareTransfer.findFirst({
      where: { id: transferId, sellerId, status: { in: ['PENDING_APPROVAL', 'LISTED'] } },
    });
    if (!transfer) throw new NotFoundException('Listing cannot be removed — a buyer has already requested it. Wait for admin to reject the request.');
    return this.prisma.shareTransfer.update({
      where: { id: transferId },
      data: { status: 'CANCELLED' },
      include: TRANSFER_INCLUDE,
    });
  }

  // ── Marketplace: all LISTED transfers ────────────────────────────────────
  async getMarketplace() {
    return this.prisma.shareTransfer.findMany({
      where: { status: 'LISTED' },
      include: TRANSFER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Buyer: request to buy ─────────────────────────────────────────────────
  async requestBuy(buyerId: string, transferId: string) {
    const transfer = await this.prisma.shareTransfer.findFirst({
      where: { id: transferId, status: 'LISTED' },
    });
    if (!transfer) throw new NotFoundException('Listing not found or no longer available');
    if (transfer.sellerId === buyerId) throw new ForbiddenException('You cannot buy your own listing');

    const updated = await this.prisma.shareTransfer.update({
      where: { id: transferId },
      data: { buyerId, status: 'REQUESTED' },
      include: TRANSFER_INCLUDE,
    });

    // Notify seller that someone requested to buy
    try {
      const propTitle = (updated as any).investment?.property?.title ?? 'your investment';
      this.notifications.notifyTransferUpdate(transfer.sellerId, propTitle, 'REQUESTED', transferId).catch(() => {});
    } catch {}

    // Notify admin about buy request
    const buyer = (updated as any).buyer;
    const sellerInfo = (updated as any).seller;
    const propTitle2 = (updated as any).investment?.property?.title ?? 'Unknown';
    this.notifications.notifyAdmin(
      `Buy Request: ${buyer?.name} wants to buy shares — ${propTitle2}`,
      'New Buy Request',
      [
        { label: 'Buyer', value: buyer?.name ?? '' },
        { label: 'Buyer Email', value: buyer?.email ?? '' },
        { label: 'Seller', value: sellerInfo?.name ?? '' },
        { label: 'Property', value: propTitle2 },
        { label: 'Ask Price', value: `AED ${(updated as any).askPrice?.toLocaleString() ?? '0'}` },
      ],
    ).catch(() => {});

    return updated;
  }

  // ── My transfers (as seller or buyer) ────────────────────────────────────
  async getMyTransfers(userId: string) {
    return this.prisma.shareTransfer.findMany({
      where: { OR: [{ sellerId: userId }, { buyerId: userId }] },
      include: TRANSFER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Get single transfer ───────────────────────────────────────────────────
  async getOne(transferId: string, userId: string) {
    const transfer = await this.prisma.shareTransfer.findFirst({
      where: {
        id: transferId,
        OR: [{ sellerId: userId }, { buyerId: userId }],
      },
      include: TRANSFER_INCLUDE,
    });
    if (!transfer) throw new NotFoundException('Transfer not found');
    return transfer;
  }

  // ── Seller: confirm with OTP ──────────────────────────────────────────────
  async confirmWithOtp(sellerId: string, transferId: string, code: string) {
    const transfer = await this.prisma.shareTransfer.findFirst({
      where: { id: transferId, sellerId, status: 'OTP_PENDING' },
      include: TRANSFER_INCLUDE,
    });
    if (!transfer) throw new NotFoundException('Transfer not found or not awaiting confirmation');
    if (transfer.otpCode !== code) throw new UnauthorizedException('Invalid OTP code');
    if (!transfer.otpExpiresAt || transfer.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired — please contact support');
    }
    if (!transfer.buyerId) throw new BadRequestException('No buyer assigned');

    await this.prisma.$transaction([
      this.prisma.investment.update({
        where: { id: transfer.investmentId },
        data: { userId: transfer.buyerId },
      }),
      this.prisma.shareTransfer.update({
        where: { id: transferId },
        data: { status: 'COMPLETED', otpCode: null },
      }),
      this.prisma.otpCode.deleteMany({
        where: { OR: [{ target: (transfer as any).seller?.email ?? '', channel: 'transfer' }, { expiresAt: { lt: new Date() } }] },
      }),
    ]);

    // Notify both seller and buyer about completed transfer
    try {
      const propertyTitle = (transfer as any).investment?.property?.title ?? 'your investment';
      this.notifications.notifyTransferUpdate(transfer.sellerId, propertyTitle, 'COMPLETED', transferId).catch(() => {});
      this.notifications.notifyTransferUpdate(transfer.buyerId, propertyTitle, 'COMPLETED', transferId).catch(() => {});
    } catch {}

    return { success: true };
  }

  // ── Seller: resend OTP ───────────────────────────────────────────────────
  async resendOtp(sellerId: string, transferId: string) {
    const transfer = await this.prisma.shareTransfer.findFirst({
      where: { id: transferId, sellerId, status: 'OTP_PENDING' },
      include: {
        seller: true,
        investment: { include: { property: { select: { title: true } } } },
      },
    });
    if (!transfer) throw new NotFoundException('Transfer not found or not awaiting OTP confirmation');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.otpCode.deleteMany({
        where: { target: transfer.seller.email, channel: 'transfer' },
      }),
      this.prisma.shareTransfer.update({
        where: { id: transferId },
        data: { otpCode: otp, otpExpiresAt },
      }),
      this.prisma.otpCode.create({
        data: {
          target: transfer.seller.email,
          code: otp,
          channel: 'transfer',
          expiresAt: otpExpiresAt,
        },
      }),
    ]);

    await this.sendTransferOtpEmail(transfer.seller, otp, transfer);
    return { success: true, message: 'OTP resent to your email' };
  }

  // ── Admin: get all transfers ──────────────────────────────────────────────
  async adminGetAll(status?: string) {
    const where: any = status ? { status } : {};
    return this.prisma.shareTransfer.findMany({
      where,
      include: TRANSFER_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ── Admin: approve listing (PENDING_APPROVAL → LISTED) ───────────────────
  async adminApproveListing(transferId: string) {
    const transfer = await this.prisma.shareTransfer.findFirst({
      where: { id: transferId, status: 'PENDING_APPROVAL' },
    });
    if (!transfer) throw new NotFoundException('Pending listing not found');
    const updated = await this.prisma.shareTransfer.update({
      where: { id: transferId },
      data: { status: 'LISTED' },
      include: TRANSFER_INCLUDE,
    });

    try {
      const propertyTitle = (updated as any).investment?.property?.title ?? 'your investment';
      this.notifications.notifyTransferUpdate(transfer.sellerId, propertyTitle, 'LISTED', transferId).catch(() => {});
    } catch {}

    return updated;
  }

  // ── Admin: approve transfer (REQUESTED → OTP_PENDING) → send OTP to seller
  async adminApprove(transferId: string) {
    const transfer = await this.prisma.shareTransfer.findFirst({
      where: { id: transferId, status: 'REQUESTED' },
      include: {
        seller: true,
        investment: { include: { property: { select: { title: true } } } },
      },
    });
    if (!transfer) throw new NotFoundException('Transfer request not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await this.prisma.$transaction([
      this.prisma.otpCode.deleteMany({
        where: { target: transfer.seller.email, channel: 'transfer' },
      }),
      this.prisma.shareTransfer.update({
        where: { id: transferId },
        data: { status: 'OTP_PENDING', otpCode: otp, otpExpiresAt },
      }),
      this.prisma.otpCode.create({
        data: {
          target: transfer.seller.email,
          code: otp,
          channel: 'transfer',
          expiresAt: otpExpiresAt,
        },
      }),
    ]);

    await this.sendTransferOtpEmail(transfer.seller, otp, transfer);

    return { success: true, message: 'OTP sent to seller' };
  }

  // ── Admin: reject listing (PENDING_APPROVAL / LISTED → REJECTED) ──────────
  async adminReject(transferId: string, note?: string) {
    const transfer = await this.prisma.shareTransfer.findFirst({
      where: { id: transferId, status: { in: ['PENDING_APPROVAL', 'LISTED'] } },
    });
    if (!transfer) throw new NotFoundException('Transfer not found or not in a rejectable listing state');
    const updated = await this.prisma.shareTransfer.update({
      where: { id: transferId },
      data: { status: 'REJECTED', rejectionNote: note ?? null },
      include: TRANSFER_INCLUDE,
    });

    try {
      const propertyTitle = (updated as any).investment?.property?.title ?? 'your investment';
      this.notifications.notifyTransferUpdate(transfer.sellerId, propertyTitle, 'REJECTED', transferId).catch(() => {});
    } catch {}

    return updated;
  }

  // ── Admin: reject buyer request (REQUESTED → LISTED) ─────────────────────
  async adminRejectRequest(transferId: string, note?: string) {
    const transfer = await this.prisma.shareTransfer.findFirst({
      where: { id: transferId, status: 'REQUESTED' },
    });
    if (!transfer) throw new NotFoundException('Buy request not found');
    const updated = await this.prisma.shareTransfer.update({
      where: { id: transferId },
      data: { status: 'LISTED', buyerId: null, rejectionNote: note ?? null },
      include: TRANSFER_INCLUDE,
    });

    try {
      if (transfer.buyerId) {
        const propertyTitle = (updated as any).investment?.property?.title ?? 'your investment';
        this.notifications.notifyTransferUpdate(transfer.buyerId, propertyTitle, 'REQUEST_REJECTED', transferId).catch(() => {});
      }
    } catch {}

    return updated;
  }

  // ── Email ─────────────────────────────────────────────────────────────────
  private async sendTransferOtpEmail(seller: any, otp: string, transfer: any) {
    if (!this.transporter) return;
    const propertyTitle = transfer.investment?.property?.title ?? 'your investment';
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await this.transporter.sendMail({
      from: `"OffPlan" <${from}>`,
      to: seller.email,
      subject: `Action required: Confirm your share transfer — ${otp}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
          <div style="background:#0c4a6e;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <h1 style="color:#fbbf24;margin:0;font-size:28px;letter-spacing:-1px">OffPlan</h1>
            <p style="color:#7dd3fc;margin:8px 0 0;font-size:13px">Fractional Property Investment</p>
          </div>
          <h2 style="color:#111827;font-size:20px;margin:0 0 8px">Share Transfer Approved</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 16px">
            Hi ${seller.name}, your share transfer request for <strong>${propertyTitle}</strong>
            has been approved by our team.
          </p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
            To complete the transfer, open the OffPlan app and enter the confirmation code below.
            This code is valid for <strong>24 hours</strong>.
          </p>
          <div style="background:#f9fafb;border:2px dashed #e5e7eb;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#0c4a6e">${otp}</span>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center">
            If you did not initiate this transfer, please contact us immediately.
          </p>
        </div>
      `,
    });
  }
}
