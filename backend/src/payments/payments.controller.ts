import {
  Controller, Get, Patch, Post, Param, Body,
  UseGuards, UseInterceptors, UploadedFiles, BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PaymentsService } from './payments.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private storageService: StorageService,
  ) {}

  @Get('upcoming')
  getUpcoming(@CurrentUser() user: any) {
    return this.paymentsService.getUpcoming(user.id);
  }

  @Get('my')
  getMyPayments(@CurrentUser() user: any) {
    return this.paymentsService.getMyPayments(user.id);
  }

  @Get('investment/:investmentId')
  getByInvestment(@Param('investmentId') investmentId: string) {
    return this.paymentsService.findByInvestment(investmentId);
  }

  // Upload file and return URL (reusable)
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 1))
  async uploadFile(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('No file uploaded');
    const urls = await this.storageService.uploadMany(files);
    return { urls };
  }

  // Investor submits proof of payment
  @Patch(':id/proof')
  submitProof(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('proofUrl') proofUrl: string,
  ) {
    return this.paymentsService.submitProof(id, user.id, proofUrl);
  }
}
