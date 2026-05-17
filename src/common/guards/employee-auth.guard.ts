import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_ANON_KEY } from './allow-anon.decorator';

@Injectable()
export class EmployeeAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowAnonymous = this.reflector.getAllAndOverride<boolean>(ALLOW_ANON_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowAnonymous) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('No autenticado');
    }

    if (user.type !== 'employee') {
      throw new UnauthorizedException('Se requiere token de empleado');
    }

    if (!user.employee_id) {
      throw new UnauthorizedException('Token de empleado inválido');
    }

    return true;
  }
}