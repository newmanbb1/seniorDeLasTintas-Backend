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
import * as ipaddr from 'ipaddr.js';
import { User, UserRole } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Employee } from '../employee/entities/employee.entity';
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
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getAccessTokenExpiry(): string {
    return (
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m'
    );
  }

  private getRefreshTokenExpiry(): Date {
    const days =
      this.configService.get<number>('JWT_REFRESH_DAYS') ?? 7;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
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

    const hashedPassword = await bcrypt.hash(dto.password, 10);

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
      throw new BadRequestException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

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
      throw new ForbiddenException('Usuario inactivo');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.generateTokens(user);
  }

  private validateIpAccess(clientIp: string): void {
    const allowedIps = this.configService.get<string>('ALLOWED_IPS', '');
    if (!allowedIps || allowedIps.trim() === '') {
      return;
    }

    const addr = ipaddr.parse(clientIp);
    const ranges = allowedIps.split(',').map((r) => r.trim()).filter(Boolean);

    const isAllowed = ranges.some((cidr) => {
      try {
        const range = ipaddr.parseCIDR(cidr);
        return addr.match(range);
      } catch {
        return false;
      }
    });

    if (!isAllowed) {
      throw new ForbiddenException(
        'Acceso permitido solo desde la red WiFi de la empresa',
      );
    }
  }

  async loginPin(dto: LoginPinDto, clientIp?: string): Promise<{
    access_token: string;
    employee_id: string;
    employee_name: string;
    branch_name: string;
  }> {
    if (clientIp) {
      this.validateIpAccess(clientIp);
    }

    const employees = await this.employeeRepository.find({
      where: { active: true, deleted_at: IsNull() },
      relations: ['branch'],
    });

    let matchedEmployee: Employee | null = null;
    for (const emp of employees) {
      const isMatch = await bcrypt.compare(dto.pin, emp.access_pin);
      if (isMatch) {
        matchedEmployee = emp;
        break;
      }
    }

    const employee = matchedEmployee;
    if (!employee) {
      throw new UnauthorizedException('PIN inválido o empleado inactivo');
    }

    const payload: JwtPayload = {
      sub: employee.id,
      id: employee.id,
      email: `employee-${employee.id}`,
      role: 'employee',
      type: 'employee',
      employee_id: employee.id,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      employee_id: employee.id,
      employee_name: employee.full_name,
      branch_name: employee.branch?.name || 'Sin sucursal',
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
    const { password, ...result } = user;
    return result;
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
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado`);
    }

    if (dto.active !== undefined) user.active = dto.active;
    user.updated_by = userId;

    await this.userRepository.save(user);
    const { password, ...result } = user;
    return result;
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
      jti: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      branch_id: user.branch_id || undefined,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: this.getAccessTokenExpiry() as any,
    });

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refresh_token = this.jwtService.sign(refreshPayload, {
      secret: refreshSecret,
      expiresIn:
        (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as any,
    });

    const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
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

    const { password, ...userWithoutPassword } = user;
    return {
      access_token,
      refresh_token,
      user: userWithoutPassword,
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
