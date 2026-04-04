import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

// Notification types
export const NOTIF_TYPES = {
  PAYMENT_DUE: 'payment_due',
  NEW_PROPERTY: 'new_property',
  MARKETPLACE_LISTING: 'marketplace_listing',
  INVESTMENT_UPDATE: 'investment_update',
  TRANSFER_UPDATE: 'transfer_update',
  PAYOUT: 'payout',
  ADMIN_BROADCAST: 'admin_broadcast',
} as const;

// Default notification preferences
const DEFAULT_PREFS = {
  payment_due: true,
  new_property: true,
  marketplace_listing: true,
  investment_update: true,
  transfer_update: true,
  payout: true,
  admin_broadcast: true,
};

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter | null = null;
  private adminEmail: string | undefined;

  constructor(private prisma: PrismaService) {
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
    this.adminEmail = process.env.ADMIN_EMAIL;
  }

  // --- User endpoints ---

  async getMyNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);
    return { notifications, total, unreadCount, page, limit, pages: Math.ceil(total / limit) };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, read: false } });
    return { count };
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPrefs: true },
    });
    return { ...(DEFAULT_PREFS as any), ...((user?.notificationPrefs as any) || {}) };
  }

  async updatePreferences(userId: string, prefs: Record<string, boolean>) {
    const current = await this.getPreferences(userId);
    const merged = { ...current, ...prefs };
    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPrefs: merged },
    });
    return merged;
  }

  // --- Create notifications (used internally by other services) ---

  async send(userId: string, type: string, title: string, body: string, data?: any) {
    // Check user preferences
    const prefs = await this.getPreferences(userId);
    if (prefs[type] === false) return null; // User opted out

    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body, data },
    });

    // Fire-and-forget push notification
    this.sendPushNotification(userId, title, body, data).catch(() => {});

    return notification;
  }

  async registerPushToken(userId: string, token: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pushToken: token },
    });
  }

  private async sendPushNotification(userId: string, title: string, body: string, data?: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { pushToken: true },
      });

      if (!user?.pushToken || !user.pushToken.startsWith('ExponentPushToken')) return;

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.pushToken,
          title,
          body,
          data,
          sound: 'default',
        }),
      });
    } catch {
      // Silently ignore push notification failures
    }
  }

  async sendToMany(userIds: string[], type: string, title: string, body: string, data?: any) {
    // Filter users who have this notification enabled
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, notificationPrefs: true, pushToken: true },
    });

    const eligible = users.filter((u) => {
      const prefs = { ...DEFAULT_PREFS, ...((u.notificationPrefs as any) || {}) };
      return prefs[type] !== false;
    });

    const eligibleIds = eligible.map((u) => u.id);

    if (eligibleIds.length === 0) return [];

    const result = await this.prisma.notification.createMany({
      data: eligibleIds.map((userId) => ({ userId, type, title, body, data })),
    });

    // Fire-and-forget push notifications for all eligible users
    for (const u of eligible) {
      if (u.pushToken?.startsWith('ExponentPushToken')) {
        this.sendPushNotificationDirect(u.pushToken, title, body, data).catch(() => {});
      }
    }

    return result;
  }

  async sendToAllInvestors(type: string, title: string, body: string, data?: any) {
    const users = await this.prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true, notificationPrefs: true, pushToken: true },
    });

    const eligible = users.filter((u) => {
      const prefs = { ...DEFAULT_PREFS, ...((u.notificationPrefs as any) || {}) };
      return prefs[type] !== false;
    });

    const eligibleIds = eligible.map((u) => u.id);

    if (eligibleIds.length === 0) return [];

    const result = await this.prisma.notification.createMany({
      data: eligibleIds.map((userId) => ({ userId, type, title, body, data })),
    });

    // Fire-and-forget push notifications for all eligible users
    for (const u of eligible) {
      if (u.pushToken?.startsWith('ExponentPushToken')) {
        this.sendPushNotificationDirect(u.pushToken, title, body, data).catch(() => {});
      }
    }

    return result;
  }

  // --- Auto notifications ---

  async notifyPaymentDue() {
    // Find payments due within 7 days
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lte: soon, gte: new Date() },
      },
      include: {
        investment: {
          include: {
            user: { select: { id: true } },
            property: { select: { title: true } },
          },
        },
      },
    });

    let count = 0;
    for (const p of payments) {
      const userId = p.investment.userId;
      const title = 'Payment Due Soon';
      const body = `${p.name} for ${p.investment.property.title} is due on ${p.dueDate?.toLocaleDateString()}`;
      const existing = await this.prisma.notification.findFirst({
        where: { userId, type: NOTIF_TYPES.PAYMENT_DUE, data: { path: ['paymentId'], equals: p.id } },
        orderBy: { createdAt: 'desc' },
      });
      // Don't spam — only send if not already notified in last 3 days
      if (!existing || (Date.now() - existing.createdAt.getTime()) > 3 * 24 * 60 * 60 * 1000) {
        await this.send(userId, NOTIF_TYPES.PAYMENT_DUE, title, body, { paymentId: p.id, investmentId: p.investmentId });
        count++;
      }
    }
    return { sent: count };
  }

  async notifyNewProperty(propertyId: string, propertyTitle: string) {
    return this.sendToAllInvestors(
      NOTIF_TYPES.NEW_PROPERTY,
      'New Property Listed',
      `${propertyTitle} is now available for investment`,
      { propertyId },
    );
  }

  async notifyMarketplaceListing(transferId: string, propertyTitle: string, askPrice: number) {
    return this.sendToAllInvestors(
      NOTIF_TYPES.MARKETPLACE_LISTING,
      'New Marketplace Listing',
      `A share of ${propertyTitle} is listed for AED ${askPrice.toLocaleString()}`,
      { transferId },
    );
  }

  async notifyInvestmentUpdate(userId: string, propertyTitle: string, status: string, investmentId: string) {
    const statusMessages: Record<string, string> = {
      APPROVED: `Your investment in ${propertyTitle} has been approved`,
      REJECTED: `Your investment in ${propertyTitle} has been rejected`,
      COMPLETED: `Your investment in ${propertyTitle} is now completed`,
    };
    const body = statusMessages[status] || `Your investment in ${propertyTitle} has been updated to ${status}`;
    return this.send(userId, NOTIF_TYPES.INVESTMENT_UPDATE, 'Investment Update', body, { investmentId });
  }

  async notifyTransferUpdate(userId: string, propertyTitle: string, status: string, transferId: string) {
    const body = `Transfer for ${propertyTitle} status: ${status.replace('_', ' ')}`;
    return this.send(userId, NOTIF_TYPES.TRANSFER_UPDATE, 'Transfer Update', body, { transferId });
  }

  async notifyPayout(userId: string, propertyTitle: string, amount: number, payoutId: string) {
    return this.send(
      userId,
      NOTIF_TYPES.PAYOUT,
      'Payout Available',
      `Your payout of AED ${amount.toLocaleString()} from ${propertyTitle} is ready`,
      { payoutId },
    );
  }

  // --- Admin endpoints ---

  async adminGetAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.notification.count(),
    ]);
    return { notifications, total, page, limit, pages: Math.ceil(total / limit) };
  }

  private async sendPushNotificationDirect(pushToken: string, title: string, body: string, data?: any) {
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: pushToken,
          title,
          body,
          data,
          sound: 'default',
        }),
      });
    } catch {
      // Silently ignore push notification failures
    }
  }

  async adminBroadcast(title: string, body: string) {
    return this.sendToAllInvestors(NOTIF_TYPES.ADMIN_BROADCAST, title, body);
  }

  async adminSendToUser(userId: string, title: string, body: string) {
    return this.send(userId, NOTIF_TYPES.ADMIN_BROADCAST, title, body);
  }

  // ── Admin email notification ──────────────────────────────────────────────
  async notifyAdmin(subject: string, heading: string, details: { label: string; value: string }[]) {
    if (!this.transporter || !this.adminEmail) return;
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const rows = details.map((d) => `
      <tr>
        <td style="padding:8px 12px;color:#6b7280;font-size:14px;white-space:nowrap">${d.label}</td>
        <td style="padding:8px 12px;color:#111827;font-size:14px;font-weight:500">${d.value}</td>
      </tr>
    `).join('');

    await this.transporter.sendMail({
      from: `"OffPlan" <${from}>`,
      to: this.adminEmail,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
          <div style="background:#0c4a6e;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <h1 style="color:#fbbf24;margin:0;font-size:28px;letter-spacing:-1px">OffPlan</h1>
            <p style="color:#7dd3fc;margin:8px 0 0;font-size:13px">Admin Notification</p>
          </div>
          <h2 style="color:#111827;font-size:20px;margin:0 0 16px">${heading}</h2>
          <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden">
            ${rows}
          </table>
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px">
            Log in to the admin panel to take action.
          </p>
        </div>
      `,
    }).catch(() => {});
  }
}
