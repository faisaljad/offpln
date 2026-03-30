import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    let settings = await this.prisma.appSettings.findUnique({ where: { id: 'singleton' } });
    if (!settings) {
      settings = await this.prisma.appSettings.create({
        data: { id: 'singleton', termsAndConditions: '', paymentTransferDetails: '', transferListingTerms: '', transferBuyingTerms: '' },
      });
    }
    return settings;
  }

  async update(data: {
    termsAndConditions?: string; paymentTransferDetails?: string;
    transferListingTerms?: string; transferBuyingTerms?: string;
    supportPhone?: string; supportEmail?: string; supportWhatsapp?: string;
    supportAddress?: string; supportWorkingHours?: string; supportWebsite?: string;
    aboutUs?: string; privacyPolicy?: string;
    investmentCommission?: any; soldCommission?: any; transferCommission?: any;
    paymentDelayFee?: any; paymentDefaultFee?: any;
  }) {
    return this.prisma.appSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        termsAndConditions: data.termsAndConditions ?? '',
        paymentTransferDetails: data.paymentTransferDetails ?? '',
        transferListingTerms: data.transferListingTerms ?? '',
        transferBuyingTerms: data.transferBuyingTerms ?? '',
      },
      update: data,
    });
  }
}
