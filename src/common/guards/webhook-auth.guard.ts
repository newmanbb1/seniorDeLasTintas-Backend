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
    if (headerSecret !== expectedSecret) {
      throw new UnauthorizedException('x-webhook-secret inválido');
    }
    return true;
  }
}
