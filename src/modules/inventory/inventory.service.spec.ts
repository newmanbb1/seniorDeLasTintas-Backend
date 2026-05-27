import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryService, UserContext } from './inventory.service';
import { Inventory } from './entities/inventory.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Supply } from '../supply/entities/supply.entity';
import { StockTransfer } from '../stock-transfer/entities/stock-transfer.entity';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

const createMockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
});

describe('InventoryService', () => {
  let service: InventoryService;
  let inventoryRepository: ReturnType<typeof createMockRepository> & {
    metadata: { connection: { createQueryRunner: jest.Mock } };
  };
  let branchRepository: ReturnType<typeof createMockRepository>;
  let supplyRepository: ReturnType<typeof createMockRepository>;
  let stockTransferRepository: ReturnType<typeof createMockRepository>;

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

  const mockSupply = {
    id: 'supply-1',
    code: 'TNT-001',
    name: 'Tinta Negra',
    category: 'Insumo',
    unit_of_measure: 'Litro',
    images: null,
    videos: null,
    inventories: [],
    stock_transfers: [],
    created_at: new Date(),
    created_by: 'system',
    updated_at: new Date(),
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  } as unknown as Supply;

  const mockInventory = {
    id: 'inv-1',
    branch: mockBranch,
    supply: mockSupply,
    current_quantity: 50,
    minimum_stock: 10,
    created_at: new Date(),
    created_by: 'user-1',
    updated_at: new Date(),
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  } as unknown as Inventory;

  beforeEach(async () => {
    inventoryRepository = {
      ...createMockRepository(),
      metadata: {
        connection: {
          createQueryRunner: jest.fn(),
        },
      } as any,
    };

    branchRepository = createMockRepository();
    supplyRepository = createMockRepository();
    stockTransferRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(Inventory),
          useValue: inventoryRepository,
        },
        { provide: getRepositoryToken(Branch), useValue: branchRepository },
        { provide: getRepositoryToken(Supply), useValue: supplyRepository },
        {
          provide: getRepositoryToken(StockTransfer),
          useValue: stockTransferRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  describe('create', () => {
    it('debe crear inventario exitosamente', async () => {
      branchRepository.findOne.mockResolvedValue(mockBranch);
      supplyRepository.findOne.mockResolvedValue(mockSupply);
      inventoryRepository.findOne.mockResolvedValue(null);
      inventoryRepository.create.mockReturnValue(mockInventory);
      inventoryRepository.save.mockResolvedValue(mockInventory);

      const result = await service.create(
        {
          branch_id: 'branch-1',
          supply_id: 'supply-1',
          current_quantity: 50,
          minimum_stock: 10,
        },
        'user-1',
      );

      expect(result.current_quantity).toBe(50);
    });

    it('debe lanzar error si branch no existe', async () => {
      branchRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          {
            branch_id: 'invalid',
            supply_id: 'supply-1',
            current_quantity: 50,
            minimum_stock: 10,
          },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar error si supply no existe', async () => {
      branchRepository.findOne.mockResolvedValue(mockBranch);
      supplyRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          {
            branch_id: 'branch-1',
            supply_id: 'invalid',
            current_quantity: 50,
            minimum_stock: 10,
          },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar error si ya existe inventario para ese branch/supply', async () => {
      branchRepository.findOne.mockResolvedValue(mockBranch);
      supplyRepository.findOne.mockResolvedValue(mockSupply);
      inventoryRepository.findOne.mockResolvedValue(mockInventory);

      await expect(
        service.create(
          {
            branch_id: 'branch-1',
            supply_id: 'supply-1',
            current_quantity: 50,
            minimum_stock: 10,
          },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe restringir creación a secretaria solo en su sucursal', async () => {
      const userContext: UserContext = {
        userId: 'user-1',
        role: 'secretaria',
        branch_id: 'branch-2',
      };

      await expect(
        service.create(
          {
            branch_id: 'branch-1',
            supply_id: 'supply-1',
            current_quantity: 50,
            minimum_stock: 10,
          },
          'user-1',
          userContext,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('debe retornar lista paginada', async () => {
      inventoryRepository.findAndCount.mockResolvedValue([[mockInventory], 1]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('debe retornar inventario por ID', async () => {
      inventoryRepository.findOne.mockResolvedValue(mockInventory);

      const result = await service.findOne('inv-1');

      expect(result.id).toBe('inv-1');
    });

    it('debe lanzar error si no existe', async () => {
      inventoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adjustQuantity', () => {
    it('debe ajustar cantidad positivamente', async () => {
      inventoryRepository.findOne.mockResolvedValue(mockInventory);
      inventoryRepository.save.mockResolvedValue({
        ...mockInventory,
        current_quantity: 60,
      });

      const result = await service.adjustQuantity('inv-1', 10, 'user-1');

      expect(result.current_quantity).toBe(60);
    });

    it('debe ajustar cantidad negativamente', async () => {
      inventoryRepository.findOne.mockResolvedValue(mockInventory);
      inventoryRepository.save.mockResolvedValue({
        ...mockInventory,
        current_quantity: 40,
      });

      const result = await service.adjustQuantity('inv-1', -10, 'user-1');

      expect(result.current_quantity).toBe(40);
    });

    it('debe lanzar error si resultado es negativo', async () => {
      inventoryRepository.findOne.mockResolvedValue(mockInventory);

      await expect(
        service.adjustQuantity('inv-1', -100, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('debe eliminar inventario si no tiene transfers asociados', async () => {
      inventoryRepository.findOne.mockResolvedValue(mockInventory);
      stockTransferRepository.count.mockResolvedValue(0);
      inventoryRepository.update.mockResolvedValue({} as any);

      const result = await service.remove('inv-1', 'user-1');

      expect(result.deleted).toBe(true);
    });

    it('debe lanzar error si tiene transfers asociados', async () => {
      inventoryRepository.findOne.mockResolvedValue(mockInventory);
      stockTransferRepository.count.mockResolvedValue(3);

      await expect(service.remove('inv-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
