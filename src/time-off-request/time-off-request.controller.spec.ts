import { Test, TestingModule } from '@nestjs/testing';
import { TimeOffRequestController } from './time-off-request.controller';
import { TimeOffRequestService } from './time-off-request.service';

describe('TimeOffRequestController', () => {
  let controller: TimeOffRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeOffRequestController],
      providers: [
        {
          provide: TimeOffRequestService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<TimeOffRequestController>(TimeOffRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
