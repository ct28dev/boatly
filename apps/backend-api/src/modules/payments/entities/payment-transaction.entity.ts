import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Payment } from './payment.entity';

export enum TransactionType {
  CHARGE = 'charge',
  REFUND = 'refund',
  VOID = 'void',
}

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_id' })
  payment_id: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  status: string;

  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'jsonb', nullable: true })
  raw_response: Record<string, any>;

  @Column({ nullable: true })
  error_message: string;

  @ManyToOne(() => Payment, (payment) => payment.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @CreateDateColumn()
  created_at: Date;
}
