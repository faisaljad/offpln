import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private transfersService: TransfersService) {}

  // ── Investor endpoints ───────────────────────────────────────────────────

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() body: { investmentId: string; askPrice: number; notes?: string },
  ) {
    return this.transfersService.createListing(user.id, body.investmentId, body.askPrice, body.notes);
  }

  @Put(':id/cancel')
  cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.transfersService.cancelListing(user.id, id);
  }

  @Get('marketplace')
  marketplace() {
    return this.transfersService.getMarketplace();
  }

  @Post(':id/buy')
  buy(@CurrentUser() user: any, @Param('id') id: string) {
    return this.transfersService.requestBuy(user.id, id);
  }

  @Get('my')
  myTransfers(@CurrentUser() user: any) {
    return this.transfersService.getMyTransfers(user.id);
  }

  @Get(':id')
  getOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.transfersService.getOne(id, user.id);
  }

  @Post(':id/confirm')
  confirm(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('code') code: string,
  ) {
    return this.transfersService.confirmWithOtp(user.id, id, code);
  }

  @Post(':id/resend-otp')
  resendOtp(@CurrentUser() user: any, @Param('id') id: string) {
    return this.transfersService.resendOtp(user.id, id);
  }

  // ── Admin endpoints ──────────────────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  adminGetAll(@Query('status') status?: string) {
    return this.transfersService.adminGetAll(status);
  }

  @Put('admin/:id/approve-listing')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  adminApproveListing(@Param('id') id: string) {
    return this.transfersService.adminApproveListing(id);
  }

  @Put('admin/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  adminApprove(@Param('id') id: string) {
    return this.transfersService.adminApprove(id);
  }

  @Put('admin/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  adminReject(@Param('id') id: string, @Body('note') note?: string) {
    return this.transfersService.adminReject(id, note);
  }

  @Put('admin/:id/reject-request')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  adminRejectRequest(@Param('id') id: string, @Body('note') note?: string) {
    return this.transfersService.adminRejectRequest(id, note);
  }
}
