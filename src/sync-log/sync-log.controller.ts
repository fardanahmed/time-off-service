import { Controller, Post, HttpCode } from '@nestjs/common';
import { SyncLogService } from './sync-log.service';

@Controller('sync')
export class SyncLogController {
  constructor(private readonly syncLogService: SyncLogService) {}

  @Post('trigger')
  @HttpCode(200)
  async triggerSync() {
    await this.syncLogService.triggerManualSync();
    return { message: 'Sync triggered successfully' };
  }
}
