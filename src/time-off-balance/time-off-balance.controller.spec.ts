import { Test, TestingModule } from '@nestjs/testing';
import { TimeOffBalanceController } from './time-off-balance.controller';
import { TimeOffBalanceService } from './time-off-balance.service';

describe('TimeOffBalanceController', () => {
  let controller: TimeOffBalanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeOffBalanceController],
      providers: [
        {
          provide: TimeOffBalanceService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<TimeOffBalanceController>(TimeOffBalanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
