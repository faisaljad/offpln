import { Controller, Get, Put, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: any,
    @Body() body: { name?: string; phone?: string },
  ) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Get('bank-details')
  getBankDetails(@CurrentUser() user: any) {
    return this.usersService.getBankDetails(user.id);
  }

  @Put('bank-details')
  updateBankDetails(@CurrentUser() user: any, @Body() body: any) {
    return this.usersService.updateBankDetails(user.id, body);
  }
}
