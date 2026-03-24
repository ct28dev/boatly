import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';

export enum PassengerType {
  ADULT = 'adult',
  CHILD = 'child',
  INFANT = 'infant',
}

@Entity('booking_passengers')
export class BookingPassenger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id' })
  booking_id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ type: 'enum', enum: PassengerType })
  type: PassengerType;

  @Column({ nullable: true })
  id_card_number: string;

  @Column({ nullable: true })
  passport_number: string;

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: true, type: 'date' })
  date_of_birth: Date;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  medical_conditions: string;

  @ManyToOne(() => Booking, (booking) => booking.passengers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @CreateDateColumn()
  created_at: Date;
}
