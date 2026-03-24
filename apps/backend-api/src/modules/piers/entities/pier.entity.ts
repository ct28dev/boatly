import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Province } from './province.entity';
import { ProductPier } from '../../tours/entities/product-pier.entity';

@Entity('piers')
export class Pier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  name_en: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ nullable: true })
  image_url: string;

  @Column({ type: 'simple-array', nullable: true })
  facilities: string[];

  @Column({ nullable: true })
  contact_phone: string;

  @Column({ nullable: true })
  operating_hours: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ name: 'province_id', nullable: true })
  province_id: string;

  @ManyToOne(() => Province, (province) => province.piers)
  @JoinColumn({ name: 'province_id' })
  province: Province;

  @OneToMany(() => ProductPier, (productPier) => productPier.pier)
  product_piers: ProductPier[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
