import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  getMyNotifications(@CurrentUser() user: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.notificationsService.getMyNotifications(user.sub, Number(page) || 1, Number(limit) || 20);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @Get('preferences')
  getPreferences(@CurrentUser() user: any) {
    return this.notificationsService.getPreferences(user.sub);
  }

  @Patch('preferences')
  updatePreferences(@CurrentUser() user: any, @Body() prefs: Record<string, boolean>) {
    return this.notificationsService.updatePreferences(user.sub, prefs);
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.sub, id);
  }

  @Post('mark-all-read')
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  @Post('push-token')
  registerPushToken(@CurrentUser() user: any, @Body() body: { token: string }) {
    return this.notificationsService.registerPushToken(user.sub, body.token);
  }
}
