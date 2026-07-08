import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt.strategy';

export type { JwtPayload };
export interface JwtRefreshPayload {
  sub: string;
  id: string;
  email: string;
  role: string;
  type: 'refresh';
  jti?: string;
  branch_id?: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const secret = configService.get<string>('JWT_REFRESH_SECRET');
        if (!secret) {
          throw new Error('JWT_REFRESH_SECRET no configurado en variables de entorno');
        }
        return secret;
      })(),
    });
  }

  async validate(
    payload: JwtRefreshPayload,
  ): Promise<JwtRefreshPayload | null> {
    if (payload.type !== 'refresh') {
      return null;
    }
    return payload;
  }
}
