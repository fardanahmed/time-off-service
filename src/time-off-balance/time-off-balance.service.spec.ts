import { Test, TestingModule } from '@nestjs/testing';
import { TimeOffBalanceService } from './time-off-balance.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TimeOffBalanceEntity } from './time-off-balance.entity';

describe('TimeOffBalanceService', () => {
  let service: TimeOffBalanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeOffBalanceService,
        {
          provide: getRepositoryToken(TimeOffBalanceEntity),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TimeOffBalanceService>(TimeOffBalanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
