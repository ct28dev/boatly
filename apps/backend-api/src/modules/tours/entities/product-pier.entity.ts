import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { Pier } from '../../piers/entities/pier.entity';

export enum PierType {
  DEPARTURE = 'departure',
  ARRIVAL = 'arrival',
  STOP = 'stop',
}

@Entity('product_piers')
export class ProductPier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  product_id: string;

  @Column({ name: 'pier_id' })
  pier_id: string;

  @Column({ type: 'enum', enum: PierType })
  type: PierType;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ nullable: true })
  departure_time: string;

  @Column({ nullable: true })
  arrival_time: string;

  @ManyToOne(() => Product, (product) => product.piers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Pier, (pier) => pier.product_piers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pier_id' })
  pier: Pier;
}
