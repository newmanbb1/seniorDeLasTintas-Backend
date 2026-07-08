import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

if (!process.env.DB_HOST || !process.env.DB_USERNAME || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  throw new Error('Faltan variables de entorno de la base de datos (DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME)');
}

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  migrationsRun: false,
  entities: isProduction
    ? ['dist/modules/**/*.entity.js']
    : ['src/modules/**/*.entity.ts'],
  migrations: isProduction
    ? ['dist/migrations/*.js']
    : ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  logging: !isProduction,
});

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Data Source initialized');
  })
  .catch((error) => {
    console.error('❌ Data Source initialization error:', error);
  });
