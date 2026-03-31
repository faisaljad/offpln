import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        bankDetails: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAll(page: any = 1, limit: any = 20, search?: string) {
    page = Number(page) || 1;
    limit = Number(limit) || 20;
    const skip = (page - 1) * limit;
    const baseFilter = { role: 'USER' as const };
    const where: any = search
      ? { ...baseFilter, OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
      : baseFilter;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
          _count: { select: { investments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async updateProfile(id: string, data: { name?: string; phone?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });
  }

  async getBankDetails(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { bankDetails: true } });
    if (!user) throw new NotFoundException('User not found');
    return user.bankDetails || {};
  }

  async updateBankDetails(id: string, bankDetails: any) {
    return this.prisma.user.update({
      where: { id },
      data: { bankDetails },
      select: { bankDetails: true },
    });
  }
}
