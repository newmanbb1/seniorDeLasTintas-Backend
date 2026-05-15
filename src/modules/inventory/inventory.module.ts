import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Supply } from '../supply/entities/supply.entity';
import { StockTransfer } from '../stock-transfer/entities/stock-transfer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, Branch, Supply, StockTransfer])],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}