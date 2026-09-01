import { Module } from '@nestjs/common';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BranchModule } from './modules/branch/branch.module';
import { SupplyModule } from './modules/supply/supply.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { StockTransferModule } from './modules/stock-transfer/stock-transfer.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { AuthModule } from './modules/auth/auth.module';
import { SeedModule } from './modules/seed/seed.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { CustomerModule } from './modules/customer/customer.module';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 100,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 500,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 2000,
      },
    ]),

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
        synchronize: configService.get<string>('DB_SYNC') === 'true',
        migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
        migrationsTableName: 'migrations',
        migrationsRun:
          configService.get<string>('DB_MIGRATIONS_RUN') === 'true',
      }),
    }),
    AuthModule,
    SeedModule,
    UploadsModule,
    BranchModule,
    SupplyModule,
    InventoryModule,
    AttendanceModule,
    StockTransferModule,
    EmployeeModule,
    ChatbotModule,
    CustomerModule,
    OrderModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
