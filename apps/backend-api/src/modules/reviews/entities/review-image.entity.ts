import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Review } from './review.entity';

@Entity('review_images')
export class ReviewImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'review_id' })
  review_id: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  thumbnail_url: string;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @ManyToOne(() => Review, (review) => review.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @CreateDateColumn()
  created_at: Date;
}
