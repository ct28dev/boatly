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
import { Provider } from '../../providers/entities/provider.entity';
import { BoatCrew } from './boat-crew.entity';
import { BoatLocation } from './boat-location.entity';
import { Product } from '../../tours/entities/product.entity';

export enum BoatType {
  SPEEDBOAT = 'speedboat',
  YACHT = 'yacht',
  LONGTAIL = 'longtail',
  CATAMARAN = 'catamaran',
  SAILBOAT = 'sailboat',
  FERRY = 'ferry',
  FISHING = 'fishing',
}

export enum BoatStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}

@Entity('boats')
export class Boat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  name_en: string;

  @Column({ type: 'enum', enum: BoatType })
  type: BoatType;

  @Column({ nullable: true })
  registration_number: string;

  @Column({ nullable: true })
  license_number: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ type: 'simple-array', nullable: true })
  gallery_urls: string[];

  @Column({ type: 'enum', enum: BoatStatus, default: BoatStatus.ACTIVE })
  status: BoatStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  length_meters: number;

  @Column({ nullable: true })
  engine_type: string;

  @Column({ type: 'int', nullable: true })
  engine_power_hp: number;

  @Column({ type: 'int', nullable: true })
  year_built: number;

  @Column({ type: 'jsonb', nullable: true })
  safety_equipment: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  amenities: Record<string, any>;

  @Column({ name: 'provider_id' })
  provider_id: string;

  @ManyToOne(() => Provider, (provider) => provider.boats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @OneToMany(() => BoatCrew, (crew) => crew.boat)
  crew: BoatCrew[];

  @OneToOne(() => BoatLocation, (location) => location.boat)
  location: BoatLocation;

  @OneToMany(() => Product, (product) => product.boat)
  products: Product[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
