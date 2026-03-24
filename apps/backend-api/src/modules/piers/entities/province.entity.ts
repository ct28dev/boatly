import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Pier } from './pier.entity';

@Entity('provinces')
export class Province {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  name_en: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  image_url: string;

  @OneToMany(() => Pier, (pier) => pier.province)
  piers: Pier[];
}
