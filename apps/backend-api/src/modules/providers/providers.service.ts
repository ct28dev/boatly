import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider, ProviderStatus } from './entities/provider.entity';
import { Product } from '../tours/entities/product.entity';
import { Boat } from '../boats/entities/boat.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);

  constructor(
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Boat)
    private boatRepository: Repository<Boat>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  async findAll(page = 1, limit = 20) {
    const [providers, total] = await this.providerRepository.findAndCount({
      where: { is_active: true, status: ProviderStatus.APPROVED },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: providers,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Provider> {
    const provider = await this.providerRepository.findOne({
      where: { id },
      relations: ['boats', 'products'],
    });
    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }
    return provider;
  }

  async create(data: Partial<Provider>): Promise<Provider> {
    const provider = this.providerRepository.create(data);
    return this.providerRepository.save(provider);
  }

  async update(id: string, data: Partial<Provider>): Promise<Provider> {
    const provider = await this.findById(id);
    Object.assign(provider, data);
    return this.providerRepository.save(provider);
  }

  async delete(id: string) {
    const provider = await this.findById(id);
    provider.is_active = false;
    await this.providerRepository.save(provider);
    return { message: 'Provider deactivated successfully' };
  }

  async getProviderTours(providerId: string, page = 1, limit = 20) {
    const [products, total] = await this.productRepository.findAndCount({
      where: { provider_id: providerId },
      relations: ['images', 'piers', 'piers.pier', 'schedules'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: products,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async getProviderBookings(providerId: string, page = 1, limit = 20) {
    const products = await this.productRepository.find({
      where: { provider_id: providerId },
      select: ['id'],
    });

    const productIds = products.map((p) => p.id);

    if (productIds.length === 0) {
      return { items: [], total: 0, page, limit, total_pages: 0 };
    }

    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.product', 'product')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.payment', 'payment')
      .where('booking.product_id IN (:...productIds)', { productIds })
      .orderBy('booking.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [bookings, total] = await queryBuilder.getManyAndCount();

    return {
      items: bookings,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async getProviderBoats(providerId: string) {
    return this.boatRepository.find({
      where: { provider_id: providerId },
      relations: ['crew', 'location'],
      order: { created_at: 'DESC' },
    });
  }

  async verifyProviderAccess(userId: string, providerId: string) {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
      relations: ['users'],
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const hasAccess = provider.users.some((u) => u.id === userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this provider');
    }

    return provider;
  }
}
