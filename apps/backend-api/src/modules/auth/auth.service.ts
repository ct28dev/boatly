import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserAuth, AuthProvider } from './entities/user-auth.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserAuth)
    private authRepository: Repository<UserAuth>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.authRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create({
      first_name: dto.first_name,
      last_name: dto.last_name,
      email: dto.email,
      phone: dto.phone,
      role: UserRole.USER,
    });
    const savedUser = await this.userRepository.save(user);

    const auth = this.authRepository.create({
      email: dto.email,
      password_hash: passwordHash,
      provider: AuthProvider.LOCAL,
      user_id: savedUser.id,
      is_active: true,
    });
    const savedAuth = await this.authRepository.save(auth);

    const token = this.generateToken(savedAuth, savedUser);

    return {
      access_token: token,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        first_name: savedUser.first_name,
        last_name: savedUser.last_name,
        role: savedUser.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  async validateUser(email: string, password: string) {
    const auth = await this.authRepository.findOne({
      where: { email, provider: AuthProvider.LOCAL },
      relations: ['user'],
    });

    if (!auth || !auth.password_hash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, auth.password_hash);
    if (!isPasswordValid) {
      return null;
    }

    if (!auth.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    auth.last_login_at = new Date();
    await this.authRepository.save(auth);

    const token = this.generateToken(auth, auth.user);

    return {
      access_token: token,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        first_name: auth.user.first_name,
        last_name: auth.user.last_name,
        role: auth.user.role,
        avatar_url: auth.user.avatar_url,
      },
    };
  }

  async socialLogin(provider: AuthProvider, profile: { id: string; email: string; firstName: string; lastName: string; avatar?: string }) {
    let auth = await this.authRepository.findOne({
      where: { provider, provider_id: profile.id },
      relations: ['user'],
    });

    if (!auth) {
      auth = await this.authRepository.findOne({
        where: { email: profile.email },
        relations: ['user'],
      });

      if (auth) {
        auth.provider = provider;
        auth.provider_id = profile.id;
        await this.authRepository.save(auth);
      } else {
        const user = this.userRepository.create({
          first_name: profile.firstName,
          last_name: profile.lastName,
          email: profile.email,
          avatar_url: profile.avatar,
          role: UserRole.USER,
        });
        const savedUser = await this.userRepository.save(user);

        auth = this.authRepository.create({
          email: profile.email,
          provider,
          provider_id: profile.id,
          user_id: savedUser.id,
          is_active: true,
          email_verified: true,
        });
        auth = await this.authRepository.save(auth);
        auth.user = savedUser;
      }
    }

    auth.last_login_at = new Date();
    await this.authRepository.save(auth);

    const token = this.generateToken(auth, auth.user);

    return {
      access_token: token,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        first_name: auth.user.first_name,
        last_name: auth.user.last_name,
        role: auth.user.role,
        avatar_url: auth.user.avatar_url,
      },
    };
  }

  async getProfile(authId: string) {
    const auth = await this.authRepository.findOne({
      where: { id: authId },
      relations: ['user'],
    });

    if (!auth) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: auth.user.id,
      email: auth.user.email,
      first_name: auth.user.first_name,
      last_name: auth.user.last_name,
      phone: auth.user.phone,
      avatar_url: auth.user.avatar_url,
      role: auth.user.role,
      provider: auth.provider,
      email_verified: auth.email_verified,
      created_at: auth.user.created_at,
    };
  }

  async logout(authId: string) {
    await this.authRepository.update(authId, { refresh_token: null });
    return { message: 'Logged out successfully' };
  }

  private generateToken(auth: UserAuth, user: User): string {
    const payload = {
      sub: auth.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
