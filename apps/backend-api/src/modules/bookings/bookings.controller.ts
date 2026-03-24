import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AddPassengersDto } from './dto/add-passengers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BookingStatus } from './entities/booking.entity';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created' })
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  async findById(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Post('check-availability')
  @ApiOperation({ summary: 'Check tour availability' })
  @ApiResponse({ status: 200, description: 'Availability result' })
  async checkAvailability(
    @Body() body: { product_id: string; date: string; passengers: number },
  ) {
    return this.bookingsService.checkAvailability(
      body.product_id,
      body.date,
      body.passengers,
    );
  }

  @Post('add-passengers')
  @ApiOperation({ summary: 'Add passengers to a booking' })
  @ApiResponse({ status: 201, description: 'Passengers added' })
  async addPassengers(@Body() dto: AddPassengersDto) {
    return this.bookingsService.addPassengers(dto);
  }

  @Post('add-request')
  @ApiOperation({ summary: 'Add a special request to booking' })
  @ApiResponse({ status: 201, description: 'Request added' })
  async addRequest(
    @Body() body: { booking_id: string; request_type: string; description: string },
  ) {
    return this.bookingsService.addRequest(
      body.booking_id,
      body.request_type,
      body.description,
    );
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a booking' })
  @ApiResponse({ status: 200, description: 'Booking confirmed' })
  async confirm(@Body() body: { booking_id: string }) {
    return this.bookingsService.confirm(body.booking_id);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  async cancel(@Body() body: { booking_id: string; reason: string }) {
    return this.bookingsService.cancel(body.booking_id, body.reason);
  }

  @Post('checkin/pier')
  @ApiOperation({ summary: 'Check in at pier' })
  @ApiResponse({ status: 200, description: 'Checked in' })
  async checkin(
    @Body() body: { booking_id: string; pier_id?: string; latitude?: number; longitude?: number; qr_code?: string },
  ) {
    return this.bookingsService.checkin(body.booking_id, body);
  }

  @Get('checkin/status/:bookingId')
  @ApiOperation({ summary: 'Get check-in status' })
  @ApiResponse({ status: 200, description: 'Check-in status' })
  async getCheckinStatus(@Param('bookingId') bookingId: string) {
    return this.bookingsService.getCheckinStatus(bookingId);
  }

  @Get('user/my-bookings')
  @ApiOperation({ summary: 'Get current user bookings' })
  @ApiResponse({ status: 200, description: 'User bookings' })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getMyBookings(
    @CurrentUser() user: any,
    @Query('status') status?: BookingStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.bookingsService.getUserBookings(user.id, status, page, limit);
  }
}
