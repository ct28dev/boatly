import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Boat } from './boat.entity';

@Entity('boat_locations')
export class BoatLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'boat_id', unique: true })
  boat_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  heading: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  speed_knots: number;

  @Column({ nullable: true })
  status: string;

  @OneToOne(() => Boat, (boat) => boat.location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boat_id' })
  boat: Boat;

  @UpdateDateColumn()
  updated_at: Date;
}
