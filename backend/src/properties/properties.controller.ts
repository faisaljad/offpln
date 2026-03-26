import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { QueryPropertyDto } from './dto/query-property.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('properties')
export class PropertiesController {
  constructor(private propertiesService: PropertiesService) {}

  @Get()
  findAll(@Query() query: QueryPropertyDto) {
    return this.propertiesService.findAll(query);
  }

  @Get('emirates')
  getEmirates() {
    return this.propertiesService.getEmirates();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Get(':id/payout-summary')
  @UseGuards(OptionalJwtAuthGuard)
  getPayoutSummary(@Param('id') id: string, @Request() req: any) {
    return this.propertiesService.getPayoutSummary(id, req.user?.id);
  }
}
