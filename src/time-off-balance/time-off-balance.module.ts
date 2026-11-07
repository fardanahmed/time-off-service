import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeOffBalanceService } from './time-off-balance.service';
import { TimeOffBalanceController } from './time-off-balance.controller';
import { TimeOffBalanceEntity } from './time-off-balance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimeOffBalanceEntity])],
  controllers: [TimeOffBalanceController],
  providers: [TimeOffBalanceService],
  exports: [TimeOffBalanceService],
})
export class TimeOffBalanceModule {}
