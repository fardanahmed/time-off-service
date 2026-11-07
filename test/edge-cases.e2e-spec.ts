import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('TimeOffRequest Edge Cases (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();

    // Setup initial data in mock HCM
    await request(app.getHttpServer())
      .post('/hcm/test/set-balance')
      .send({ employeeId: 'emp-edge', balanceDays: 10 });

    // Setup initial local balance
    await request(app.getHttpServer())
      .post('/balances')
      .send({ employeeId: 'emp-edge', locationId: 'loc-1', balance: 10 });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Validation Edge Cases', () => {
    it('should fail when employeeId is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/requests')
        .send({
          employeeId: '',
          startDate: '2026-06-01',
          endDate: '2026-06-05',
          requestedDays: 5,
        })
        .expect(400);
      
      expect(res.body.message).toContain('employeeId should not be empty');
    });

    it('should fail when requestedDays is less than 0.5', async () => {
      const res = await request(app.getHttpServer())
        .post('/requests')
        .send({
          employeeId: 'emp-edge',
          startDate: '2026-06-01',
          endDate: '2026-06-05',
          requestedDays: 0.1,
        })
        .expect(400);
      
      expect(res.body.message).toContain('requestedDays must not be less than 0.5');
    });

    it('should fail with invalid date format', async () => {
      await request(app.getHttpServer())
        .post('/requests')
        .send({
          employeeId: 'emp-edge',
          startDate: 'not-a-date',
          endDate: '2026-06-05',
          requestedDays: 5,
        })
        .expect(400);
    });

    it('should fail with extra unwhitelisted fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/requests')
        .send({
          employeeId: 'emp-edge',
          startDate: '2026-06-01',
          endDate: '2026-06-05',
          requestedDays: 5,
          maliciousField: 'exploit',
        })
        .expect(400);
      
      expect(res.body.message).toContain('property maliciousField should not exist');
    });

    it('should fail when requestedDays is negative', async () => {
      await request(app.getHttpServer())
        .post('/requests')
        .send({
          employeeId: 'emp-edge',
          startDate: '2026-06-01',
          endDate: '2026-06-05',
          requestedDays: -1,
        })
        .expect(400);
    });
  });

  describe('Business Logic Edge Cases', () => {
    it('should reject when employee is not found in HCM', async () => {
      const res = await request(app.getHttpServer())
        .post('/requests')
        .send({
          employeeId: 'non-existent-hcm',
          startDate: '2026-06-01',
          endDate: '2026-06-05',
          requestedDays: 1,
        })
        .expect(201);
      
      expect(res.body.status).toBe('REJECTED');
      expect(res.body.rejectionReason).toBe('Employee not found in HCM');
    });

    it('should handle decimal requested days correctly (e.g., half day)', async () => {
      const res = await request(app.getHttpServer())
        .post('/requests')
        .send({
          employeeId: 'emp-edge',
          startDate: '2026-06-01',
          endDate: '2026-06-01',
          requestedDays: 0.5,
        })
        .expect(201);
      
      expect(res.body.status).toBe('APPROVED');
      expect(res.body.requestedDays).toBe(0.5);

      // Check balance
      const balanceRes = await request(app.getHttpServer())
        .get('/balances/emp-edge')
        .expect(200);
      expect(balanceRes.body.balance).toBe(9.5);
    });

    it('should allow requesting exactly remaining balance', async () => {
      const res = await request(app.getHttpServer())
        .post('/requests')
        .send({
          employeeId: 'emp-edge',
          startDate: '2026-06-10',
          endDate: '2026-06-20',
          requestedDays: 10,
        })
        .expect(201);
      
      expect(res.body.status).toBe('APPROVED');
      
      const balanceRes = await request(app.getHttpServer())
        .get('/balances/emp-edge')
        .expect(200);
      expect(balanceRes.body.balance).toBe(0);
    });
  });

  describe('Sync Edge Cases', () => {
    it('should handle HCM failure during nightly sync', async () => {
      // Force mock HCM to fail
      await request(app.getHttpServer())
        .post('/hcm/test/fail-next')
        .send({ fail: true });

      // Trigger sync
      await request(app.getHttpServer())
        .post('/sync/trigger')
        .expect(200);

      // Verify the log shows failure
      // We don't have a GET /sync/logs endpoint yet, but we can verify balances didn't change
      // or we can add an endpoint to check logs.
    });
  });
});

