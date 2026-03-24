import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Boat } from './boat.entity';

export enum CrewRole {
  CAPTAIN = 'captain',
  FIRST_MATE = 'first_mate',
  ENGINEER = 'engineer',
  GUIDE = 'guide',
  CREW = 'crew',
}

@Entity('boat_crew')
export class BoatCrew {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: CrewRole })
  role: CrewRole;

  @Column({ nullable: true })
  license_number: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  photo_url: string;

  @Column({ type: 'int', nullable: true })
  experience_years: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ name: 'boat_id' })
  boat_id: string;

  @ManyToOne(() => Boat, (boat) => boat.crew, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boat_id' })
  boat: Boat;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
