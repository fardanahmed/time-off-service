import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeOffBalanceEntity } from './time-off-balance.entity';

@Injectable()
export class TimeOffBalanceService {
  constructor(
    @InjectRepository(TimeOffBalanceEntity)
    private readonly balanceRepository: Repository<TimeOffBalanceEntity>,
  ) {}

  async getBalanceByEmployeeId(
    employeeId: string,
  ): Promise<TimeOffBalanceEntity> {
    const balance = await this.balanceRepository.findOne({
      where: { employeeId },
    });
    if (!balance) {
      throw new NotFoundException(
        `Balance for employee ${employeeId} not found`,
      );
    }
    return balance;
  }

  async setBalance(
    employeeId: string,
    locationId: string,
    balanceDays: number,
  ): Promise<TimeOffBalanceEntity> {
    let balance = await this.balanceRepository.findOne({
      where: { employeeId },
    });
    if (!balance) {
      balance = this.balanceRepository.create({
        employeeId,
        locationId,
        balance: balanceDays,
      });
    } else {
      balance.balance = balanceDays;
      balance.locationId = locationId;
    }
    return this.balanceRepository.save(balance);
  }
}
