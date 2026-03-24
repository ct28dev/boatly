import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';

@Entity('booking_checkins')
export class BookingCheckin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', unique: true })
  booking_id: string;

  @Column({ nullable: true })
  pier_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  qr_code: string;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ nullable: true })
  verified_by: string;

  @OneToOne(() => Booking, (booking) => booking.checkin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @CreateDateColumn()
  checked_in_at: Date;
}
