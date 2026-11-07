import { Test, TestingModule } from '@nestjs/testing';
import { TimeOffRequestService } from './time-off-request.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TimeOffRequestEntity } from './time-off-request.entity';
import { TimeOffBalanceEntity } from '../time-off-balance/time-off-balance.entity';
import { MockHcmService } from '../mock-hcm/mock-hcm.service';

describe('TimeOffRequestService', () => {
  let service: TimeOffRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeOffRequestService,
        {
          provide: getRepositoryToken(TimeOffRequestEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(TimeOffBalanceEntity),
          useValue: {},
        },
        {
          provide: MockHcmService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TimeOffRequestService>(TimeOffRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
