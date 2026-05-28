import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    console.log('JWT_SECRET in strategy =', process.env.JWT_SECRET || 'SECRET_KEY_MAC_DINH');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'SECRET_KEY_MAC_DINH',
    });
  }

  async validate(payload: any) {
    console.log('JWT validate payload =', payload);

    return {
      id: payload.sub,
      roles: Array.isArray(payload.roles) ? payload.roles : [],
    };
  }
}