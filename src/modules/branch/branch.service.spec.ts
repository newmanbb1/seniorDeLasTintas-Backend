import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BranchService, UserContext } from './branch.service';
import { Branch } from './entities/branch.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

// ─── Factory para crear un mock de repositorio limpio ────────────────────────
const createMockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
});

describe('BranchService', () => {
  let service: BranchService;
  let branchRepository: ReturnType<typeof createMockRepository>;
  let employeeRepository: ReturnType<typeof createMockRepository>;
  let inventoryRepository: ReturnType<typeof createMockRepository>;

  // ─── Mock de entidad Branch completo ───────────────────────────────────────
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
    created_at: new Date('2024-01-01'),
    created_by: 'user-1',
    updated_at: new Date('2024-01-01'),
    updated_by: null,
    deleted_at: null,
  } as unknown as Branch;

  // ─── Mock de UserContext ────────────────────────────────────────────────────
  const mockAdminContext: UserContext = {
    userId: 'user-1',
    role: 'admin' as any,
    branch_id: 'branch-1',
  };

  // ─── Setup del módulo de testing ────────────────────────────────────────────
  beforeEach(async () => {
    branchRepository = createMockRepository();
    employeeRepository = createMockRepository();
    inventoryRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchService,
        {
          provide: getRepositoryToken(Branch),
          useValue: branchRepository,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: employeeRepository,
        },
        {
          provide: getRepositoryToken(Inventory),
          useValue: inventoryRepository,
        },
      ],
    }).compile();

    service = module.get<BranchService>(BranchService);
  });

  // ─── Limpia los mocks después de cada test ──────────────────────────────────
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ────────────────────────────────────────────────────────────────────────────
  describe('create', () => {
    const createDto = {
      name: 'Sucursal Central',
      address: 'Av. Principal 123',
      opening_hours: '9:00-18:00',
      location_link: 'https://maps.google.com/...',
    };

    it('debe crear una sucursal exitosamente', async () => {
      branchRepository.findOne.mockResolvedValue(null);
      branchRepository.create.mockReturnValue(mockBranch);
      branchRepository.save.mockResolvedValue(mockBranch);

      const result = await service.create(createDto, 'user-1');

      expect(branchRepository.findOne).toHaveBeenCalledTimes(1);
      expect(branchRepository.create).toHaveBeenCalledTimes(1);
      expect(branchRepository.save).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('Sucursal Central');
    });

    it('debe lanzar ConflictException si el nombre ya existe', async () => {
      branchRepository.findOne.mockResolvedValue(mockBranch);

      await expect(
        service.create(
          { ...createDto, name: 'Sucursal Central', address: 'Otra dirección' },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);

      expect(branchRepository.create).not.toHaveBeenCalled();
      expect(branchRepository.save).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // FIND ALL
  // ────────────────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('debe retornar lista paginada con meta', async () => {
      branchRepository.findAndCount.mockResolvedValue([[mockBranch], 1]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(branchRepository.findAndCount).toHaveBeenCalledTimes(1);
    });

    it('debe retornar lista vacía si no hay sucursales', async () => {
      branchRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('debe filtrar por nombre correctamente', async () => {
      branchRepository.findAndCount.mockResolvedValue([[mockBranch], 1]);

      const result = await service.findAll({ name: 'Central' });

      expect(result.data).toHaveLength(1);
      expect(branchRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        }),
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // FIND ONE
  // ────────────────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('debe retornar una sucursal por ID', async () => {
      branchRepository.findOne.mockResolvedValue(mockBranch);

      const result = await service.findOne('branch-1');

      expect(result.id).toBe('branch-1');
      expect(branchRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'branch-1' }),
        }),
      );
    });

    it('debe lanzar NotFoundException si la sucursal no existe', async () => {
      branchRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe permitir acceso a admin sin restricción de branch', async () => {
      branchRepository.findOne.mockResolvedValue(mockBranch);

      const result = await service.findOne('branch-1', mockAdminContext);

      expect(result.id).toBe('branch-1');
    });

    it('debe lanzar ForbiddenException si secretaria accede a otra sucursal', async () => {
      const secretariaContext: UserContext = {
        userId: 'user-2',
        role: 'secretaria' as any,
        branch_id: 'branch-2',
      };

      branchRepository.findOne.mockResolvedValue(mockBranch);

      await expect(
        service.findOne('branch-1', secretariaContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe permitir acceso a secretaria en su propia sucursal', async () => {
      const secretariaContext: UserContext = {
        userId: 'user-2',
        role: 'secretaria' as any,
        branch_id: 'branch-1',
      };

      branchRepository.findOne.mockResolvedValue(mockBranch);

      const result = await service.findOne('branch-1', secretariaContext);

      expect(result.id).toBe('branch-1');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ────────────────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('debe actualizar una sucursal exitosamente', async () => {
      const updatedBranch = { ...mockBranch, name: 'Sucursal Norte' };

      branchRepository.findOne
        .mockResolvedValueOnce({ ...mockBranch })
        .mockResolvedValueOnce(null);

      branchRepository.save.mockResolvedValue(updatedBranch);

      const result = await service.update(
        'branch-1',
        { name: 'Sucursal Norte' },
        'user-1',
      );

      expect(result.name).toBe('Sucursal Norte');
      expect(branchRepository.save).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar NotFoundException si la sucursal no existe', async () => {
      branchRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('id-invalido', { name: 'Nuevo nombre' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si el nuevo nombre ya está en uso', async () => {
      const otraSucursal = { ...mockBranch, id: 'branch-2', name: 'Sucursal Norte' };

      branchRepository.findOne
        .mockResolvedValueOnce({ ...mockBranch })
        .mockResolvedValueOnce(otraSucursal);

      await expect(
        service.update('branch-1', { name: 'Sucursal Norte' }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // REMOVE
  // ────────────────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('debe eliminar una sucursal sin empleados ni inventario', async () => {
      branchRepository.findOne.mockResolvedValue(mockBranch);
      employeeRepository.count.mockResolvedValue(0);
      inventoryRepository.count.mockResolvedValue(0);
      branchRepository.update.mockResolvedValue({} as any);

      const result = await service.remove('branch-1', 'user-1');

      expect(result.deleted).toBe(true);
      expect(branchRepository.update).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar NotFoundException si la sucursal no existe', async () => {
      branchRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('id-invalido', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar ConflictException si la sucursal tiene empleados', async () => {
      branchRepository.findOne.mockResolvedValue(mockBranch);
      employeeRepository.count.mockResolvedValue(5);

      await expect(service.remove('branch-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );

      expect(branchRepository.update).not.toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si la sucursal tiene inventario', async () => {
      branchRepository.findOne.mockResolvedValue(mockBranch);
      employeeRepository.count.mockResolvedValue(0);
      inventoryRepository.count.mockResolvedValue(3);

      await expect(service.remove('branch-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );

      expect(branchRepository.update).not.toHaveBeenCalled();
    });
  });
});