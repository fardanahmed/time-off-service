import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeOffRequestService } from './time-off-request.service';
import { TimeOffRequestController } from './time-off-request.controller';
import { TimeOffRequestEntity } from './time-off-request.entity';
import { TimeOffBalanceEntity } from '../time-off-balance/time-off-balance.entity';
import { MockHcmModule } from '../mock-hcm/mock-hcm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimeOffRequestEntity, TimeOffBalanceEntity]),
    MockHcmModule,
  ],
  controllers: [TimeOffRequestController],
  providers: [TimeOffRequestService],
})
export class TimeOffRequestModule {}
