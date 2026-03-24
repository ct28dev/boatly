import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: DiscountType })
  discount_type: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discount_value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  min_order_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  max_discount_amount: number;

  @Column({ type: 'int', nullable: true })
  usage_limit: number;

  @Column({ type: 'int', default: 0 })
  used_count: number;

  @Column({ type: 'int', nullable: true })
  per_user_limit: number;

  @Column({ type: 'timestamp' })
  start_date: Date;

  @Column({ type: 'timestamp' })
  end_date: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'simple-array', nullable: true })
  applicable_product_ids: string[];

  @Column({ nullable: true })
  image_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
