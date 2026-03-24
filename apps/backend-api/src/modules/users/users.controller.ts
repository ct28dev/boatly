import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() body: { first_name?: string; last_name?: string; phone?: string; avatar_url?: string; language?: string },
  ) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get user bookings' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  async getBookings(@CurrentUser() user: any) {
    return this.usersService.getUserBookings(user.id);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiResponse({ status: 200, description: 'Favorites retrieved successfully' })
  async getFavorites(@CurrentUser() user: any) {
    return this.usersService.getFavorites(user.id);
  }

  @Post('favorites')
  @ApiOperation({ summary: 'Add product to favorites' })
  @ApiResponse({ status: 201, description: 'Added to favorites' })
  @ApiResponse({ status: 409, description: 'Already in favorites' })
  async addFavorite(
    @CurrentUser() user: any,
    @Body() body: { product_id: string },
  ) {
    return this.usersService.addFavorite(user.id, body.product_id);
  }

  @Delete('favorites/:productId')
  @ApiOperation({ summary: 'Remove product from favorites' })
  @ApiResponse({ status: 200, description: 'Removed from favorites' })
  async removeFavorite(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ) {
    return this.usersService.removeFavorite(user.id, productId);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  async getNotifications(
    @CurrentUser() user: any,
    @Query('unread_only') unreadOnly?: boolean,
  ) {
    return this.usersService.getNotifications(user.id, unreadOnly);
  }
}
