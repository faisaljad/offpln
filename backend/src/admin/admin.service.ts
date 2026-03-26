import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalProperties,
      totalInvestments,
      totalUsers,
      pendingInvestments,
      revenueResult,
      activeProperties,
      payoutsResult,
      pendingPayments,
    ] = await Promise.all([
      this.prisma.property.count(),
      this.prisma.investment.count(),
      this.prisma.user.count({ where: { role: 'USER' } }),
      this.prisma.investment.count({ where: { status: 'PENDING' } }),
      this.prisma.investment.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['APPROVED', 'COMPLETED'] } },
      }),
      this.prisma.property.count({ where: { status: 'ACTIVE' } }),
      this.prisma.payout.aggregate({ _sum: { totalReturn: true } }),
      this.prisma.payment.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
    ]);

    const recentInvestments = await this.prisma.investment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        property: { select: { title: true } },
      },
    });

    // Monthly investments for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const investmentsLast6 = await this.prisma.investment.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, totalAmount: true },
    });

    const monthlyMap = new Map<string, { count: number; amount: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
      monthlyMap.set(key, { count: 0, amount: 0 });
    }
    for (const inv of investmentsLast6) {
      const d = new Date(inv.createdAt);
      const key = `${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
      if (monthlyMap.has(key)) {
        const entry = monthlyMap.get(key)!;
        entry.count++;
        entry.amount += inv.totalAmount;
      }
    }
    const monthlyInvestments = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      count: data.count,
      amount: data.amount,
    }));

    // Property status breakdown
    const allProperties = await this.prisma.property.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    const propertyStatusBreakdown = allProperties.map((p) => ({
      status: p.status,
      count: p._count.id,
    }));

    // Recent users
    const recentUsers = await this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: { role: 'USER' },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return {
      totalProperties,
      totalInvestments,
      totalUsers,
      pendingInvestments,
      totalRevenue: revenueResult._sum.totalAmount || 0,
      activeProperties,
      totalPayouts: payoutsResult._sum.totalReturn || 0,
      pendingPayments,
      recentInvestments,
      monthlyInvestments,
      propertyStatusBreakdown,
      recentUsers,
    };
  }

  async setSold(propertyId: string, sellingPrice: number) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.status === 'SOLD') throw new BadRequestException('Property is already marked as sold');
    if (!sellingPrice || sellingPrice <= 0) throw new BadRequestException('A valid selling price is required');

    const investments = await this.prisma.investment.findMany({
      where: { propertyId, status: 'APPROVED' },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.property.update({
        where: { id: propertyId },
        data: { status: 'SOLD', soldPrice: sellingPrice },
      });

      for (const inv of investments) {
        // Investor's proportional share of the selling price
        const investorReturn = sellingPrice * (inv.sharesPurchased / property.totalShares);
        const profitAmount   = investorReturn - inv.totalAmount;
        const totalReturn    = investorReturn;

        await tx.payout.upsert({
          where: { investmentId: inv.id },
          create: { investmentId: inv.id, propertyId, userId: inv.userId, profitAmount, totalReturn },
          update: { profitAmount, totalReturn },
        });
      }
    });

    return { success: true, payoutsCreated: investments.length };
  }

  async getPropertyPayouts(propertyId: string) {
    return this.prisma.payout.findMany({
      where: { propertyId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        investment: { select: { sharesPurchased: true, totalAmount: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markPayoutPaid(payoutId: string, receiptUrl?: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException('Payout not found');
    return this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: 'PAID', paidAt: new Date(), receiptUrl: receiptUrl ?? null },
    });
  }

  // --- Property Types ---
  async getPropertyTypes() {
    return this.prisma.propertyType.findMany({ orderBy: { name: 'asc' } });
  }

  async createPropertyType(name: string) {
    return this.prisma.propertyType.create({ data: { name } });
  }

  async deletePropertyType(id: string) {
    const existing = await this.prisma.propertyType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Property type not found');
    return this.prisma.propertyType.delete({ where: { id } });
  }

  // --- Emirates ---
  async getEmirates() {
    return this.prisma.emirate.findMany({ orderBy: { name: 'asc' } });
  }

  async createEmirate(name: string, latitude: number, longitude: number) {
    return this.prisma.emirate.create({ data: { name, latitude, longitude } });
  }

  async deleteEmirate(id: string) {
    const existing = await this.prisma.emirate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Emirate not found');
    return this.prisma.emirate.delete({ where: { id } });
  }

  // --- Admin User Management ---
  async getAdminUsers() {
    return this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true, name: true, email: true, role: true, permissions: true, isVerified: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdminUser(name: string, email: string, password: string, role: string = 'ADMIN', permissions: string[] = []) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('A user with this email already exists');
    const validRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: { name, email, password: hashedPassword, role: validRole, permissions, isVerified: true },
      select: { id: true, name: true, email: true, role: true, permissions: true, isVerified: true, createdAt: true },
    });
  }

  async updateAdminUser(userId: string, data: { role?: string; permissions?: string[] }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const updateData: any = {};
    if (data.role) updateData.role = data.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
    if (data.permissions) updateData.permissions = data.permissions;
    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, permissions: true },
    });
  }

  async changeAdminPassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  async deleteAdminUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'SUPER_ADMIN') throw new BadRequestException('Cannot delete a SUPER_ADMIN user');
    return this.prisma.user.delete({ where: { id: userId } });
  }

  // --- Reports ---
  async getReports() {
    // Investments by property
    const investments = await this.prisma.investment.findMany({
      include: { property: { select: { title: true } } },
    });
    const propertyMap = new Map<string, { propertyTitle: string; totalInvestments: number; totalAmount: number; approvedCount: number }>();
    for (const inv of investments) {
      const key = inv.propertyId;
      if (!propertyMap.has(key)) {
        propertyMap.set(key, { propertyTitle: inv.property.title, totalInvestments: 0, totalAmount: 0, approvedCount: 0 });
      }
      const entry = propertyMap.get(key)!;
      entry.totalInvestments++;
      entry.totalAmount += inv.totalAmount;
      if (inv.status === 'APPROVED') entry.approvedCount++;
    }
    const investmentsByProperty = Array.from(propertyMap.values());

    // Payment collection
    const [totalDueResult, totalCollectedResult] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { amount: true } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
    ]);
    const totalDue = totalDueResult._sum.amount || 0;
    const totalCollected = totalCollectedResult._sum.amount || 0;
    const collectionRate = totalDue > 0 ? Math.round((totalCollected / totalDue) * 10000) / 100 : 0;
    const paymentCollection = { totalDue, totalCollected, collectionRate };

    // Transfer stats
    const [totalTransfers, completedTransfers, pendingTransfers, rejectedTransfers] = await Promise.all([
      this.prisma.shareTransfer.count(),
      this.prisma.shareTransfer.count({ where: { status: 'COMPLETED' } }),
      this.prisma.shareTransfer.count({ where: { status: { in: ['PENDING_APPROVAL', 'LISTED', 'REQUESTED', 'OTP_PENDING'] } } }),
      this.prisma.shareTransfer.count({ where: { status: 'REJECTED' } }),
    ]);
    const transferStats = { total: totalTransfers, completed: completedTransfers, pending: pendingTransfers, rejected: rejectedTransfers };

    // Top investors
    const allInvestments = await this.prisma.investment.findMany({
      where: { status: { in: ['APPROVED', 'COMPLETED'] } },
      include: { user: { select: { name: true, email: true } } },
    });
    const investorMap = new Map<string, { name: string; email: string; totalAmount: number; investmentCount: number }>();
    for (const inv of allInvestments) {
      if (!investorMap.has(inv.userId)) {
        investorMap.set(inv.userId, { name: inv.user.name, email: inv.user.email, totalAmount: 0, investmentCount: 0 });
      }
      const entry = investorMap.get(inv.userId)!;
      entry.totalAmount += inv.totalAmount;
      entry.investmentCount++;
    }
    const topInvestors = Array.from(investorMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    return { investmentsByProperty, paymentCollection, transferStats, topInvestors };
  }

  // --- Payment Schedules ---
  async getPaymentSchedules(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const orderBy: any = status === 'PAID' ? { paidAt: 'desc' } : { dueDate: 'asc' };

    return this.prisma.payment.findMany({
      where,
      orderBy,
      include: {
        investment: {
          include: {
            property: { select: { id: true, title: true } },
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  async getPaymentStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [totalPending, totalPaid, totalOverdue, upcomingThisMonth] = await Promise.all([
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.count({ where: { status: 'PAID' } }),
      this.prisma.payment.count({ where: { status: 'OVERDUE' } }),
      this.prisma.payment.count({
        where: {
          status: 'PENDING',
          dueDate: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
    ]);

    return { totalPending, totalPaid, totalOverdue, upcomingThisMonth };
  }

  // Anonymized summary for mobile — investor sees their own name, others are masked
  async getPropertyPayoutSummary(propertyId: string, requestingUserId?: string) {
    const payouts = await this.prisma.payout.findMany({
      where: { propertyId },
      include: {
        user: { select: { id: true, name: true } },
        investment: { select: { sharesPurchased: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return payouts.map((p, i) => ({
      index: i + 1,
      stake: p.investment.sharesPurchased * 10,
      profitAmount: p.profitAmount,
      totalReturn: p.totalReturn,
      status: p.status,
      isMe: p.userId === requestingUserId,
      name: p.userId === requestingUserId ? p.user.name : `Investor ${i + 1}`,
    }));
  }
}
