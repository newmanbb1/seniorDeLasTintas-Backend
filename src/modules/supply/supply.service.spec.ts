import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SupplyService } from './supply.service';
import { Supply } from './entities/supply.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { StockTransfer } from '../stock-transfer/entities/stock-transfer.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

const createMockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
});

describe('SupplyService', () => {
  let service: SupplyService;
  let supplyRepository: ReturnType<typeof createMockRepository>;
  let inventoryRepository: ReturnType<typeof createMockRepository>;
  let stockTransferRepository: ReturnType<typeof createMockRepository>;

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
    created_by: 'user-1',
    updated_at: new Date(),
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  } as unknown as Supply;

  beforeEach(async () => {
    supplyRepository = createMockRepository();
    inventoryRepository = createMockRepository();
    stockTransferRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplyService,
        { provide: getRepositoryToken(Supply), useValue: supplyRepository },
        {
          provide: getRepositoryToken(Inventory),
          useValue: inventoryRepository,
        },
        {
          provide: getRepositoryToken(StockTransfer),
          useValue: stockTransferRepository,
        },
      ],
    }).compile();

    service = module.get<SupplyService>(SupplyService);
  });

  describe('create', () => {
    it('debe crear insumo exitosamente', async () => {
      supplyRepository.findOne.mockResolvedValue(null);
      supplyRepository.create.mockReturnValue(mockSupply);
      supplyRepository.save.mockResolvedValue(mockSupply);

      const result = await service.create(
        {
          name: 'Tinta Negra',
          category: 'Insumo',
          unit_of_measure: 'Litro',
          code: 'TNT-001',
        },
        'user-1',
      );

      expect(result.name).toBe('Tinta Negra');
    });

    it('debe lanzar error si el nombre ya existe', async () => {
      supplyRepository.findOne.mockResolvedValue(mockSupply);

      await expect(
        service.create(
          {
            name: 'Tinta Negra',
            category: 'Insumo',
            unit_of_measure: 'Litro',
            code: 'TNT-001',
          },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('debe retornar lista paginada', async () => {
      supplyRepository.findAndCount.mockResolvedValue([[mockSupply], 1]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('debe retornar insumo por ID', async () => {
      supplyRepository.findOne.mockResolvedValue(mockSupply);

      const result = await service.findOne('supply-1');

      expect(result.id).toBe('supply-1');
    });

    it('debe lanzar error si no existe', async () => {
      supplyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('debe actualizar insumo', async () => {
      supplyRepository.findOne.mockResolvedValue(mockSupply);
      supplyRepository.save.mockResolvedValue({
        ...mockSupply,
        category: 'Insumo Premium',
      });

      const result = await service.update(
        'supply-1',
        { category: 'Insumo Premium' },
        'user-1',
      );

      expect(result.category).toBe('Insumo Premium');
    });
  });

  describe('remove', () => {
    it('debe eliminar si no tiene inventarios ni transfers', async () => {
      supplyRepository.findOne.mockResolvedValue(mockSupply);
      inventoryRepository.count.mockResolvedValue(0);
      stockTransferRepository.count.mockResolvedValue(0);
      supplyRepository.update.mockResolvedValue({} as any);

      const result = await service.remove('supply-1', 'user-1');

      expect(result.deleted).toBe(true);
    });

    it('debe lanzar error si tiene inventarios', async () => {
      supplyRepository.findOne.mockResolvedValue(mockSupply);
      inventoryRepository.count.mockResolvedValue(3);

      await expect(service.remove('supply-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe lanzar error si tiene transfers', async () => {
      supplyRepository.findOne.mockResolvedValue(mockSupply);
      inventoryRepository.count.mockResolvedValue(0);
      stockTransferRepository.count.mockResolvedValue(2);

      await expect(service.remove('supply-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
