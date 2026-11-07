import { Test, TestingModule } from '@nestjs/testing';
import { MockHcmController } from './mock-hcm.controller';
import { MockHcmService } from './mock-hcm.service';

describe('MockHcmController', () => {
  let controller: MockHcmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MockHcmController],
      providers: [
        {
          provide: MockHcmService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<MockHcmController>(MockHcmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
