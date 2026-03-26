import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(query: QueryPropertyDto) {
    const {
      search,
      location,
      minPrice,
      maxPrice,
      minRoi,
      developer,
      status,
    } = query;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    // When no status filter is given, show ACTIVE, SOLD_OUT and SOLD (hide COMING_SOON/ARCHIVED)
    // Admin passes includeAll=true to bypass this filter entirely
    const where: any = (query as any).includeAll
      ? (status ? { status } : {})
      : status
      ? { status }
      : { status: { in: ['ACTIVE', 'SOLD_OUT', 'SOLD'] } };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (developer) where.developer = { contains: developer, mode: 'insensitive' };
    if (minPrice || maxPrice) {
      where.totalPrice = {};
      if (minPrice) where.totalPrice.gte = Number(minPrice);
      if (maxPrice) where.totalPrice.lte = Number(maxPrice);
    }
    if (minRoi) where.roi = { gte: Number(minRoi) };

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          location: true,
          developer: true,
          totalPrice: true,
          totalShares: true,
          pricePerShare: true,
          availableShares: true,
          roi: true,
          images: true,
          status: true,
          createdAt: true,
          area: true,
          handoverDate: true,
          propertyTypeId: true,
          propertyType: true,
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return { properties, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { propertyType: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async create(dto: CreatePropertyDto) {
    const pricePerShare = dto.totalPrice / dto.totalShares;
    const property = await this.prisma.property.create({
      data: {
        ...dto,
        pricePerShare,
        availableShares: dto.totalShares,
      },
    });

    // Notify all investors about the new property (only if ACTIVE)
    if (property.status === 'ACTIVE') {
      try {
        this.notifications.notifyNewProperty(property.id, property.title).catch(() => {});
      } catch {}
    }

    return property;
  }

  async update(id: string, dto: Partial<CreatePropertyDto>) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.totalPrice && dto.totalShares) {
      data.pricePerShare = dto.totalPrice / dto.totalShares;
    }
    return this.prisma.property.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.property.delete({ where: { id } });
  }

  async bulkCreate(properties: CreatePropertyDto[]) {
    const results = { created: 0, failed: [] as any[] };
    for (const dto of properties) {
      try {
        await this.create(dto);
        results.created++;
      } catch (err) {
        results.failed.push({ dto, error: err.message });
      }
    }
    return results;
  }

  async getEmirates() {
    return this.prisma.emirate.findMany({ orderBy: { name: 'asc' } });
  }

  generatePaymentSchedule(property: any, sharesPurchased: number) {
    const totalAmount = property.pricePerShare * sharesPurchased;
    const plan = property.paymentPlan as any;

    const schedule: any = {
      totalAmount,
      sharesPurchased,
      pricePerShare: property.pricePerShare,
      downPayment: {
        name: 'Down Payment',
        percentage: plan.downPayment,
        amount: (plan.downPayment / 100) * totalAmount,
        status: 'PENDING',
      },
      installments: plan.installments.map((inst: any) => ({
        name: inst.name,
        percentage: inst.percentage,
        amount: (inst.percentage / 100) * totalAmount,
        dueType: inst.dueType,
        dueValue: inst.dueValue,
        status: 'PENDING',
      })),
    };

    return schedule;
  }

  async getPayoutSummary(propertyId: string, requestingUserId?: string) {
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
      receiptUrl: p.userId === requestingUserId ? p.receiptUrl : null,
      isMe: p.userId === requestingUserId,
      name: p.userId === requestingUserId ? p.user.name : `Investor ${i + 1}`,
    }));
  }
}
