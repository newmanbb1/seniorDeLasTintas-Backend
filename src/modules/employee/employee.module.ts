import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Attendance } from '../attendance/entities/attendance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Branch, Attendance])],
  controllers: [EmployeeController],
  providers: [EmployeeService],
})
export class EmployeeModule {}
