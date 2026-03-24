import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductSchedule } from './entities/product-schedule.entity';
import { Review, ReviewStatus } from '../../modules/reviews/entities/review.entity';
import { TourQueryDto } from './dto/tour-query.dto';

@Injectable()
export class ToursService {
  private readonly logger = new Logger(ToursService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private imageRepository: Repository<ProductImage>,
    @InjectRepository(ProductSchedule)
    private scheduleRepository: Repository<ProductSchedule>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async findAll(query: TourQueryDto) {
    const { page = 1, limit = 20 } = query;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.provider', 'provider')
      .leftJoinAndSelect('product.boat', 'boat')
      .leftJoinAndSelect('product.piers', 'productPiers')
      .leftJoinAndSelect('productPiers.pier', 'pier')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.is_active = :active', { active: true });

    this.applyFilters(qb, query);

    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'DESC';
    qb.orderBy(`product.${sortBy}`, sortOrder);

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: [
        'images',
        'provider',
        'boat',
        'boat.crew',
        'piers',
        'piers.pier',
        'schedules',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Tour with ID ${id} not found`);
    }

    const reviewStats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg_rating')
      .addSelect('COUNT(*)', 'total_reviews')
      .where('review.product_id = :id', { id })
      .andWhere('review.status = :status', { status: ReviewStatus.APPROVED })
      .getRawOne();

    return {
      ...product,
      review_stats: {
        average_rating: parseFloat(reviewStats?.avg_rating || '0'),
        total_reviews: parseInt(reviewStats?.total_reviews || '0', 10),
      },
    };
  }

  async findNearby(latitude: number, longitude: number, radiusKm = 50, limit = 20) {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.provider', 'provider')
      .leftJoinAndSelect('product.piers', 'productPiers')
      .leftJoinAndSelect('productPiers.pier', 'pier')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.is_active = :active', { active: true })
      .andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(pier.latitude)) * cos(radians(pier.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(pier.latitude)))) <= :radius`,
        { lat: latitude, lng: longitude, radius: radiusKm },
      )
      .take(limit)
      .getMany();

    return products;
  }

  async getRecommended(limit = 10) {
    return this.productRepository.find({
      where: { status: ProductStatus.ACTIVE, is_active: true },
      relations: ['images', 'provider'],
      order: { rating: 'DESC', total_bookings: 'DESC' },
      take: limit,
    });
  }

  async search(keyword: string, page = 1, limit = 20) {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.provider', 'provider')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.is_active = :active', { active: true })
      .andWhere(
        '(product.title ILIKE :keyword OR product.title_en ILIKE :keyword OR product.description ILIKE :keyword OR product.category ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      )
      .orderBy('product.rating', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async getReviews(productId: string, page = 1, limit = 20) {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { product_id: productId, status: ReviewStatus.APPROVED },
      relations: ['user', 'images'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: reviews,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async create(data: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(data);
    return this.productRepository.save(product);
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Tour with ID ${id} not found`);
    }
    Object.assign(product, data);
    return this.productRepository.save(product);
  }

  private applyFilters(qb: SelectQueryBuilder<Product>, query: TourQueryDto) {
    if (query.search) {
      qb.andWhere(
        '(product.title ILIKE :search OR product.title_en ILIKE :search OR product.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.boat_type) {
      qb.andWhere('boat.type = :boatType', { boatType: query.boat_type });
    }

    if (query.duration) {
      qb.andWhere('product.duration_type = :duration', { duration: query.duration });
    }

    if (query.min_price !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: query.min_price });
    }

    if (query.max_price !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: query.max_price });
    }

    if (query.category) {
      qb.andWhere('product.category = :category', { category: query.category });
    }

    if (query.location) {
      qb.andWhere(
        '(pier.name ILIKE :location OR pier.name_en ILIKE :location)',
        { location: `%${query.location}%` },
      );
    }
  }
}
