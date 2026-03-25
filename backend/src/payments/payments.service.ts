import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.payment.update({ where: { id: paymentId }, data });
  }

  // ── Investor: submit proof of payment ─────────────────────────────────────
  async submitProof(paymentId: string, userId: string, investorProofUrl: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, investment: { userId } },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'PAID') throw new ForbiddenException('Payment is already paid');
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'UNDER_REVIEW', investorProofUrl },
    });
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
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        ...(adminProofUrl ? { proofUrl: adminProofUrl } : {}),
      },
    });
  }

  // ── Admin: reject payment proof (revert to PENDING) ───────────────────────
  async adminReject(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'PENDING', investorProofUrl: null },
    });
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
