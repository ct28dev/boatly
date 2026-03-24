import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToursController } from './tours.controller';
import { ToursService } from './tours.service';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductPier } from './entities/product-pier.entity';
import { ProductSchedule } from './entities/product-schedule.entity';
import { Review } from '../reviews/entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage, ProductPier, ProductSchedule, Review]),
  ],
  controllers: [ToursController],
  providers: [ToursService],
  exports: [ToursService],
})
export class ToursModule {}
