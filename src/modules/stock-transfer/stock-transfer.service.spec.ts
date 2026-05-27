import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StockTransferService, UserContext } from './stock-transfer.service';
import {
  StockTransfer,
  StockTransferStatus,
} from './entities/stock-transfer.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Supply } from '../supply/entities/supply.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

const createMockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  update: jest.fn(),
});

const createMockInventoryRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});

describe('StockTransferService', () => {
  let service: StockTransferService;
  let stockTransferRepository: ReturnType<typeof createMockRepository>;
  let branchRepository: ReturnType<typeof createMockRepository>;
  let supplyRepository: ReturnType<typeof createMockRepository>;
  let inventoryRepository: ReturnType<typeof createMockInventoryRepository>;

  const mockOriginBranch = {
    id: 'branch-1',
    name: 'Sucursal Central',
    address: 'Av. Principal 123',
    opening_hours: '9:00-18:00',
    location_link: '',
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

  const mockDestBranch = {
    id: 'branch-2',
    name: 'Sucursal Norte',
    address: 'Av. Secundaria 456',
    opening_hours: '9:00-18:00',
    location_link: '',
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
    branch: mockOriginBranch,
    supply: mockSupply,
    current_quantity: 100,
    minimum_stock: 10,
    created_at: new Date(),
    created_by: 'system',
    updated_at: new Date(),
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  } as unknown as Inventory;

  const mockTransfer = {
    id: 'transfer-1',
    idempotency_key: null,
    origin_branch: mockOriginBranch,
    destination_branch: mockDestBranch,
    supply: mockSupply,
    quantity: 10,
    request_date: new Date(),
    reception_date: null,
    status: StockTransferStatus.InTransit,
    created_at: new Date(),
    created_by: 'user-1',
    updated_at: new Date(),
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  } as unknown as StockTransfer;

  beforeEach(async () => {
    stockTransferRepository = createMockRepository();
    branchRepository = createMockRepository();
    supplyRepository = createMockRepository();
    inventoryRepository = createMockInventoryRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockTransferService,
        {
          provide: getRepositoryToken(StockTransfer),
          useValue: stockTransferRepository,
        },
        { provide: getRepositoryToken(Branch), useValue: branchRepository },
        { provide: getRepositoryToken(Supply), useValue: supplyRepository },
        {
          provide: getRepositoryToken(Inventory),
          useValue: inventoryRepository,
        },
      ],
    }).compile();

    service = module.get<StockTransferService>(StockTransferService);
  });

  describe('create', () => {
    const createDto = {
      origin_branch_id: 'branch-1',
      destination_branch_id: 'branch-2',
      supply_id: 'supply-1',
      quantity: 10,
      request_date: new Date(),
    };

    it('debe crear transferencia exitosamente', async () => {
      branchRepository.findOne
        .mockResolvedValueOnce(mockOriginBranch)
        .mockResolvedValueOnce(mockDestBranch);
      supplyRepository.findOne.mockResolvedValue(mockSupply);
      inventoryRepository.findOne.mockResolvedValue(mockInventory);
      stockTransferRepository.create.mockReturnValue(mockTransfer);
      stockTransferRepository.save.mockResolvedValue(mockTransfer);

      const result = await service.create(createDto, 'user-1');

      expect(result.status).toBe(StockTransferStatus.InTransit);
    });

    it('debe lanzar error si origen y destino son iguales', async () => {
      await expect(
        service.create(
          { ...createDto, destination_branch_id: 'branch-1' },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar error si branch origen no existe', async () => {
      branchRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar error si stock insuficiente', async () => {
      branchRepository.findOne
        .mockResolvedValueOnce(mockOriginBranch)
        .mockResolvedValueOnce(mockDestBranch);
      supplyRepository.findOne.mockResolvedValue(mockSupply);
      inventoryRepository.findOne.mockResolvedValue({
        ...mockInventory,
        current_quantity: 5,
      });

      await expect(
        service.create({ ...createDto, quantity: 10 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe restringir a secretaria', async () => {
      const userContext: UserContext = {
        userId: 'user-1',
        role: 'secretaria',
        branch_id: 'branch-3',
      };

      await expect(
        service.create(createDto, 'user-1', userContext),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('receive', () => {
    it('debe recibir transferencia exitosamente', async () => {
      stockTransferRepository.findOne = jest
        .fn()
        .mockImplementation(() => Promise.resolve({ ...mockTransfer }));
      inventoryRepository.findOne
        .mockResolvedValueOnce(mockInventory)
        .mockResolvedValueOnce(mockInventory);
      inventoryRepository.save.mockResolvedValue({} as any);
      stockTransferRepository.save.mockResolvedValue({
        ...mockTransfer,
        status: StockTransferStatus.Received,
      });

      const result = await service.receive('transfer-1', 'user-1');

      expect(result.status).toBe(StockTransferStatus.Received);
    });

    it('debe lanzar error si no está en tránsito', async () => {
      stockTransferRepository.findOne = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ...mockTransfer,
          status: StockTransferStatus.Received,
        }),
      );

      await expect(service.receive('transfer-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reject', () => {
    it('debe rechazar transferencia exitosamente', async () => {
      stockTransferRepository.findOne = jest
        .fn()
        .mockImplementation(() => Promise.resolve({ ...mockTransfer }));
      stockTransferRepository.save.mockResolvedValue({
        ...mockTransfer,
        status: StockTransferStatus.Rejected,
      });

      const result = await service.reject('transfer-1', 'user-1');

      expect(result.status).toBe(StockTransferStatus.Rejected);
    });

    it('debe lanzar error si no está en tránsito', async () => {
      stockTransferRepository.findOne = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ...mockTransfer,
          status: StockTransferStatus.Rejected,
        }),
      );

      await expect(service.reject('transfer-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar lista paginada', async () => {
      stockTransferRepository.findAndCount.mockResolvedValue([
        [mockTransfer],
        1,
      ]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
