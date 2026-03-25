import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('investments')
@UseGuards(JwtAuthGuard)
export class InvestmentsController {
  constructor(private investmentsService: InvestmentsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateInvestmentDto) {
    return this.investmentsService.create(user.id, dto);
  }

  @Get('my')
  getUserInvestments(
    @CurrentUser() user: any,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.investmentsService.findUserInvestments(user.id, page, limit);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.investmentsService.findOne(id, user.id);
  }
}
