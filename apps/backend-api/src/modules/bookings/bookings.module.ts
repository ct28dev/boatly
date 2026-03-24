import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { BookingPassenger } from './entities/booking-passenger.entity';
import { BookingRequest } from './entities/booking-request.entity';
import { BookingCheckin } from './entities/booking-checkin.entity';
import { Product } from '../tours/entities/product.entity';
import { ProductSchedule } from '../tours/entities/product-schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingPassenger,
      BookingRequest,
      BookingCheckin,
      Product,
      ProductSchedule,
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
