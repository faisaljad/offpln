import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { PropertiesService } from '../properties/properties.service';
import { InvestmentsService } from '../investments/investments.service';
import { UsersService } from '../users/users.service';
import { StorageService } from '../storage/storage.service';
import { PaymentsService } from '../payments/payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreatePropertyDto } from '../properties/dto/create-property.dto';
import * as XLSX from 'xlsx';
import { z } from 'zod';

const BulkPropertySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  totalPrice: z.coerce.number().positive(),
  totalShares: z.coerce.number().int().positive(),
  roi: z.coerce.number().min(0),
  images: z.string().transform((v) => v.split(',').map((s) => s.trim())).or(z.array(z.string())),
  paymentPlan: z
    .string()
    .transform((v) => JSON.parse(v))
    .or(z.object({}).passthrough()),
});

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private propertiesService: PropertiesService,
    private investmentsService: InvestmentsService,
    private usersService: UsersService,
    private storageService: StorageService,
    private paymentsService: PaymentsService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // --- Properties ---
  @Get('properties')
  getProperties(@Query() query: any) {
    return this.propertiesService.findAll({ ...query, includeAll: true });
  }

  @Post('properties')
  createProperty(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(dto);
  }

  @Get('properties/:id')
  getProperty(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Put('properties/:id')
  updateProperty(@Param('id') id: string, @Body() dto: Partial<CreatePropertyDto>) {
    return this.propertiesService.update(id, dto);
  }

  @Delete('properties/:id')
  deleteProperty(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }

  @Put('properties/:id/sold')
  setPropertySold(@Param('id') id: string, @Body('sellingPrice') sellingPrice: number) {
    return this.adminService.setSold(id, Number(sellingPrice));
  }

  @Get('properties/:id/payouts')
  getPropertyPayouts(@Param('id') id: string) {
    return this.adminService.getPropertyPayouts(id);
  }

  @Put('payouts/:id/paid')
  markPayoutPaid(@Param('id') id: string, @Body('receiptUrl') receiptUrl?: string) {
    return this.adminService.markPayoutPaid(id, receiptUrl);
  }

  @Post('properties/bulk')
  @UseInterceptors(FilesInterceptor('file', 1))
  async bulkImport(@UploadedFiles() files: Express.Multer.File[]) {
    const file = files?.[0];
    if (!file) throw new BadRequestException('No file uploaded');

    let rows: any[] = [];

    if (
      file.mimetype === 'text/csv' ||
      file.originalname.endsWith('.csv')
    ) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else if (
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    ) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else {
      throw new BadRequestException('Only CSV or Excel files accepted');
    }

    const validated: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const result = BulkPropertySchema.safeParse(rows[i]);
      if (result.success) {
        validated.push(result.data);
      } else {
        errors.push({ row: i + 2, errors: result.error.flatten() });
      }
    }

    return { validated, errors, total: rows.length };
  }

  @Post('properties/bulk/confirm')
  bulkConfirm(@Body() body: { properties: CreatePropertyDto[] }) {
    return this.propertiesService.bulkCreate(body.properties);
  }

  // --- Property Types ---
  @Get('property-types')
  getPropertyTypes() {
    return this.adminService.getPropertyTypes();
  }

  @Post('property-types')
  createPropertyType(@Body('name') name: string) {
    return this.adminService.createPropertyType(name);
  }

  @Delete('property-types/:id')
  deletePropertyType(@Param('id') id: string) {
    return this.adminService.deletePropertyType(id);
  }

  // --- Investments ---
  @Get('investments')
  getAllInvestments(@Query() query: any) {
    return this.investmentsService.findAll(query);
  }

  @Get('investments/:id')
  getInvestment(@Param('id') id: string) {
    return this.investmentsService.findOne(id);
  }

  @Patch('investments/:id/status')
  updateInvestmentStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.investmentsService.updateStatus(id, status);
  }

  @Patch('payments/:id/paid')
  markPaymentPaid(@Param('id') id: string) {
    return this.paymentsService.markAsPaid(id);
  }

  @Patch('payments/:id')
  updatePayment(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('proofUrl') proofUrl?: string,
  ) {
    return this.paymentsService.updatePayment(id, status, proofUrl);
  }

  @Get('payments/review')
  getPaymentsForReview() {
    return this.paymentsService.getPaymentsForReview();
  }

  @Patch('payments/:id/approve')
  approvePayment(@Param('id') id: string, @Body('proofUrl') proofUrl?: string) {
    return this.paymentsService.adminApprove(id, proofUrl);
  }

  @Patch('payments/:id/reject')
  rejectPayment(@Param('id') id: string) {
    return this.paymentsService.adminReject(id);
  }

  // --- Users ---
  @Get('users')
  getUsers(@Query() query: any) {
    return this.usersService.findAll(query.page, query.limit, query.search);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // --- File Upload ---
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('No files uploaded');
    const urls = await this.storageService.uploadMany(files);
    return { urls };
  }
}
