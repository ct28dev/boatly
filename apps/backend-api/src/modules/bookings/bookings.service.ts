import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { BookingPassenger } from './entities/booking-passenger.entity';
import { BookingRequest, RequestStatus } from './entities/booking-request.entity';
import { BookingCheckin } from './entities/booking-checkin.entity';
import { Product } from '../tours/entities/product.entity';
import { ProductSchedule } from '../tours/entities/product-schedule.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AddPassengersDto } from './dto/add-passengers.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(BookingPassenger)
    private passengerRepository: Repository<BookingPassenger>,
    @InjectRepository(BookingRequest)
    private requestRepository: Repository<BookingRequest>,
    @InjectRepository(BookingCheckin)
    private checkinRepository: Repository<BookingCheckin>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductSchedule)
    private scheduleRepository: Repository<ProductSchedule>,
  ) {}

  async create(userId: string, dto: CreateBookingDto) {
    const product = await this.productRepository.findOne({
      where: { id: dto.product_id },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const totalPassengers = dto.adult_count + (dto.child_count || 0);
    if (totalPassengers > product.max_passengers) {
      throw new BadRequestException(
        `Maximum ${product.max_passengers} passengers allowed for this tour`,
      );
    }

    if (dto.schedule_id) {
      const schedule = await this.scheduleRepository.findOne({
        where: { id: dto.schedule_id },
      });
      if (!schedule || !schedule.is_available) {
        throw new BadRequestException('Selected schedule is not available');
      }
      if (schedule.available_seats - schedule.booked_seats < totalPassengers) {
        throw new BadRequestException('Not enough seats available');
      }
    }

    const adultTotal = dto.adult_count * Number(product.price);
    const childTotal = (dto.child_count || 0) * Number(product.child_price || product.price);
    const totalPrice = adultTotal + childTotal;

    const bookingNumber = `BH-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;

    const booking = this.bookingRepository.create({
      booking_number: bookingNumber,
      user_id: userId,
      product_id: dto.product_id,
      schedule_id: dto.schedule_id,
      booking_date: dto.booking_date,
      adult_count: dto.adult_count,
      child_count: dto.child_count || 0,
      infant_count: dto.infant_count || 0,
      total_price: totalPrice,
      discount_amount: 0,
      final_price: totalPrice,
      status: BookingStatus.PENDING,
      contact_name: dto.contact_name,
      contact_phone: dto.contact_phone,
      contact_email: dto.contact_email,
      special_requests: dto.special_requests,
      promotion_code: dto.promotion_code,
    });

    const saved = await this.bookingRepository.save(booking);

    if (dto.schedule_id) {
      await this.scheduleRepository.increment(
        { id: dto.schedule_id },
        'booked_seats',
        totalPassengers,
      );
    }

    await this.productRepository.increment(
      { id: dto.product_id },
      'total_bookings',
      1,
    );

    return this.findById(saved.id);
  }

  async findById(id: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: [
        'product',
        'product.images',
        'product.provider',
        'schedule',
        'passengers',
        'requests',
        'checkin',
        'payment',
        'user',
      ],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async findByBookingNumber(bookingNumber: string) {
    const booking = await this.bookingRepository.findOne({
      where: { booking_number: bookingNumber },
      relations: ['product', 'product.images', 'passengers', 'payment'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingNumber} not found`);
    }

    return booking;
  }

  async checkAvailability(productId: string, date: string, passengers: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const schedules = await this.scheduleRepository.find({
      where: { product_id: productId, date: new Date(date), is_available: true },
    });

    const availableSchedules = schedules.filter(
      (s) => s.available_seats - s.booked_seats >= passengers,
    );

    return {
      product_id: productId,
      date,
      requested_passengers: passengers,
      is_available: availableSchedules.length > 0,
      available_schedules: availableSchedules.map((s) => ({
        id: s.id,
        departure_time: s.departure_time,
        return_time: s.return_time,
        available_seats: s.available_seats - s.booked_seats,
        price: s.price_override || product.price,
      })),
    };
  }

  async addPassengers(dto: AddPassengersDto) {
    const booking = await this.findById(dto.booking_id);

    const passengers = dto.passengers.map((p) =>
      this.passengerRepository.create({
        booking_id: dto.booking_id,
        ...p,
      }),
    );

    const saved = await this.passengerRepository.save(passengers);
    return saved;
  }

  async addRequest(bookingId: string, requestType: string, description: string) {
    const booking = await this.findById(bookingId);

    const request = this.requestRepository.create({
      booking_id: bookingId,
      request_type: requestType,
      description,
      status: RequestStatus.PENDING,
    });

    return this.requestRepository.save(request);
  }

  async confirm(bookingId: string) {
    const booking = await this.findById(bookingId);

    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.PAID) {
      throw new BadRequestException(
        `Cannot confirm booking with status ${booking.status}`,
      );
    }

    booking.status = BookingStatus.CONFIRMED;
    booking.confirmed_at = new Date();

    return this.bookingRepository.save(booking);
  }

  async cancel(bookingId: string, reason: string) {
    const booking = await this.findById(bookingId);

    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot cancel this booking');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelled_at = new Date();
    booking.cancellation_reason = reason;

    if (booking.schedule_id) {
      const totalPassengers = booking.adult_count + booking.child_count;
      await this.scheduleRepository.decrement(
        { id: booking.schedule_id },
        'booked_seats',
        totalPassengers,
      );
    }

    return this.bookingRepository.save(booking);
  }

  async checkin(bookingId: string, data: { pier_id?: string; latitude?: number; longitude?: number; qr_code?: string }) {
    const booking = await this.findById(bookingId);

    if (
      booking.status !== BookingStatus.CONFIRMED &&
      booking.status !== BookingStatus.PAID
    ) {
      throw new BadRequestException('Booking must be confirmed or paid to check in');
    }

    let checkin = await this.checkinRepository.findOne({
      where: { booking_id: bookingId },
    });

    if (checkin) {
      throw new BadRequestException('Already checked in');
    }

    checkin = this.checkinRepository.create({
      booking_id: bookingId,
      pier_id: data.pier_id,
      latitude: data.latitude,
      longitude: data.longitude,
      qr_code: data.qr_code,
    });

    await this.checkinRepository.save(checkin);

    booking.status = BookingStatus.CHECKED_IN;
    await this.bookingRepository.save(booking);

    return checkin;
  }

  async getCheckinStatus(bookingId: string) {
    const checkin = await this.checkinRepository.findOne({
      where: { booking_id: bookingId },
    });

    return {
      booking_id: bookingId,
      is_checked_in: !!checkin,
      checkin,
    };
  }

  async getUserBookings(userId: string, status?: BookingStatus, page = 1, limit = 20) {
    const where: any = { user_id: userId };
    if (status) {
      where.status = status;
    }

    const [items, total] = await this.bookingRepository.findAndCount({
      where,
      relations: ['product', 'product.images', 'payment'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }
}
