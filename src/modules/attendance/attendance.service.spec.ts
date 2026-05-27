import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AttendanceService, UserContext } from './attendance.service';
import {
  Attendance,
  AttendanceEntryStatus,
} from './entities/attendance.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Branch } from '../branch/entities/branch.entity';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

const createMockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
});

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceRepository: ReturnType<typeof createMockRepository>;
  let employeeRepository: ReturnType<typeof createMockRepository>;
  let branchRepository: Record<string, never>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  const mockDate = new Date('2025-01-15T08:30:00Z');

  const mockEmployee = {
    id: 'emp-1',
    full_name: 'Juan Pérez',
    access_pin: '1234',
    position: 'Cajero',
    active: true,
    branch: { id: 'branch-1', name: 'Sucursal Central' } as any,
    attendances: [],
    created_at: mockDate,
    created_by: 'system',
    updated_at: mockDate,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  } as unknown as Employee;

  const mockAttendance = {
    id: 'att-1',
    employee: mockEmployee,
    register_date: '2025-01-15',
    check_in: mockDate,
    check_out: null,
    check_in_status: AttendanceEntryStatus.Punctual,
    hours_worked: '0',
    created_at: mockDate,
    created_by: 'system',
    updated_at: mockDate,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  } as unknown as Attendance;

  beforeEach(async () => {
    attendanceRepository = createMockRepository();
    employeeRepository = createMockRepository();
    branchRepository = {};

    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          SYSTEM_AUDIT_USER_ID: '00000000-0000-4000-8000-000000000001',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: attendanceRepository,
        },
        { provide: getRepositoryToken(Employee), useValue: employeeRepository },
        { provide: getRepositoryToken(Branch), useValue: branchRepository },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('checkIn', () => {
    it('debe registrar entrada exitosamente', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      attendanceRepository.findOne.mockResolvedValue(null);
      attendanceRepository.create.mockReturnValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      const result = await service.checkIn({
        employee_id: 'emp-1',
        pin: '1234',
      });

      expect(result.check_in_status).toBe(AttendanceEntryStatus.Punctual);
      expect(result.check_out).toBeNull();
    });

    it('debe lanzar error si el empleado no existe', async () => {
      employeeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.checkIn({ employee_id: 'invalid', pin: '1234' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar error si el empleado está inactivo', async () => {
      employeeRepository.findOne.mockResolvedValue({
        ...mockEmployee,
        active: false,
      });

      await expect(
        service.checkIn({ employee_id: 'emp-1', pin: '1234' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar error si el PIN es incorrecto', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);

      await expect(
        service.checkIn({ employee_id: 'emp-1', pin: '0000' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar error si ya existe registro de entrada hoy', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);

      await expect(
        service.checkIn({ employee_id: 'emp-1', pin: '1234' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('checkOut', () => {
    const completedAttendance: Attendance = {
      ...mockAttendance,
      check_in: new Date('2025-01-15T08:00:00Z'),
    };

    it('debe registrar salida exitosamente', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      attendanceRepository.findOne.mockResolvedValue(completedAttendance);
      attendanceRepository.save.mockResolvedValue({
        ...completedAttendance,
        check_out: new Date('2025-01-15T17:00:00Z'),
        hours_worked: '9.00',
      });

      const result = await service.checkOut({
        employee_id: 'emp-1',
        pin: '1234',
      });

      expect(result.check_out).not.toBeNull();
      expect(typeof result.hours_worked).toBe('string');
    });

    it('debe lanzar error si no hay registro de entrada hoy', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      attendanceRepository.findOne.mockResolvedValue(null);

      await expect(
        service.checkOut({ employee_id: 'emp-1', pin: '1234' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar error si ya registró salida', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      attendanceRepository.findOne.mockResolvedValue({
        ...completedAttendance,
        check_out: new Date('2025-01-15T17:00:00Z'),
      });

      await expect(
        service.checkOut({ employee_id: 'emp-1', pin: '1234' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('debe retornar lista paginada de asistencias', async () => {
      attendanceRepository.findAndCount.mockResolvedValue([
        [mockAttendance],
        1,
      ]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('debe filtrar por sucursal para secretaria', async () => {
      const userContext: UserContext = {
        userId: 'user-1',
        role: 'secretaria',
        branch_id: 'branch-1',
      };
      attendanceRepository.findAndCount.mockResolvedValue([
        [mockAttendance],
        1,
      ]);

      const result = await service.findAll({}, userContext);

      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('debe retornar una asistencia por ID', async () => {
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);

      const result = await service.findOne('att-1');

      expect(result.id).toBe('att-1');
    });

    it('debe lanzar error si no existe', async () => {
      attendanceRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('debe actualizar una asistencia', async () => {
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue({
        ...mockAttendance,
        hours_worked: '8.00',
      });

      const result = await service.update(
        'att-1',
        { hours_worked: '8.00' } as any,
        'user-1',
      );

      expect(result.hours_worked).toBe('8.00');
    });

    it('debe impedir actualización por secretaria', async () => {
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      const userContext: UserContext = {
        userId: 'user-1',
        role: 'secretaria',
        branch_id: 'branch-1',
      };

      await expect(
        service.update('att-1', {} as any, 'user-1', userContext),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('debe eliminar (soft delete) una asistencia', async () => {
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      attendanceRepository.update.mockResolvedValue({} as any);

      const result = await service.remove('att-1', 'user-1');

      expect(result.deleted).toBe(true);
    });
  });

  describe('getReportByEmployee', () => {
    it('debe generar reporte de empleado', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      attendanceRepository.find.mockResolvedValue([mockAttendance]);

      const result = await service.getReportByEmployee('emp-1');

      expect(result.summary.employee_name).toBe('Juan Pérez');
      expect(result.summary.total_days).toBe(1);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
