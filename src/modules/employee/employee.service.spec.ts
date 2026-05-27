import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmployeeService } from './employee.service';
import { Employee } from './entities/employee.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

const createMockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
});

describe('EmployeeService', () => {
  let service: EmployeeService;
  let employeeRepository: ReturnType<typeof createMockRepository>;
  let branchRepository: ReturnType<typeof createMockRepository>;
  let attendanceRepository: ReturnType<typeof createMockRepository>;

  const mockBranch = {
    id: 'branch-1',
    name: 'Sucursal Central',
    address: 'Av. Principal 123',
    opening_hours: '9:00-18:00',
    location_link: 'https://maps.google.com/...',
    inventories: [],
    employees: [],
    outgoing_transfers: [],
    incoming_transfers: [],
    created_at: new Date(),
    created_by: 'system',
    updated_at: new Date(),
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  } as unknown as Branch;

  const mockEmployee = {
    id: 'emp-1',
    full_name: 'Juan Pérez',
    access_pin: '1234',
    position: 'Cajero',
    active: true,
    branch: mockBranch,
    attendances: [],
    created_at: new Date(),
    created_by: 'user-1',
    updated_at: new Date(),
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  } as unknown as Employee;

  beforeEach(async () => {
    employeeRepository = createMockRepository();
    branchRepository = createMockRepository();
    attendanceRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: getRepositoryToken(Employee), useValue: employeeRepository },
        { provide: getRepositoryToken(Branch), useValue: branchRepository },
        {
          provide: getRepositoryToken(Attendance),
          useValue: attendanceRepository,
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  describe('create', () => {
    it('debe crear empleado exitosamente', async () => {
      employeeRepository.findOne.mockResolvedValue(null);
      branchRepository.findOne.mockResolvedValue(mockBranch);
      employeeRepository.create.mockReturnValue(mockEmployee);
      employeeRepository.save.mockResolvedValue(mockEmployee);

      const result = await service.create(
        {
          full_name: 'Juan Pérez',
          access_pin: '1234',
          position: 'Cajero',
          branch_id: 'branch-1',
        },
        'user-1',
      );

      expect(result.full_name).toBe('Juan Pérez');
    });

    it('debe lanzar error si el nombre ya existe', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);

      await expect(
        service.create(
          {
            full_name: 'Juan Pérez',
            access_pin: '1234',
            position: 'Cajero',
            branch_id: 'branch-1',
          },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar error si branch no existe', async () => {
      employeeRepository.findOne.mockResolvedValue(null);
      branchRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          {
            full_name: 'Juan Pérez',
            access_pin: '1234',
            position: 'Cajero',
            branch_id: 'invalid',
          },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('debe retornar lista paginada', async () => {
      employeeRepository.findAndCount.mockResolvedValue([[mockEmployee], 1]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('debe retornar empleado por ID', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);

      const result = await service.findOne('emp-1');

      expect(result.id).toBe('emp-1');
    });

    it('debe lanzar error si no existe', async () => {
      employeeRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('debe actualizar empleado', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      employeeRepository.save.mockResolvedValue({
        ...mockEmployee,
        position: 'Supervisor',
      });

      const result = await service.update(
        'emp-1',
        { position: 'Supervisor' },
        'user-1',
      );

      expect(result.position).toBe('Supervisor');
    });
  });

  describe('toggleActive', () => {
    it('debe desactivar empleado activo', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      employeeRepository.save.mockResolvedValue({
        ...mockEmployee,
        active: false,
      });

      const result = await service.toggleActive('emp-1', 'user-1');

      expect(result.active).toBe(false);
    });

    it('debe activar empleado inactivo', async () => {
      employeeRepository.findOne.mockResolvedValue({
        ...mockEmployee,
        active: false,
      });
      employeeRepository.save.mockResolvedValue({
        ...mockEmployee,
        active: true,
      });

      const result = await service.toggleActive('emp-1', 'user-1');

      expect(result.active).toBe(true);
    });
  });

  describe('remove', () => {
    it('debe eliminar empleado si no tiene asistencias', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      attendanceRepository.count.mockResolvedValue(0);
      employeeRepository.update.mockResolvedValue({} as any);

      const result = await service.remove('emp-1', 'user-1');

      expect(result.deleted).toBe(true);
    });

    it('debe lanzar error si tiene asistencias', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      attendanceRepository.count.mockResolvedValue(10);

      await expect(service.remove('emp-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
