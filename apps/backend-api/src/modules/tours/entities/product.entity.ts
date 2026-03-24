import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Provider } from '../../providers/entities/provider.entity';
import { Boat } from '../../boats/entities/boat.entity';
import { ProductImage } from './product-image.entity';
import { ProductPier } from './product-pier.entity';
import { ProductSchedule } from './product-schedule.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Review } from '../../reviews/entities/review.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SOLD_OUT = 'sold_out',
}

export enum DurationType {
  HALF_DAY = 'half_day',
  FULL_DAY = 'full_day',
  MULTI_DAY = 'multi_day',
  HOURLY = 'hourly',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  title_en: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  description_en: string;

  @Column({ nullable: true })
  short_description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  original_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  child_price: number;

  @Column({ type: 'enum', enum: DurationType })
  duration_type: DurationType;

  @Column({ type: 'int' })
  duration_hours: number;

  @Column({ type: 'int' })
  max_passengers: number;

  @Column({ type: 'int', default: 0 })
  min_passengers: number;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @Column({ nullable: true })
  cover_image: string;

  @Column({ type: 'simple-array', nullable: true })
  highlights: string[];

  @Column({ type: 'simple-array', nullable: true })
  inclusions: string[];

  @Column({ type: 'simple-array', nullable: true })
  exclusions: string[];

  @Column({ type: 'text', nullable: true })
  cancellation_policy: string;

  @Column({ type: 'text', nullable: true })
  itinerary: string;

  @Column({ type: 'jsonb', nullable: true })
  meeting_point: Record<string, any>;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  total_reviews: number;

  @Column({ default: 0 })
  total_bookings: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ name: 'provider_id' })
  provider_id: string;

  @Column({ name: 'boat_id', nullable: true })
  boat_id: string;

  @ManyToOne(() => Provider, (provider) => provider.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @ManyToOne(() => Boat, (boat) => boat.products, { nullable: true })
  @JoinColumn({ name: 'boat_id' })
  boat: Boat;

  @OneToMany(() => ProductImage, (image) => image.product)
  images: ProductImage[];

  @OneToMany(() => ProductPier, (productPier) => productPier.product)
  piers: ProductPier[];

  @OneToMany(() => ProductSchedule, (schedule) => schedule.product)
  schedules: ProductSchedule[];

  @OneToMany(() => Booking, (booking) => booking.product)
  bookings: Booking[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
