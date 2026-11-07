import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncLogEntity, SyncStatus } from './sync-log.entity';
import { MockHcmService } from '../mock-hcm/mock-hcm.service';
import { TimeOffBalanceService } from '../time-off-balance/time-off-balance.service';

@Injectable()
export class SyncLogService {
  private readonly logger = new Logger(SyncLogService.name);

  constructor(
    @InjectRepository(SyncLogEntity)
    private readonly syncLogRepository: Repository<SyncLogEntity>,
    private readonly mockHcmService: MockHcmService,
    private readonly timeOffBalanceService: TimeOffBalanceService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleNightlySync() {
    this.logger.log('Starting nightly batch sync with HCM...');
    let syncLog = this.syncLogRepository.create({
      status: SyncStatus.IN_PROGRESS,
    });
    syncLog = await this.syncLogRepository.save(syncLog);

    try {
      const batchData = this.mockHcmService.getBatch();
      let processedCount = 0;

      for (const record of batchData) {
        // Location id is not provided in mock batch, assuming a default or keeping existing
        await this.timeOffBalanceService.setBalance(
          record.employeeId,
          'loc-1',
          record.balanceDays,
        );
        processedCount++;
      }

      syncLog.status = SyncStatus.SUCCESS;
      syncLog.details = `Successfully synced ${processedCount} records.`;
      await this.syncLogRepository.save(syncLog);
      this.logger.log('Nightly batch sync completed successfully.');
    } catch (error) {
      this.logger.error('Nightly batch sync failed', error);
      syncLog.status = SyncStatus.FAILED;
      syncLog.details =
        error instanceof Error ? error.message : 'Unknown error';
      await this.syncLogRepository.save(syncLog);
    }
  }

  // Helper method for testing
  async triggerManualSync() {
    return this.handleNightlySync();
  }
}
