import { Controller, Get, Post, Body, Param, HttpCode } from '@nestjs/common';
import { MockHcmService } from './mock-hcm.service';

@Controller('hcm')
export class MockHcmController {
  constructor(private readonly mockHcmService: MockHcmService) {}

  @Get('batch')
  getBatch() {
    return this.mockHcmService.getBatch();
  }

  @Get('balance/:employeeId')
  getBalance(@Param('employeeId') employeeId: string) {
    const balance = this.mockHcmService.getBalance(employeeId);
    return { employeeId, balanceDays: balance };
  }

  @Post('timeoff')
  @HttpCode(200)
  processTimeOff(@Body() body: { employeeId: string; requestedDays: number }) {
    return this.mockHcmService.processTimeOff(
      body.employeeId,
      body.requestedDays,
    );
  }

  // --- Testing endpoints ---
  @Post('test/fail-next')
  @HttpCode(200)
  setFailNextRequest(@Body() body: { fail: boolean }) {
    this.mockHcmService.setFailNextRequest(body.fail);
    return { status: 'ok', failNextRequest: body.fail };
  }

  @Post('test/set-balance')
  @HttpCode(200)
  setBalance(@Body() body: { employeeId: string; balanceDays: number }) {
    this.mockHcmService.setBalance(body.employeeId, body.balanceDays);
    return {
      status: 'ok',
      employeeId: body.employeeId,
      balanceDays: body.balanceDays,
    };
  }
}
