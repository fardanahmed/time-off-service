import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('TimeOffBalance (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return 404 for non-existent employee balance', () => {
    return request(app.getHttpServer())
      .get('/balances/emp-999')
      .expect(404);
  });

  it('should create and return balance for a new employee', async () => {
    // This assumes we have an endpoint or we simulate batch sync to create balance.
    // For now, let's assume we post a new balance via an internal endpoint or batch sync.
    // Let's create an endpoint POST /balances to set balance (for initial state setup or from batch).
    await request(app.getHttpServer())
      .post('/balances')
      .send({ employeeId: 'emp-100', locationId: 'loc-1', balance: 15 })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/balances/emp-100')
      .expect(200);

    expect(res.body).toHaveProperty('balance', 15);
  });
});
