import { Module } from '@nestjs/common';
import { SupplyService } from './supply.service';
import { SupplyController } from './supply.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supply } from './entities/supply.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Supply])],
  controllers: [SupplyController],
  providers: [SupplyService],
  exports:[SupplyService]
})
export class SupplyModule {}
