import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TimeOffBalanceModule } from './time-off-balance/time-off-balance.module';
import { TimeOffRequestModule } from './time-off-request/time-off-request.module';
import { MockHcmModule } from './mock-hcm/mock-hcm.module';
import { SyncLogModule } from './sync-log/sync-log.module';
import { TimeOffBalanceEntity } from './time-off-balance/time-off-balance.entity';
import { TimeOffRequestEntity } from './time-off-request/time-off-request.entity';
import { SyncLogEntity } from './sync-log/sync-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.NODE_ENV === 'test' ? ':memory:' : 'timeoff.sqlite',
      entities: [TimeOffBalanceEntity, TimeOffRequestEntity, SyncLogEntity],
      synchronize: true, // Auto-sync for development
    }),
    ScheduleModule.forRoot(),
    TimeOffBalanceModule,
    TimeOffRequestModule,
    MockHcmModule,
    SyncLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
