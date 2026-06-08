import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'SECRET_KEY_MAC_DINH',
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      isAdmin: payload.isAdmin ?? false,
      roles: Array.isArray(payload.roles) ? payload.roles : [],
      permissions: payload.permissions ?? {},
    };
  }
}