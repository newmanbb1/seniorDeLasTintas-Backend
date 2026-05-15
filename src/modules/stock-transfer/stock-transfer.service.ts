import { Injectable } from '@nestjs/common';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { UpdateStockTransferDto } from './dto/update-stock-transfer.dto';

@Injectable()
export class StockTransferService {
  create(createStockTransferDto: CreateStockTransferDto) {
    return 'This action adds a new stockTransfer';
  }

  findAll() {
    return `This action returns all stockTransfer`;
  }

  findOne(id: number) {
    return `This action returns a #${id} stockTransfer`;
  }

  update(id: number, updateStockTransferDto: UpdateStockTransferDto) {
    return `This action updates a #${id} stockTransfer`;
  }

  remove(id: number) {
    return `This action removes a #${id} stockTransfer`;
  }
}
