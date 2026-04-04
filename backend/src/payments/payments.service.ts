import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const PAYMENT_INCLUDE = {
  investment: {
    include: {
      property: { select: { id: true, title: true, location: true } },
      user:     { select: { id: true, name: true, email: true } },
    },
  },
};

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Recalculate investment status based on payment states
  private async syncInvestmentStatus(investmentId: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
      include: { payments: true, property: { select: { status: true } } },
    });
    if (!investment || investment.status === 'PENDING' || investment.status === 'REJECTED'
      || investment.status === 'PENDING_PAYOUT' || investment.status === 'COMPLETED') return;

    const hasDueUnpaid = investment.payments.some(
      (p) => p.status !== 'PAID' && p.status !== 'WAIVED' && (
        (p.dueDate && new Date(p.dueDate) <= new Date()) ||
        p.status === 'OVERDUE' || p.status === 'UNDER_REVIEW'
      ),
    );

    const newStatus = hasDueUnpaid ? 'PAYMENT_REQUIRED' : 'APPROVED';
    if (investment.status !== newStatus) {
      await this.prisma.investment.update({
        where: { id: investmentId },
        data: { status: newStatus },
      });
    }
  }

  async findByInvestment(investmentId: string) {
    return this.prisma.payment.findMany({
      where: { investmentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markAsPaid(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  async updatePayment(paymentId: string, status: string, proofUrl?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    const data: any = { status };
    if (status === 'PAID' && !payment.paidAt) data.paidAt = new Date();
    if (status !== 'PAID') data.paidAt = null;
    if (proofUrl !== undefined) data.proofUrl = proofUrl;
    const updated = await this.prisma.payment.update({ where: { id: paymentId }, data });
    await this.syncInvestmentStatus(payment.investmentId);
    return updated;
  }

  // ── Investor: submit proof of payment ─────────────────────────────────────
  async submitProof(paymentId: string, userId: string, investorProofUrl: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, investment: { userId } },
      include: {
        investment: {
          include: {
            property: { select: { title: true } },
            user: { select: { name: true, email: true } },
          },
        },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'PAID') throw new ForbiddenException('Payment is already paid');
    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'UNDER_REVIEW', investorProofUrl },
    });

    // Notify admin about proof upload
    this.notifications.notifyAdmin(
      `Payment Proof Uploaded: ${payment.investment.user.name} — ${payment.name}`,
      'Payment Proof Submitted',
      [
        { label: 'Investor', value: payment.investment.user.name },
        { label: 'Email', value: payment.investment.user.email },
        { label: 'Property', value: payment.investment.property.title },
        { label: 'Payment', value: payment.name },
        { label: 'Amount', value: `AED ${payment.amount.toLocaleString()}` },
      ],
    ).catch(() => {});

    return updated;
  }

  // ── Admin: get all payments under review ──────────────────────────────────
  async getPaymentsForReview() {
    return this.prisma.payment.findMany({
      where: { status: 'UNDER_REVIEW' },
      include: PAYMENT_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ── Admin: approve payment ─────────────────────────────────────────────────
  async adminApprove(paymentId: string, adminProofUrl?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        ...(adminProofUrl ? { proofUrl: adminProofUrl } : {}),
      },
    });
    await this.syncInvestmentStatus(payment.investmentId);
    return updated;
  }

  // ── Admin: reject payment proof (revert to PENDING) ───────────────────────
  async adminReject(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'PENDING', investorProofUrl: null },
    });
    await this.syncInvestmentStatus(payment.investmentId);
    return updated;
  }

  async getMyPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { investment: { userId } },
      include: {
        investment: {
          select: { id: true, property: { select: { id: true, title: true, location: true } } },
        },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });
  }

  async getUpcoming(userId: string) {
    return this.prisma.payment.findMany({
      where: {
        status: 'PENDING',
        investment: { userId },
        dueDate: { gte: new Date() },
      },
      include: {
        investment: {
          select: { id: true, property: { select: { title: true } } },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });
  }
}
