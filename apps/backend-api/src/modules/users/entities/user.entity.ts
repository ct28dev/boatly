import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserAuth } from '../../auth/entities/user-auth.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Favorite } from './favorite.entity';
import { Notification } from './notification.entity';
import { Provider } from '../../providers/entities/provider.entity';

export enum UserRole {
  USER = 'user',
  PROVIDER = 'provider',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: true })
  date_of_birth: Date;

  @Column({ nullable: true })
  id_card_number: string;

  @Column({ default: 'th' })
  language: string;

  @Column({ default: true })
  is_active: boolean;

  @OneToOne(() => UserAuth, (auth) => auth.user)
  auth: UserAuth;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @ManyToOne(() => Provider, (provider) => provider.users, { nullable: true })
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @Column({ nullable: true })
  provider_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
