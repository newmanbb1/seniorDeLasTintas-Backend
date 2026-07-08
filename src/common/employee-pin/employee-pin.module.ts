import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../../modules/employee/entities/employee.entity';
import { EmployeePinService } from '../services/employee-pin.service';

@Module({
  imports: [TypeOrmModule.forFeature([Employee])],
  providers: [EmployeePinService],
  exports: [EmployeePinService],
})
export class EmployeePinModule {}
