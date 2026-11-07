import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('TimeOffRequest (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup initial data in mock HCM
    await request(app.getHttpServer())
      .post('/hcm/test/set-balance')
      .send({ employeeId: 'emp-10', balanceDays: 20 });

    // Setup initial local balance
    await request(app.getHttpServer())
      .post('/balances')
      .send({ employeeId: 'emp-10', locationId: 'loc-1', balance: 20 });
  });

  afterEach(async () => {
    await app.close();
  });

  it('should approve request and decrease balance when HCM succeeds', async () => {
    const res = await request(app.getHttpServer())
      .post('/requests')
      .send({
        employeeId: 'emp-10',
        startDate: '2026-06-01',
        endDate: '2026-06-05',
        requestedDays: 5,
      })
      .expect(201);

    expect(res.body.status).toBe('APPROVED');
    expect(res.body.requestedDays).toBe(5);

    // Verify local balance is decreased
    const balanceRes = await request(app.getHttpServer())
      .get('/balances/emp-10')
      .expect(200);

    expect(balanceRes.body.balance).toBe(15);
  });

  it('should reject request when HCM denies it (insufficient balance)', async () => {
    const res = await request(app.getHttpServer())
      .post('/requests')
      .send({
        employeeId: 'emp-10',
        startDate: '2026-06-01',
        endDate: '2026-06-05',
        requestedDays: 25, // more than 20
      })
      .expect(201);

    expect(res.body.status).toBe('REJECTED');
    expect(res.body.rejectionReason).toBe('Insufficient balance in HCM');

    // Verify local balance is NOT decreased
    const balanceRes = await request(app.getHttpServer())
      .get('/balances/emp-10')
      .expect(200);

    expect(balanceRes.body.balance).toBe(20);
  });

  it('should record SYSTEM_ERROR when HCM is unavailable', async () => {
    // Force mock HCM to fail
    await request(app.getHttpServer())
      .post('/hcm/test/fail-next')
      .send({ fail: true });

    const res = await request(app.getHttpServer())
      .post('/requests')
      .send({
        employeeId: 'emp-10',
        startDate: '2026-06-01',
        endDate: '2026-06-05',
        requestedDays: 5,
      })
      .expect(201);

    expect(res.body.status).toBe('SYSTEM_ERROR');

    // Verify local balance is NOT decreased
    const balanceRes = await request(app.getHttpServer())
      .get('/balances/emp-10')
      .expect(200);

    expect(balanceRes.body.balance).toBe(20);
  });
});
