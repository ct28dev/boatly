import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_schedules')
export class ProductSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  product_id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  departure_time: string;

  @Column({ nullable: true })
  return_time: string;

  @Column({ type: 'int' })
  available_seats: number;

  @Column({ type: 'int', default: 0 })
  booked_seats: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price_override: number;

  @Column({ default: true })
  is_available: boolean;

  @ManyToOne(() => Product, (product) => product.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
