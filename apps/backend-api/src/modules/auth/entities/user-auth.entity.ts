import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

@Entity('user_auth')
export class UserAuth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password_hash: string;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  provider: AuthProvider;

  @Column({ nullable: true })
  provider_id: string;

  @Column({ nullable: true })
  refresh_token: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ nullable: true })
  email_verification_token: string;

  @Column({ nullable: true })
  password_reset_token: string;

  @Column({ nullable: true, type: 'timestamp' })
  password_reset_expires: Date;

  @Column({ nullable: true, type: 'timestamp' })
  last_login_at: Date;

  @Column({ name: 'user_id', nullable: true })
  user_id: string;

  @OneToOne(() => User, (user) => user.auth, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
