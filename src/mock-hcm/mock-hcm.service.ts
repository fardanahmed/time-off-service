import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

export interface HcmBalance {
  employeeId: string;
  balanceDays: number;
}

@Injectable()
export class MockHcmService {
  private balances: Map<string, number> = new Map([
    ['emp-1', 10],
    ['emp-2', 5],
    ['emp-3', 0],
  ]);

  private failNextRequest = false;

  // Set this for testing error scenarios
  setFailNextRequest(fail: boolean) {
    this.failNextRequest = fail;
  }

  getBatch(): HcmBalance[] {
    const result: HcmBalance[] = [];
    for (const [employeeId, balanceDays] of this.balances.entries()) {
      result.push({ employeeId, balanceDays });
    }
    return result;
  }

  getBalance(employeeId: string): number {
    if (this.failNextRequest) {
      this.failNextRequest = false;
      throw new HttpException(
        'HCM Unavailable',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const balance = this.balances.get(employeeId);
    if (balance === undefined) {
      throw new HttpException(
        'Employee not found in HCM',
        HttpStatus.NOT_FOUND,
      );
    }
    return balance;
  }

  processTimeOff(
    employeeId: string,
    requestedDays: number,
  ): { success: boolean; reason?: string } {
    if (this.failNextRequest) {
      this.failNextRequest = false;
      throw new HttpException(
        'HCM Unavailable',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const currentBalance = this.balances.get(employeeId);
    if (currentBalance === undefined) {
      return { success: false, reason: 'Employee not found in HCM' };
    }

    if (currentBalance < requestedDays) {
      return { success: false, reason: 'Insufficient balance in HCM' };
    }

    this.balances.set(employeeId, currentBalance - requestedDays);
    return { success: true };
  }

  // Helper method for tests to manipulate mock HCM state
  setBalance(employeeId: string, balance: number) {
    this.balances.set(employeeId, balance);
  }
}
