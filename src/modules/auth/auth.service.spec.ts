import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

import { User, UserRole } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Employee } from '../employee/entities/employee.entity';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';

const createMockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  update: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: ReturnType<typeof createMockRepository>;
  let refreshTokenRepository: ReturnType<typeof createMockRepository>;
  let employeeRepository: ReturnType<typeof createMockRepository>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  const mockUser = {
    id: 'user-1',
    email: 'admin@test.com',
    password: 'hashed-password',
    full_name: 'Admin Test',
    role: UserRole.ADMIN,
    active: true,
    branch_id: null,
    branch: null,
    created_at: new Date(),
    created_by: 'system',
    updated_at: new Date(),
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  } as unknown as User;

  const mockEmployee = {
    id: 'emp-1',
    full_name: 'Employee Test',
    access_pin: '1234',
    position: 'Cajero',
    active: true,
    branch: { id: 'branch-1', name: 'Branch 1' } as any,
    attendances: [],
    created_at: new Date(),
    created_by: 'system',
    updated_at: new Date(),
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  } as unknown as Employee;

  beforeEach(async () => {
    userRepository = createMockRepository();
    refreshTokenRepository = createMockRepository();
    employeeRepository = createMockRepository();

    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_DAYS: 7,
          JWT_SECRET: 'test-secret',
          SYSTEM_AUDIT_USER_ID: '00000000-0000-4000-8000-000000000001',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepository,
        },
        { provide: getRepositoryToken(Employee), useValue: employeeRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('debe registrar un admin correctamente', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.register({
        email: 'admin@test.com',
        password: 'password123',
        full_name: 'Admin Test',
      });

      expect(result.access_token).toBe('access-token');
      expect(result.refresh_token).toBe('refresh-token');
      expect(result.user.email).toBe('admin@test.com');
    });

    it('debe lanzar error si el email ya existe', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'admin@test.com',
          password: 'password123',
          full_name: 'Admin Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('debe loguear admin con credenciales válidas', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      refreshTokenRepository.create.mockReturnValue({} as any);
      refreshTokenRepository.save.mockResolvedValue({} as any);

      const result = await service.login({
        email: 'admin@test.com',
        password: 'password123',
      });

      expect(result.access_token).toBe('access-token');
    });

    it('debe lanzar error con credenciales inválidas', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar error si el usuario está inactivo', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, active: false });

      await expect(
        service.login({ email: 'admin@test.com', password: 'password123' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('loginPin', () => {
    it('debe loguear empleado con PIN correcto', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      jwtService.sign.mockReturnValue('employee-access-token');

      const result = await service.loginPin({ pin: '1234' });

      expect(result.access_token).toBe('employee-access-token');
      expect(result.employee_name).toBe('Employee Test');
    });

    it('debe lanzar error con PIN incorrecto', async () => {
      employeeRepository.findOne.mockResolvedValue(null);

      await expect(service.loginPin({ pin: '0000' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('debe renovar tokens correctamente', async () => {
      const payload = { sub: 'user-1', type: 'refresh' };
      jwtService.verify.mockReturnValue(payload);
      refreshTokenRepository.findOne.mockResolvedValue({
        id: 'rt-1',
        user_id: 'user-1',
        token: 'hashed-refresh',
        expires_at: new Date(Date.now() + 86400000),
        revoked: false,
        user: mockUser,
        created_at: new Date(),
        created_by: 'user-1',
        updated_at: new Date(),
        updated_by: null,
        deleted_at: null,
        deleted_by: null,
      });
      jwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');
      refreshTokenRepository.update.mockResolvedValue({} as any);
      refreshTokenRepository.create.mockReturnValue({} as any);
      refreshTokenRepository.save.mockResolvedValue({} as any);

      const result = await service.refresh('valid-refresh-token');

      expect(result.access_token).toBe('new-access-token');
    });

    it('debe lanzar error con token inválido', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('debe revocar todos los refresh tokens del usuario', async () => {
      refreshTokenRepository.update.mockResolvedValue({} as any);

      const result = await service.logout('user-1');

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { user_id: 'user-1', revoked: false },
        { revoked: true },
      );
      expect(result.message).toBe('Sesión cerrada correctamente');
    });
  });

  describe('getProfile', () => {
    it('debe retornar perfil sin password', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-1');

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('admin@test.com');
    });

    it('debe lanzar error si no encuentra el usuario', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
