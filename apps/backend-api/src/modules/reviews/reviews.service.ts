import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewStatus } from './entities/review.entity';
import { ReviewImage } from './entities/review-image.entity';
import { Product } from '../tours/entities/product.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(ReviewImage)
    private reviewImageRepository: Repository<ReviewImage>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  async create(userId: string, data: { product_id: string; booking_id?: string; rating: number; comment?: string }) {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const product = await this.productRepository.findOne({
      where: { id: data.product_id },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (data.booking_id) {
      const booking = await this.bookingRepository.findOne({
        where: { id: data.booking_id, user_id: userId },
      });
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
      if (booking.status !== BookingStatus.COMPLETED) {
        throw new BadRequestException('Can only review completed bookings');
      }
    }

    const existingReview = await this.reviewRepository.findOne({
      where: { user_id: userId, product_id: data.product_id },
    });
    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    const review = this.reviewRepository.create({
      user_id: userId,
      product_id: data.product_id,
      booking_id: data.booking_id,
      rating: data.rating,
      comment: data.comment,
      status: ReviewStatus.PENDING,
    });

    const savedReview = await this.reviewRepository.save(review);

    await this.updateProductRating(data.product_id);

    return savedReview;
  }

  async getByProduct(productId: string, page = 1, limit = 20) {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { product_id: productId, status: ReviewStatus.APPROVED },
      relations: ['user', 'images'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        `json_build_object(
          '5', SUM(CASE WHEN review.rating = 5 THEN 1 ELSE 0 END),
          '4', SUM(CASE WHEN review.rating = 4 THEN 1 ELSE 0 END),
          '3', SUM(CASE WHEN review.rating = 3 THEN 1 ELSE 0 END),
          '2', SUM(CASE WHEN review.rating = 2 THEN 1 ELSE 0 END),
          '1', SUM(CASE WHEN review.rating = 1 THEN 1 ELSE 0 END)
        )`,
        'distribution',
      )
      .where('review.product_id = :productId', { productId })
      .andWhere('review.status = :status', { status: ReviewStatus.APPROVED })
      .getRawOne();

    return {
      items: reviews,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      stats: {
        average_rating: parseFloat(stats?.average || '0'),
        total_reviews: parseInt(stats?.count || '0', 10),
        distribution: stats?.distribution || {},
      },
    };
  }

  async uploadImages(reviewId: string, imageUrls: string[]) {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const images = imageUrls.map((url, index) =>
      this.reviewImageRepository.create({
        review_id: reviewId,
        url,
        sort_order: index,
      }),
    );

    return this.reviewImageRepository.save(images);
  }

  async approve(reviewId: string) {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.status = ReviewStatus.APPROVED;
    await this.reviewRepository.save(review);

    await this.updateProductRating(review.product_id);

    return review;
  }

  async reject(reviewId: string) {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.status = ReviewStatus.REJECTED;
    await this.reviewRepository.save(review);

    await this.updateProductRating(review.product_id);

    return review;
  }

  async respondToReview(reviewId: string, response: string) {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.provider_response = response;
    review.responded_at = new Date();
    return this.reviewRepository.save(review);
  }

  private async updateProductRating(productId: string) {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('review.product_id = :productId', { productId })
      .andWhere('review.status = :status', { status: ReviewStatus.APPROVED })
      .getRawOne();

    await this.productRepository.update(productId, {
      rating: parseFloat(result?.avg || '0'),
      total_reviews: parseInt(result?.count || '0', 10),
    });
  }
}
