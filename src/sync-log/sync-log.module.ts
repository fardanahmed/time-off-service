import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncLogService } from './sync-log.service';
import { SyncLogController } from './sync-log.controller';
import { SyncLogEntity } from './sync-log.entity';
import { TimeOffBalanceModule } from '../time-off-balance/time-off-balance.module';
import { MockHcmModule } from '../mock-hcm/mock-hcm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SyncLogEntity]),
    TimeOffBalanceModule,
    MockHcmModule,
  ],
  controllers: [SyncLogController],
  providers: [SyncLogService],
})
export class SyncLogModule {}
