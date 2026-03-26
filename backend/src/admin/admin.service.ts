import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    ] = await Promise.all([
      this.prisma.property.count(),
      this.prisma.investment.count(),
      this.prisma.user.count({ where: { role: 'USER' } }),
      this.prisma.investment.count({ where: { status: 'PENDING' } }),
      this.prisma.investment.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['APPROVED', 'COMPLETED'] } },
      }),
    ]);

    const recentInvestments = await this.prisma.investment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        property: { select: { title: true } },
      },
    });

    return {
      totalProperties,
      totalInvestments,
      totalUsers,
      pendingInvestments,
      totalRevenue: revenueResult._sum.totalAmount || 0,
      recentInvestments,
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
