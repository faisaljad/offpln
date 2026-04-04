import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PropertiesService } from '../properties/properties.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InvestmentsService {
  constructor(
    private prisma: PrismaService,
    private propertiesService: PropertiesService,
    private notifications: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateInvestmentDto) {
    const investment = await this.prisma.$transaction(async (tx) => {
      // Lock the property row so concurrent requests can't both pass the shares check
      const property = await tx.property.findUnique({ where: { id: dto.propertyId } });
      if (!property) throw new NotFoundException('Property not found');

      if (property.status === 'SOLD_OUT') {
        throw new BadRequestException('This property is fully sold out');
      }

      if (property.availableShares < dto.sharesPurchased) {
        throw new BadRequestException(
          `Only ${property.availableShares * 10}% stake available (${property.availableShares} shares)`,
        );
      }

      const paymentSchedule = this.propertiesService.generatePaymentSchedule(
        property,
        dto.sharesPurchased,
      );
      const totalAmount = property.pricePerShare * dto.sharesPurchased;

      // Reserve shares immediately so no other investor can claim them
      const newAvailable = property.availableShares - dto.sharesPurchased;
      await tx.property.update({
        where: { id: dto.propertyId },
        data: {
          availableShares: newAvailable,
          status: newAvailable === 0 ? 'SOLD_OUT' : property.status,
        },
      });

      const inv = await tx.investment.create({
        data: {
          userId,
          propertyId: dto.propertyId,
          sharesPurchased: dto.sharesPurchased,
          totalAmount,
          status: 'PENDING',
          paymentSchedule,
          notes: dto.notes,
        },
        include: { property: true, user: { select: { id: true, name: true, email: true } } },
      });

      const payments = [
        {
          investmentId: inv.id,
          name: 'Down Payment',
          amount: paymentSchedule.downPayment.amount,
          percentage: paymentSchedule.downPayment.percentage,
          status: 'PENDING' as const,
        },
        ...paymentSchedule.installments.map((inst: any) => ({
          investmentId: inv.id,
          name: inst.name,
          amount: inst.amount,
          percentage: inst.percentage,
          dueDate: inst.dueType === 'date' ? new Date(inst.dueValue) : undefined,
          milestone: inst.dueType === 'milestone' ? inst.dueValue : undefined,
          status: 'PENDING' as const,
        })),
      ];

      await tx.payment.createMany({ data: payments });
      return inv;
    });

    // Notify admin about new investment request
    this.notifications.notifyAdmin(
      `New Investment: ${investment.user.name} — ${investment.property.title}`,
      'New Investment Request',
      [
        { label: 'Investor', value: investment.user.name },
        { label: 'Email', value: investment.user.email },
        { label: 'Property', value: investment.property.title },
        { label: 'Shares', value: `${investment.sharesPurchased}` },
        { label: 'Total Amount', value: `AED ${investment.totalAmount.toLocaleString()}` },
      ],
    ).catch(() => {});

    return investment;
  }

  async findUserInvestments(userId: string, page: any = 1, limit: any = 10) {
    page = Number(page) || 1;
    limit = Number(limit) || 10;
    const skip = (page - 1) * limit;
    const [investments, total] = await Promise.all([
      this.prisma.investment.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              location: true,
              images: true,
              roi: true,
              status: true,
              totalPrice: true,
              soldPrice: true,
            },
          },
          payments: true,
          transfer: true,
          payout: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.investment.count({ where: { userId } }),
    ]);
    return { investments, total, page, limit };
  }

  async findOne(id: string, userId?: string) {
    const where: any = { id };
    if (userId) where.userId = userId;

    const investment = await this.prisma.investment.findFirst({
      where,
      include: {
        property: true,
        payments: { orderBy: { createdAt: 'asc' } },
        user: { select: { id: true, name: true, email: true } },
        transfer: {
          include: {
            seller: { select: { id: true, name: true, email: true } },
            buyer:  { select: { id: true, name: true, email: true } },
          },
        },
        payout: true,
      },
    });
    if (!investment) throw new NotFoundException('Investment not found');
    return investment;
  }

  async findAll(query: any) {
    const { status, propertyId, userId } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (propertyId) where.propertyId = propertyId;
    if (userId) where.userId = userId;

    const [investments, total] = await Promise.all([
      this.prisma.investment.findMany({
        where,
        skip,
        take: limit,
        include: {
          property: { select: { id: true, title: true, location: true, status: true, soldPrice: true, images: true } },
          user: { select: { id: true, name: true, email: true } },
          payments: true,
          payout: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.investment.count({ where }),
    ]);
    return { investments, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.$transaction(async (tx) => {
      const investment = await tx.investment.findFirst({
        where: { id },
        include: { property: true, payments: true },
      });
      if (!investment) throw new NotFoundException('Investment not found');

      const prev = investment.status;

      // Return shares to the property when rejecting a pending/approved investment
      if (status === 'REJECTED' && prev !== 'REJECTED') {
        const newAvailable = investment.property.availableShares + investment.sharesPurchased;
        await tx.property.update({
          where: { id: investment.propertyId },
          data: {
            availableShares: newAvailable,
            status: investment.property.status === 'SOLD_OUT' ? 'ACTIVE' : investment.property.status,
          },
        });
      }

      // When approving, check if there are due unpaid payments → PAYMENT_REQUIRED
      let finalStatus = status;
      if (status === 'APPROVED') {
        const hasDueUnpaid = investment.payments.some(
          (p) => p.status !== 'PAID' && p.status !== 'WAIVED' && (
            p.name === 'Down Payment' ||
            (p.dueDate && new Date(p.dueDate) <= new Date()) ||
            p.status === 'OVERDUE' || p.status === 'UNDER_REVIEW'
          ),
        );
        if (hasDueUnpaid) finalStatus = 'PAYMENT_REQUIRED';
      }

      const updated = await tx.investment.update({
        where: { id },
        data: { status: finalStatus as any },
      });

      // Notify the investor about the status change
      try {
        this.notifications.notifyInvestmentUpdate(
          investment.userId,
          investment.property.title,
          status,
          investment.id,
        ).catch(() => {});
      } catch {}

      return updated;
    });
  }
}
