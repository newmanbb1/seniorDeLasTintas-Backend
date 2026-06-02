import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../auth/entities/user.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Supply } from '../supply/entities/supply.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import {
  StockTransfer,
  StockTransferStatus,
} from '../stock-transfer/entities/stock-transfer.entity';
import {
  Attendance,
  AttendanceEntryStatus,
} from '../attendance/entities/attendance.entity';
import {
  seedAdmin,
  seedSecretarias,
  seedBranches,
  seedSupplies,
  seedEmployees,
  seedInventory,
} from './seed-data';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Supply)
    private readonly supplyRepository: Repository<Supply>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(StockTransfer)
    private readonly stockTransferRepository: Repository<StockTransfer>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  // SEMILLA AUTOMÁTICA DESACTIVADA - Solo ejecutar manualmente via HTTP
  // async onModuleInit() {
  //   const hasData = await this.checkExistingData();
  //   if (!hasData) {
  //     console.log('📦 No hay datos. Ejecutando seed automáticamente...');
  //     await this.seedAll();
  //   }
  // }

  // private async checkExistingData(): Promise<boolean> {
  //   const userCount = await this.userRepository.count({ where: { deleted_at: IsNull() } });
  //   return userCount > 0;
  // }

  async seedAll(): Promise<{ message: string; data: any }> {
    const result: any = {
      admin: false,
      branches: 0,
      secretarias: 0,
      supplies: 0,
      employees: 0,
      inventories: 0,
      transfers: 0,
      attendances: 0,
    };

    const adminId = await this.seedAdmin();
    if (!adminId) {
      throw new Error('No se pudo crear el usuario admin');
    }
    result.admin = true;

    const branches = await this.seedBranches(adminId);
    result.branches = branches.length;

    const secretarias = await this.seedSecretarias(adminId, branches);
    result.secretarias = secretarias.length;

    const supplies = await this.seedSupplies(adminId);
    result.supplies = supplies.length;

    const employees = await this.seedEmployees(adminId, branches);
    result.employees = employees.length;

    const inventories = await this.seedInventory(adminId, branches, supplies);
    result.inventories = inventories.length;

    const transfers = await this.seedStockTransfers(
      adminId,
      branches,
      supplies,
    );
    result.transfers = transfers.length;

    const attendances = await this.seedAttendances(adminId, employees);
    result.attendances = attendances.length;

    return {
      message: 'Seed ejecutado correctamente',
      data: result,
    };
  }

  async resetAndSeed(): Promise<{ message: string; data: any }> {
    await this.clearAllData();
    return this.seedAll();
  }

  async getStatus(): Promise<{ message: string; data: any }> {
    const users = await this.userRepository.count({
      where: { deleted_at: IsNull() },
    });
    const branches = await this.branchRepository.count({
      where: { deleted_at: IsNull() },
    });
    const supplies = await this.supplyRepository.count({
      where: { deleted_at: IsNull() },
    });
    const employees = await this.employeeRepository.count({
      where: { deleted_at: IsNull() },
    });
    const inventories = await this.inventoryRepository.count({
      where: { deleted_at: IsNull() },
    });
    const transfers = await this.stockTransferRepository.count({
      where: { deleted_at: IsNull() },
    });
    const attendances = await this.attendanceRepository.count();

    return {
      message: 'Estado actual de la base de datos',
      data: {
        admin_users: users,
        branches,
        supplies,
        employees,
        inventories,
        stock_transfers: transfers,
        attendances,
        seeded: users > 0,
      },
    };
  }

  private async clearAllData(): Promise<void> {
    await this.attendanceRepository.delete({});
    await this.stockTransferRepository.delete({});
    await this.inventoryRepository.delete({});
    await this.employeeRepository.delete({});
    await this.supplyRepository.delete({});
    await this.refreshTokenRepository.delete({});
    await this.userRepository.delete({});
    await this.branchRepository.delete({});
  }

  private async seedAdmin(): Promise<string | null> {
    const existing = await this.userRepository.findOne({
      where: { email: seedAdmin.email, deleted_at: IsNull() },
    });

    if (existing) {
      return existing.id;
    }

    const hashedPassword = await bcrypt.hash(seedAdmin.password, 10);
    const admin = this.userRepository.create({
      email: seedAdmin.email,
      password: hashedPassword,
      full_name: seedAdmin.full_name,
      role: UserRole.ADMIN,
      active: true,
      created_by: '00000000-0000-0000-0000-000000000001',
    });

    const saved = await this.userRepository.save(admin);
    return saved.id;
  }

  private async seedSecretarias(
    adminId: string,
    branches: Branch[],
  ): Promise<User[]> {
    const secretarias: User[] = [];

    for (let i = 0; i < seedSecretarias.length; i++) {
      const secretariaData = seedSecretarias[i];

      const existing = await this.userRepository.findOne({
        where: { email: secretariaData.email, deleted_at: IsNull() },
      });

      if (existing) {
        secretarias.push(existing);
        continue;
      }

      const hashedPassword = await bcrypt.hash(secretariaData.password, 10);

      const branch = branches[i] || branches[0];

      const secretaria = this.userRepository.create({
        email: secretariaData.email,
        password: hashedPassword,
        full_name: secretariaData.full_name,
        role: UserRole.SECRETARIA,
        branch_id: branch.id,
        active: true,
        created_by: adminId,
      });

      const saved = await this.userRepository.save(secretaria);
      secretarias.push(saved);
    }

    return secretarias;
  }

  private async seedBranches(adminId: string): Promise<Branch[]> {
    const branches: Branch[] = [];

    for (const branchData of seedBranches) {
      const existing = await this.branchRepository.findOne({
        where: { name: branchData.name, deleted_at: IsNull() },
      });

      if (existing) {
        branches.push(existing);
        continue;
      }

      const branch = this.branchRepository.create({
        ...branchData,
        created_by: adminId,
      });

      const saved = await this.branchRepository.save(branch);
      branches.push(saved);
    }

    return branches;
  }

  private async seedSupplies(adminId: string): Promise<Supply[]> {
    const supplies: Supply[] = [];

    for (const supplyData of seedSupplies) {
      const existing = await this.supplyRepository.findOne({
        where: { name: supplyData.name, deleted_at: IsNull() },
      });

      if (existing) {
        supplies.push(existing);
        continue;
      }

      const supply = this.supplyRepository.create({
        ...supplyData,
        created_by: adminId,
      });

      const saved = await this.supplyRepository.save(supply);
      supplies.push(saved);
    }

    return supplies;
  }

  private async seedEmployees(
    adminId: string,
    branches: Branch[],
  ): Promise<Employee[]> {
    const employees: Employee[] = [];

    for (let i = 0; i < seedEmployees.length; i++) {
      const empData = seedEmployees[i];
      const branch = branches[i % branches.length];

      const existing = await this.employeeRepository.findOne({
        where: { full_name: empData.full_name, deleted_at: IsNull() },
      });

      if (existing) {
        employees.push(existing);
        continue;
      }

      const hashedPin = await bcrypt.hash(empData.access_pin, 10);
      const employee = this.employeeRepository.create({
        ...empData,
        access_pin: hashedPin,
        branch,
        active: true,
        created_by: adminId,
      });

      const saved = await this.employeeRepository.save(employee);
      employees.push(saved);
    }

    return employees;
  }

  private async seedInventory(
    adminId: string,
    branches: Branch[],
    supplies: Supply[],
  ): Promise<Inventory[]> {
    const inventories: Inventory[] = [];
    let inventoryIndex = 0;

    for (const branch of branches) {
      for (const supply of supplies) {
        const existing = await this.inventoryRepository.findOne({
          where: {
            branch: { id: branch.id },
            supply: { id: supply.id },
          },
        });

        if (existing) {
          inventories.push(existing);
          continue;
        }

        const invData = seedInventory[inventoryIndex % seedInventory.length];
        const inventory = this.inventoryRepository.create({
          branch,
          supply,
          current_quantity: invData.current_quantity,
          minimum_stock: invData.minimum_stock,
          created_by: adminId,
        });

        const saved = await this.inventoryRepository.save(inventory);
        inventories.push(saved);
        inventoryIndex++;
      }
    }

    return inventories;
  }

  private async seedStockTransfers(
    adminId: string,
    branches: Branch[],
    supplies: Supply[],
  ): Promise<StockTransfer[]> {
    const transfers: StockTransfer[] = [];

    const transfer1 = this.stockTransferRepository.create({
      origin_branch: branches[0],
      destination_branch: branches[1],
      supply: supplies[0],
      quantity: 10,
      status: StockTransferStatus.Received,
      request_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      reception_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      created_by: adminId,
    });
    const saved1 = await this.stockTransferRepository.save(transfer1);
    transfers.push(saved1);

    const transfer2 = this.stockTransferRepository.create({
      origin_branch: branches[1],
      destination_branch: branches[2],
      supply: supplies[1],
      quantity: 5,
      status: StockTransferStatus.InTransit,
      request_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      created_by: adminId,
    });
    const saved2 = await this.stockTransferRepository.save(transfer2);
    transfers.push(saved2);

    return transfers;
  }

  private async seedAttendances(
    adminId: string,
    employees: Employee[],
  ): Promise<Attendance[]> {
    const attendances: Attendance[] = [];

    for (const employee of employees.slice(0, 3)) {
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const checkInHour = 8 + Math.floor(Math.random() * 2);
        const checkIn = new Date(date);
        checkIn.setHours(checkInHour, 30, 0, 0);

        const checkOut = new Date(date);
        checkOut.setHours(17, 0, 0, 0);

        const status =
          checkInHour <= 9
            ? AttendanceEntryStatus.Punctual
            : AttendanceEntryStatus.Late;

        const attendance = this.attendanceRepository.create({
          employee,
          register_date: date.toISOString().split('T')[0],
          check_in: checkIn,
          check_out: checkOut,
          check_in_status: status,
          hours_worked: (17 - checkInHour + (60 - 30) / 60).toFixed(2),
          created_by: adminId,
        });

        const saved = await this.attendanceRepository.save(attendance);
        attendances.push(saved);
      }
    }

    return attendances;
  }
}
