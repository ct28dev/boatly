import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAuth } from '../entities/user-auth.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(UserAuth)
    private authRepository: Repository<UserAuth>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const auth = await this.authRepository.findOne({
      where: { id: payload.sub },
      relations: ['user'],
    });

    if (!auth || !auth.is_active) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    return {
      id: auth.user?.id,
      auth_id: auth.id,
      email: auth.email,
      role: auth.user?.role,
      first_name: auth.user?.first_name,
      last_name: auth.user?.last_name,
    };
  }
}
