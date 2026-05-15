import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchModule } from './modules/branch/branch.module';
import { UserModule } from './modules/user/user.module';
import { SupplyModule } from './modules/supply/supply.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { StockTransferModule } from './modules/stock-transfer/stock-transfer.module';
import { EmployeeModule } from './modules/employee/employee.module';

@Module({
  imports: [
    // 1. Cargamos las variables de entorno primero
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),

    // 2. Usamos forRootAsync para esperar a que las variables carguen
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // true solo para desarrollo
      }),
    }),
    BranchModule,
    UserModule,
    SupplyModule,
    InventoryModule,
    AttendanceModule,
    StockTransferModule,
    EmployeeModule

  ],
  controllers: [],
  providers: [],
})
export class AppModule {}