import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProviderStatus } from '../providers/entities/provider.entity';
import { BookingStatus } from '../bookings/entities/booking.entity';
import { ReviewStatus } from '../reviews/entities/review.entity';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Users list' })
  async getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.adminService.getUsers(page, limit);
  }

  @Get('providers')
  @ApiOperation({ summary: 'List providers with optional status filter' })
  @ApiResponse({ status: 200, description: 'Providers list' })
  @ApiQuery({ name: 'status', required: false, enum: ProviderStatus })
  async getProviders(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: ProviderStatus,
  ) {
    return this.adminService.manageProviders(page, limit, status);
  }

  @Post('providers')
  @ApiOperation({ summary: 'Create a new provider' })
  @ApiResponse({ status: 201, description: 'Provider created' })
  async createProvider(@Body() body: any) {
    return this.adminService.createProvider(body);
  }

  @Put('providers/:id/approve')
  @ApiOperation({ summary: 'Approve a provider' })
  @ApiResponse({ status: 200, description: 'Provider approved' })
  async approveProvider(@Param('id') id: string) {
    return this.adminService.approveProvider(id);
  }

  @Put('providers/:id/suspend')
  @ApiOperation({ summary: 'Suspend a provider' })
  @ApiResponse({ status: 200, description: 'Provider suspended' })
  async suspendProvider(@Param('id') id: string) {
    return this.adminService.suspendProvider(id);
  }

  @Post('boats')
  @ApiOperation({ summary: 'Create a new boat' })
  @ApiResponse({ status: 201, description: 'Boat created' })
  async createBoat(@Body() body: any) {
    return this.adminService.createBoat(body);
  }

  @Post('tours')
  @ApiOperation({ summary: 'Create a new tour' })
  @ApiResponse({ status: 201, description: 'Tour created' })
  async createTour(@Body() body: any) {
    return this.adminService.createTour(body);
  }

  @Put('tours/:id')
  @ApiOperation({ summary: 'Update a tour' })
  @ApiResponse({ status: 200, description: 'Tour updated' })
  async updateTour(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateTour(id, body);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'List all bookings' })
  @ApiResponse({ status: 200, description: 'Bookings list' })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  async getBookings(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: BookingStatus,
  ) {
    return this.adminService.manageBookings(page, limit, status);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'List reviews for moderation' })
  @ApiResponse({ status: 200, description: 'Reviews list' })
  @ApiQuery({ name: 'status', required: false, enum: ReviewStatus })
  async getReviews(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: ReviewStatus,
  ) {
    return this.adminService.moderateReviews(page, limit, status);
  }

  @Post('reviews/:id/approve')
  @ApiOperation({ summary: 'Approve a review' })
  @ApiResponse({ status: 200, description: 'Review approved' })
  async approveReview(@Param('id') id: string) {
    return this.adminService.approveReview(id);
  }

  @Post('reviews/:id/reject')
  @ApiOperation({ summary: 'Reject a review' })
  @ApiResponse({ status: 200, description: 'Review rejected' })
  async rejectReview(@Param('id') id: string) {
    return this.adminService.rejectReview(id);
  }
}
