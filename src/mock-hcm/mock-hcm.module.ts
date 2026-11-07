import { Module } from '@nestjs/common';
import { MockHcmService } from './mock-hcm.service';
import { MockHcmController } from './mock-hcm.controller';

@Module({
  providers: [MockHcmService],
  controllers: [MockHcmController],
  exports: [MockHcmService],
})
export class MockHcmModule {}
