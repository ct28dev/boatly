import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Favorite } from './entities/favorite.entity';
import { Notification } from './entities/notification.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['provider'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['provider'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, data: Partial<User>) {
    await this.findById(userId);
    await this.userRepository.update(userId, data);
    return this.findById(userId);
  }

  async getUserBookings(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['bookings', 'bookings.product', 'bookings.product.images', 'bookings.payment'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.bookings;
  }

  async getFavorites(userId: string) {
    return this.favoriteRepository.find({
      where: { user_id: userId },
      relations: ['product', 'product.images', 'product.provider'],
      order: { created_at: 'DESC' },
    });
  }

  async addFavorite(userId: string, productId: string) {
    const existing = await this.favoriteRepository.findOne({
      where: { user_id: userId, product_id: productId },
    });
    if (existing) {
      throw new ConflictException('Product is already in favorites');
    }

    const favorite = this.favoriteRepository.create({
      user_id: userId,
      product_id: productId,
    });
    return this.favoriteRepository.save(favorite);
  }

  async removeFavorite(userId: string, productId: string) {
    const favorite = await this.favoriteRepository.findOne({
      where: { user_id: userId, product_id: productId },
    });
    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }
    await this.favoriteRepository.remove(favorite);
    return { message: 'Favorite removed successfully' };
  }

  async getNotifications(userId: string, unreadOnly = false) {
    const where: any = { user_id: userId };
    if (unreadOnly) {
      where.is_read = false;
    }

    return this.notificationRepository.find({
      where,
      order: { created_at: 'DESC' },
      take: 50,
    });
  }
}
