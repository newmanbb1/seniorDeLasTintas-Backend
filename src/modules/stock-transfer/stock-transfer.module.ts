import { Module } from '@nestjs/common';
import { StockTransferService } from './stock-transfer.service';
import { StockTransferController } from './stock-transfer.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockTransfer } from './entities/stock-transfer.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Supply } from '../supply/entities/supply.entity';
import { Inventory } from '../inventory/entities/inventory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockTransfer, Branch, Supply, Inventory]),
  ],
  controllers: [StockTransferController],
  providers: [StockTransferService],
})
export class StockTransferModule {}
