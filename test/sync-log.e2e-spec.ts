import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('SyncLog (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Ensure mock HCM has some initial data
    await request(app.getHttpServer())
      .post('/hcm/test/set-balance')
      .send({ employeeId: 'emp-10', balanceDays: 20 });

    await request(app.getHttpServer())
      .post('/hcm/test/set-balance')
      .send({ employeeId: 'emp-11', balanceDays: 30 });
  });

  afterEach(async () => {
    await app.close();
  });

  it('should sync balances from mock HCM to local DB', async () => {
    // Check initial balance doesn't exist
    await request(app.getHttpServer()).get('/balances/emp-11').expect(404);

    // Trigger sync
    await request(app.getHttpServer()).post('/sync/trigger').expect(200);

    // Verify balance was synced
    const res = await request(app.getHttpServer())
      .get('/balances/emp-11')
      .expect(200);

    expect(res.body.balance).toBe(30);

    // Verify another employee
    const res2 = await request(app.getHttpServer())
      .get('/balances/emp-10')
      .expect(200);

    expect(res2.body.balance).toBe(20);
  });
});
