import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Boat } from '../../boats/entities/boat.entity';
import { Product } from '../../tours/entities/product.entity';

export enum ProviderStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_name: string;

  @Column({ nullable: true })
  company_name_en: string;

  @Column({ nullable: true })
  tax_id: string;

  @Column({ nullable: true })
  license_number: string;

  @Column({ nullable: true })
  contact_email: string;

  @Column({ nullable: true })
  contact_phone: string;

  @Column({ nullable: true, type: 'text' })
  address: string;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ProviderStatus, default: ProviderStatus.PENDING })
  status: ProviderStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  total_reviews: number;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => User, (user) => user.provider)
  users: User[];

  @OneToMany(() => Boat, (boat) => boat.provider)
  boats: Boat[];

  @OneToMany(() => Product, (product) => product.provider)
  products: Product[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
