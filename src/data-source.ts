import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'backend',
  synchronize: false,
  migrationsRun: false,
  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  logging: process.env.NODE_ENV !== 'production',
});

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Data Source initialized');
  })
  .catch((error) => {
    console.error('❌ Data Source initialization error:', error);
  });
