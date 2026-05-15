import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StockTransferService } from './stock-transfer.service';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { UpdateStockTransferDto } from './dto/update-stock-transfer.dto';

@Controller('stock-transfer')
export class StockTransferController {
  constructor(private readonly stockTransferService: StockTransferService) {}

  @Post()
  create(@Body() createStockTransferDto: CreateStockTransferDto) {
    return this.stockTransferService.create(createStockTransferDto);
  }

  @Get()
  findAll() {
    return this.stockTransferService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockTransferService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStockTransferDto: UpdateStockTransferDto) {
    return this.stockTransferService.update(+id, updateStockTransferDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stockTransferService.remove(+id);
  }
}
