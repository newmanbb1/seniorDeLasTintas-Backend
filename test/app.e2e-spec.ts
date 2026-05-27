import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const testAdmin = {
      email: `admin-${Date.now()}@test.com`,
      password: 'password123',
      full_name: 'Admin Test',
    };

    it('POST /api/auth/register - debe registrar admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testAdmin)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.refresh_token).toBeDefined();
      expect(res.body.data.user.email).toBe(testAdmin.email);

      adminToken = res.body.data.access_token;
    });

    it('POST /api/auth/register - debe rechazar email duplicado', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testAdmin)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login - debe loguear admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testAdmin.email, password: testAdmin.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.access_token).toBeDefined();
    });

    it('POST /api/auth/login - debe rechazar credenciales inválidas', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testAdmin.email, password: 'wrongpassword' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('GET /api/auth/profile - debe retornar perfil con token válido', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testAdmin.email);
    });

    it('GET /api/auth/profile - debe rechazar sin token', async () => {
      await request(app.getHttpServer()).get('/api/auth/profile').expect(401);
    });
  });

  describe('Branch CRUD', () => {
    let branchId: string;

    it('POST /api/branch - admin debe crear sucursal', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/branch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Sucursal Test ${Date.now()}`,
          address: 'Av. Test 123',
          opening_hours: '9:00-18:00',
          location_link: 'https://maps.google.com',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toContain('Sucursal Test');
      branchId = res.body.data.id;
    });

    it('GET /api/branch - debe listar sucursales', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/branch')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('GET /api/branch/:id - debe retornar sucursal por ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/branch/${branchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(branchId);
    });
  });

  describe('Swagger Docs', () => {
    it('GET /docs - debe servir Swagger UI en desarrollo', async () => {
      const res = await request(app.getHttpServer()).get('/docs').expect(200);

      expect(res.text).toContain('swagger');
    });
  });

  describe('Health / API Prefix', () => {
    it('GET /api (404) - debe tener prefijo api', async () => {
      await request(app.getHttpServer()).get('/api').expect(404);
    });
  });
});
