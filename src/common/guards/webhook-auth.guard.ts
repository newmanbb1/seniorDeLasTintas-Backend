import { timingSafeEqual } from 'crypto';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class WebhookAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const headerSecret = request.headers['x-webhook-secret'] as string;
    const expectedSecret = this.configService.get<string>('WEBHOOK_SECRET');

    if (!expectedSecret) {
      throw new UnauthorizedException('WEBHOOK_SECRET no configurado en el servidor');
    }
    if (!headerSecret) {
      throw new UnauthorizedException('Falta encabezado x-webhook-secret');
    }

    const headerBuf = Buffer.from(headerSecret);
    const expectedBuf = Buffer.from(expectedSecret);
    const maxLen = Math.max(headerBuf.length, expectedBuf.length);
    const hPad = Buffer.alloc(maxLen);
    const ePad = Buffer.alloc(maxLen);
    headerBuf.copy(hPad);
    expectedBuf.copy(ePad);

    if (!timingSafeEqual(hPad, ePad)) {
      throw new UnauthorizedException('x-webhook-secret inválido');
    }
    return true;
  }
}
