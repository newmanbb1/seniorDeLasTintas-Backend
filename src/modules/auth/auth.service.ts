import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserRole } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { EmployeePinService } from '../../common/services/employee-pin.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RegisterSecretariaDto } from './dto/register-secretaria.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { LoginPinDto } from './dto/login-pin.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  JwtPayload,
  JwtRefreshPayload,
} from '../../common/strategies/jwt-refresh.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly employeePinService: EmployeePinService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getAccessTokenExpiry(): string {
    return (
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m'
    );
  }

  private getRefreshTokenExpiryString(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '10h';
  }

  private getRefreshTokenExpiry(): Date {
    return new Date(Date.now() + this.parseExpiresInMs(this.getRefreshTokenExpiryString()));
  }

  private parseExpiresInMs(value: string): number {
    const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());
    if (!match) {
      return 10 * 60 * 60 * 1000;
    }
    const amount = parseInt(match[1], 10);
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return amount * multipliers[match[2]];
  }

  async register(dto: RegisterAdminDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: Partial<User>;
  }> {
    const existingAdmin = await this.userRepository.findOne({
      where: { role: UserRole.ADMIN, deleted_at: IsNull() },
    });
    if (existingAdmin) {
      throw new ForbiddenException('Ya existe un administrador. No se permite otro registro.');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email, deleted_at: IsNull() },
    });
    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      full_name: dto.full_name,
      role: UserRole.ADMIN,
      active: true,
      created_by: this.configService.get<string>('SYSTEM_AUDIT_USER_ID'),
    });
    await this.userRepository.save(user);

    return this.generateTokens(user);
  }

  async registerSecretaria(
    dto: RegisterSecretariaDto,
    adminUserId: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: Partial<User>;
  }> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email, deleted_at: IsNull() },
    });
    if (existingUser) {
      throw new BadRequestException('Solicitud inválida');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      full_name: dto.full_name,
      role: UserRole.SECRETARIA,
      branch_id: dto.branch_id,
      active: true,
      created_by: adminUserId,
    });
    await this.userRepository.save(user);

    return this.generateTokens(user);
  }

  async login(dto: LoginAdminDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: Partial<User>;
  }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email, deleted_at: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.active) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.generateTokens(user);
  }

  async loginPin(dto: LoginPinDto, clientIp?: string): Promise<{
    access_token: string;
    employee_id: string;
    employee_name: string;
    branch_name: string;
  }> {
    const matchedEmployee = await this.employeePinService.loginWithPin(
      dto.pin,
      clientIp,
    );

    const payload: JwtPayload = {
      sub: matchedEmployee.id,
      id: matchedEmployee.id,
      email: `employee-${matchedEmployee.id}`,
      role: 'employee',
      type: 'employee',
      employee_id: matchedEmployee.id,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '8h',
    });

    return {
      access_token,
      employee_id: matchedEmployee.id,
      employee_name: matchedEmployee.full_name,
      branch_name: matchedEmployee.branch?.name || 'Sin sucursal',
    };
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      if (!refreshSecret) {
        throw new Error('JWT_REFRESH_SECRET no configurado en variables de entorno');
      }
      const payload = this.jwtService.verify<JwtRefreshPayload>(refreshToken, {
        secret: refreshSecret,
      });

      if (payload.type !== 'refresh' || !payload.jti) {
        throw new UnauthorizedException('Token inválido');
      }

      const storedToken = await this.refreshTokenRepository.findOne({
        where: { user_id: payload.sub, jti: payload.jti, revoked: false },
        relations: ['user'],
      });

      if (!storedToken) {
        throw new UnauthorizedException('Refresh token expirado o revocado');
      }

      const isTokenValid = await bcrypt.compare(refreshToken, storedToken.token);
      if (!isTokenValid) {
        await this.refreshTokenRepository.update(
          { user_id: payload.sub, revoked: false },
          { revoked: true },
        );
        throw new UnauthorizedException('Refresh token inválido');
      }

      if (storedToken.expires_at < new Date()) {
        throw new UnauthorizedException('Refresh token expirado');
      }

      const user = storedToken.user;
      if (!user || !user.active) {
        throw new ForbiddenException('Usuario inactivo o no encontrado');
      }

      await this.revokeToken(storedToken.id);

      return this.generateTokens(user);
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.refreshTokenRepository.update(
      { user_id: userId, revoked: false },
      { revoked: true },
    );
    return { message: 'Sesión cerrada correctamente' };
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deleted_at: IsNull() },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async updateUser(
    id: string,
    dto: UpdateUserDto,
    userId: string,
  ): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.active !== undefined) user.active = dto.active;
    user.updated_by = userId;

    await this.userRepository.save(user);
    return user;
  }

  private async generateTokens(user: User): Promise<{
    access_token: string;
    refresh_token: string;
    user: Partial<User>;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
      branch_id: user.branch_id || undefined,
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
      jti: crypto.randomUUID(),
      branch_id: user.branch_id || undefined,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: this.getAccessTokenExpiry() as any,
    });

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refresh_token = this.jwtService.sign(refreshPayload, {
      secret: refreshSecret,
      expiresIn: this.getRefreshTokenExpiryString() as any,
    });

    const hashedRefreshToken = await bcrypt.hash(refresh_token, 12);
    const expiresAt = this.getRefreshTokenExpiry();

    const refreshTokenEntity = this.refreshTokenRepository.create({
      user_id: user.id,
      token: hashedRefreshToken,
      jti: refreshPayload.jti,
      expires_at: expiresAt,
      revoked: false,
      created_by: user.id,
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      access_token,
      refresh_token,
      user,
    };
  }

  private async revokeToken(tokenId: string): Promise<void> {
    await this.refreshTokenRepository.update(tokenId, { revoked: true });
  }

  async findAllSecretarias(
    limit: number = 10,
    offset: number = 0,
    branch_id?: string,
    active?: boolean,
  ): Promise<{
    data: User[];
    meta: { total: number; limit: number; offset: number };
  }> {
    const where: any = {
      role: UserRole.SECRETARIA,
      deleted_at: IsNull(),
    };

    if (branch_id) {
      where.branch_id = branch_id;
    }
    if (active !== undefined) {
      where.active = active;
    }

    const [data, total] = await this.userRepository.findAndCount({
      where,
      relations: ['branch'],
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        active: true,
        branch_id: true,
        created_at: true,
        branch: {
          id: true,
          name: true,
        },
      },
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return { data, meta: { total, limit, offset } };
  }
}
