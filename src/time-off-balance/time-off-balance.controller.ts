import { Controller, Get, Param, Post, Body, Ip, Logger } from '@nestjs/common';
import { TimeOffBalanceService } from './time-off-balance.service';

@Controller('balances')
export class TimeOffBalanceController {
  private readonly logger = new Logger(TimeOffBalanceController.name);

  constructor(private readonly balanceService: TimeOffBalanceService) {}

  @Get(':employeeId')
  async getBalance(@Param('employeeId') employeeId: string, @Ip() ip: string) {
    this.logger.log(
      `AUDIT: Data access - balance for employee ${employeeId} by IP ${ip}`,
    );
    const balanceEntity =
      await this.balanceService.getBalanceByEmployeeId(employeeId);
    return {
      employeeId: balanceEntity.employeeId,
      locationId: balanceEntity.locationId,
      balance: balanceEntity.balance,
      lastSyncedAt: balanceEntity.updatedAt,
    };
  }

  @Post()
  async setBalance(
    @Body() body: { employeeId: string; locationId: string; balance: number },
    @Ip() ip: string,
  ) {
    this.logger.log(
      `AUDIT: Balance update for employee ${body.employeeId} by IP ${ip}`,
    );
    const balanceEntity = await this.balanceService.setBalance(
      body.employeeId,
      body.locationId,
      body.balance,
    );
    return {
      employeeId: balanceEntity.employeeId,
      locationId: balanceEntity.locationId,
      balance: balanceEntity.balance,
    };
  }
}
