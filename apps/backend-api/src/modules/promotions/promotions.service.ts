import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Promotion, DiscountType } from './entities/promotion.entity';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    @InjectRepository(Promotion)
    private promotionRepository: Repository<Promotion>,
  ) {}

  async findAll(page = 1, limit = 20) {
    const [items, total] = await this.promotionRepository.findAndCount({
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

  async getActive() {
    const now = new Date();

    return this.promotionRepository.find({
      where: {
        is_active: true,
        start_date: LessThanOrEqual(now),
        end_date: MoreThanOrEqual(now),
      },
      order: { end_date: 'ASC' },
    });
  }

  async findByCode(code: string): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion code not found');
    }

    return promotion;
  }

  async validateAndCalculate(code: string, orderAmount: number, productId?: string) {
    const promotion = await this.findByCode(code);
    const now = new Date();

    if (!promotion.is_active) {
      throw new BadRequestException('Promotion is no longer active');
    }

    if (now < promotion.start_date || now > promotion.end_date) {
      throw new BadRequestException('Promotion has expired or not yet started');
    }

    if (promotion.usage_limit && promotion.used_count >= promotion.usage_limit) {
      throw new BadRequestException('Promotion usage limit reached');
    }

    if (promotion.min_order_amount && orderAmount < Number(promotion.min_order_amount)) {
      throw new BadRequestException(
        `Minimum order amount is ${promotion.min_order_amount} THB`,
      );
    }

    if (
      productId &&
      promotion.applicable_product_ids &&
      promotion.applicable_product_ids.length > 0 &&
      !promotion.applicable_product_ids.includes(productId)
    ) {
      throw new BadRequestException('Promotion not applicable for this product');
    }

    let discountAmount: number;
    if (promotion.discount_type === DiscountType.PERCENTAGE) {
      discountAmount = orderAmount * (Number(promotion.discount_value) / 100);
    } else {
      discountAmount = Number(promotion.discount_value);
    }

    if (promotion.max_discount_amount) {
      discountAmount = Math.min(discountAmount, Number(promotion.max_discount_amount));
    }

    discountAmount = Math.min(discountAmount, orderAmount);

    return {
      promotion_id: promotion.id,
      code: promotion.code,
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      discount_amount: Math.round(discountAmount * 100) / 100,
      final_amount: Math.round((orderAmount - discountAmount) * 100) / 100,
      is_valid: true,
    };
  }

  async create(data: Partial<Promotion>): Promise<Promotion> {
    if (data.code) {
      data.code = data.code.toUpperCase();
    }

    const existing = await this.promotionRepository.findOne({
      where: { code: data.code },
    });
    if (existing) {
      throw new BadRequestException('Promotion code already exists');
    }

    const promotion = this.promotionRepository.create(data);
    return this.promotionRepository.save(promotion);
  }

  async update(id: string, data: Partial<Promotion>): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({ where: { id } });
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }
    Object.assign(promotion, data);
    return this.promotionRepository.save(promotion);
  }

  async incrementUsage(promotionId: string) {
    await this.promotionRepository.increment({ id: promotionId }, 'used_count', 1);
  }
}
