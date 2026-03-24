import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../tours/entities/product.entity';
import { ProductSchedule } from '../../tours/entities/product-schedule.entity';
import { BookingPassenger } from './booking-passenger.entity';
import { BookingRequest } from './booking-request.entity';
import { BookingCheckin } from './booking-checkin.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  booking_number: string;

  @Column({ name: 'user_id' })
  user_id: string;

  @Column({ name: 'product_id' })
  product_id: string;

  @Column({ name: 'schedule_id', nullable: true })
  schedule_id: string;

  @Column({ type: 'date' })
  booking_date: Date;

  @Column({ type: 'int' })
  adult_count: number;

  @Column({ type: 'int', default: 0 })
  child_count: number;

  @Column({ type: 'int', default: 0 })
  infant_count: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  final_price: number;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ nullable: true })
  contact_name: string;

  @Column({ nullable: true })
  contact_phone: string;

  @Column({ nullable: true })
  contact_email: string;

  @Column({ type: 'text', nullable: true })
  special_requests: string;

  @Column({ nullable: true })
  promotion_code: string;

  @Column({ nullable: true, type: 'timestamp' })
  confirmed_at: Date;

  @Column({ nullable: true, type: 'timestamp' })
  cancelled_at: Date;

  @Column({ nullable: true })
  cancellation_reason: string;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Product, (product) => product.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ProductSchedule, { nullable: true })
  @JoinColumn({ name: 'schedule_id' })
  schedule: ProductSchedule;

  @OneToMany(() => BookingPassenger, (passenger) => passenger.booking)
  passengers: BookingPassenger[];

  @OneToMany(() => BookingRequest, (request) => request.booking)
  requests: BookingRequest[];

  @OneToOne(() => BookingCheckin, (checkin) => checkin.booking)
  checkin: BookingCheckin;

  @OneToOne(() => Payment, (payment) => payment.booking)
  payment: Payment;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
