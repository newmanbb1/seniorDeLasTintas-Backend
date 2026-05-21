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
import { User, UserRole } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Employee } from '../employee/entities/employee.entity';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RegisterSecretariaDto } from './dto/register-secretaria.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { LoginPinDto } from './dto/login-pin.dto';
import { JwtPayload, JwtRefreshPayload } from '../../common/strategies/jwt-refresh.strategy';

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
    return this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
  }

  private getRefreshTokenExpiry(): Date {
    const days = this.configService.get<number>('JWT_REFRESH_DAYS') || 7;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  async register(dto: RegisterAdminDto): Promise<{ access_token: string; refresh_token: string; user: Partial<User> }> {
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
      created_by:this.configService.get<string>('SYSTEM_AUDIT_USER_ID'),
    });
    await this.userRepository.save(user);

    return this.generateTokens(user);
  }

  async registerSecretaria(dto: RegisterSecretariaDto): Promise<{ access_token: string; refresh_token: string; user: Partial<User> }> {
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
      created_by: dto.email,
    });
    await this.userRepository.save(user);

    return this.generateTokens(user);
  }

  async login(dto: LoginAdminDto): Promise<{ access_token: string; refresh_token: string; user: Partial<User> }> {
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

  async loginPin(dto: LoginPinDto): Promise<{ access_token: string; employee_id: string; employee_name: string; branch_name: string }> {
    const employee = await this.employeeRepository.findOne({
      where: { access_pin: dto.pin, active: true, deleted_at: IsNull() },
      relations: ['branch'],
    });

    if (!employee) {
      throw new UnauthorizedException('PIN inválido o empleado inactivo');
    }

    const payload: JwtPayload = {
      sub: employee.id,
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

  async refresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const payload = this.jwtService.verify<JwtRefreshPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET') || 'default-secret-key',
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token inválido');
      }

      const storedToken = await this.refreshTokenRepository.findOne({
        where: { user_id: payload.sub, token: refreshToken, revoked: false },
        relations: ['user'],
      });

      if (!storedToken || storedToken.expires_at < new Date()) {
        throw new UnauthorizedException('Refresh token expirado oRevocado');
      }

      const user = storedToken.user;
      if (!user || !user.active) {
        throw new ForbiddenException('Usuario inactivo o no encontrado');
      }

      await this.revokeToken(storedToken.id);

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
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

  private async generateTokens(user: User): Promise<{ access_token: string; refresh_token: string; user: Partial<User> }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
      branch_id: user.branch_id || undefined,
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
      branch_id: user.branch_id || undefined,
    };

    const access_token = this.jwtService.sign(payload);

    const refresh_token = this.jwtService.sign(refreshPayload);

    const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
    const expiresAt = this.getRefreshTokenExpiry();

    const refreshTokenEntity = this.refreshTokenRepository.create({
      user_id: user.id,
      token: hashedRefreshToken,
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
  ): Promise<{ data: User[]; meta: { total: number; limit: number; offset: number } }> {
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