import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Provider, ProviderStatus } from '../providers/entities/provider.entity';
import { Boat } from '../boats/entities/boat.entity';
import { Product, ProductStatus } from '../tours/entities/product.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { Review, ReviewStatus } from '../reviews/entities/review.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    @InjectRepository(Boat)
    private boatRepository: Repository<Boat>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalProviders,
      totalBoats,
      totalTours,
      totalBookings,
      pendingBookings,
      completedBookings,
      pendingReviews,
      revenueResult,
      recentBookings,
      monthlyBookings,
    ] = await Promise.all([
      this.userRepository.count(),
      this.providerRepository.count({ where: { status: ProviderStatus.APPROVED } }),
      this.boatRepository.count(),
      this.productRepository.count({ where: { status: ProductStatus.ACTIVE } }),
      this.bookingRepository.count(),
      this.bookingRepository.count({ where: { status: BookingStatus.PENDING } }),
      this.bookingRepository.count({ where: { status: BookingStatus.COMPLETED } }),
      this.reviewRepository.count({ where: { status: ReviewStatus.PENDING } }),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne(),
      this.bookingRepository.find({
        relations: ['user', 'product'],
        order: { created_at: 'DESC' },
        take: 10,
      }),
      this.bookingRepository
        .createQueryBuilder('booking')
        .select("TO_CHAR(booking.created_at, 'YYYY-MM')", 'month')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(booking.final_price)', 'revenue')
        .groupBy("TO_CHAR(booking.created_at, 'YYYY-MM')")
        .orderBy('month', 'DESC')
        .limit(12)
        .getRawMany(),
    ]);

    return {
      overview: {
        total_users: totalUsers,
        total_providers: totalProviders,
        total_boats: totalBoats,
        total_tours: totalTours,
        total_bookings: totalBookings,
        pending_bookings: pendingBookings,
        completed_bookings: completedBookings,
        pending_reviews: pendingReviews,
        total_revenue: parseFloat(revenueResult?.total || '0'),
      },
      recent_bookings: recentBookings,
      monthly_stats: monthlyBookings,
    };
  }

  async manageProviders(page = 1, limit = 20, status?: ProviderStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [items, total] = await this.providerRepository.findAndCount({
      where,
      relations: ['users', 'boats'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit, total_pages: Math.ceil(total / limit) };
  }

  async approveProvider(providerId: string) {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    provider.status = ProviderStatus.APPROVED;
    return this.providerRepository.save(provider);
  }

  async suspendProvider(providerId: string) {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    provider.status = ProviderStatus.SUSPENDED;
    provider.is_active = false;
    return this.providerRepository.save(provider);
  }

  async createProvider(data: Partial<Provider>): Promise<Provider> {
    const provider = this.providerRepository.create(data);
    return this.providerRepository.save(provider);
  }

  async createBoat(data: Partial<Boat>): Promise<Boat> {
    const boat = this.boatRepository.create(data);
    return this.boatRepository.save(boat);
  }

  async createTour(data: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(data);
    return this.productRepository.save(product);
  }

  async updateTour(id: string, data: Partial<Product>): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Tour not found');
    }
    Object.assign(product, data);
    return this.productRepository.save(product);
  }

  async manageBookings(page = 1, limit = 20, status?: BookingStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [items, total] = await this.bookingRepository.findAndCount({
      where,
      relations: ['user', 'product', 'payment'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit, total_pages: Math.ceil(total / limit) };
  }

  async moderateReviews(page = 1, limit = 20, status?: ReviewStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [items, total] = await this.reviewRepository.findAndCount({
      where,
      relations: ['user', 'product', 'images'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit, total_pages: Math.ceil(total / limit) };
  }

  async approveReview(reviewId: string) {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.status = ReviewStatus.APPROVED;
    const saved = await this.reviewRepository.save(review);

    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('review.product_id = :productId', { productId: review.product_id })
      .andWhere('review.status = :status', { status: ReviewStatus.APPROVED })
      .getRawOne();

    await this.productRepository.update(review.product_id, {
      rating: parseFloat(stats?.avg || '0'),
      total_reviews: parseInt(stats?.count || '0', 10),
    });

    return saved;
  }

  async rejectReview(reviewId: string) {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.status = ReviewStatus.REJECTED;
    return this.reviewRepository.save(review);
  }

  async getUsers(page = 1, limit = 20) {
    const [items, total] = await this.userRepository.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit, total_pages: Math.ceil(total / limit) };
  }
}
