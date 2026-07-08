import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from '../../modules/auth/entities/user.entity';
import { Employee } from '../../modules/employee/entities/employee.entity';

export interface JwtPayload {
  sub: string;
  id: string;
  email: string;
  role: string;
  type: 'access' | 'employee';
  employee_id?: string;
  branch_id?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET no configurado en variables de entorno');
        }
        return secret;
      })(),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (payload.type === 'employee') {
      const employee = await this.employeeRepository.findOne({
        where: {
          id: payload.employee_id ?? payload.id,
          active: true,
          deleted_at: IsNull(),
        },
        select: ['id'],
      });
      if (!employee) {
        throw new UnauthorizedException('Token inválido o empleado no activo');
      }
      return payload;
    }
    const user = await this.userRepository.findOne({
      where: { id: payload.id, active: true, deleted_at: IsNull() },
      select: ['id'],
    });
    if (!user) {
      throw new UnauthorizedException('Token inválido o usuario no activo');
    }
    return payload;
  }
}
