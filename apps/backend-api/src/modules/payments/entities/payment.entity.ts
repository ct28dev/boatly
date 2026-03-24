import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { PaymentTransaction } from './payment-transaction.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  QR_CODE = 'qr_code',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  COD = 'cod',
  PROMPTPAY = 'promptpay',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', unique: true })
  booking_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'THB' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  transaction_ref: string;

  @Column({ nullable: true })
  gateway_ref: string;

  @Column({ type: 'jsonb', nullable: true })
  gateway_response: Record<string, any>;

  @Column({ nullable: true })
  qr_code_url: string;

  @Column({ nullable: true, type: 'timestamp' })
  paid_at: Date;

  @Column({ nullable: true, type: 'timestamp' })
  expires_at: Date;

  @OneToOne(() => Booking, (booking) => booking.payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @OneToMany(() => PaymentTransaction, (tx) => tx.payment)
  transactions: PaymentTransaction[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
