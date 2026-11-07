import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeOffRequestEntity, RequestStatus } from './time-off-request.entity';
import { TimeOffBalanceEntity } from '../time-off-balance/time-off-balance.entity';
import { MockHcmService } from '../mock-hcm/mock-hcm.service';

@Injectable()
export class TimeOffRequestService {
  private readonly logger = new Logger(TimeOffRequestService.name);

  constructor(
    @InjectRepository(TimeOffRequestEntity)
    private readonly requestRepository: Repository<TimeOffRequestEntity>,
    @InjectRepository(TimeOffBalanceEntity)
    private readonly balanceRepository: Repository<TimeOffBalanceEntity>,
    private readonly mockHcmService: MockHcmService,
  ) {}

  async submitRequest(employeeId: string, startDate: Date, endDate: Date, requestedDays: number, ip: string) {
    this.logger.log(`AUDIT: Processing request for employee ${employeeId} from IP ${ip}`);
    // 1. Initial State: Create Request as PENDING
    let request = this.requestRepository.create({
      employeeId,
      startDate,
      endDate,
      requestedDays,
      status: RequestStatus.PENDING,
    });
    request = await this.requestRepository.save(request);

    // 2. Synchronous Validation against HCM
    try {
      const hcmResult = this.mockHcmService.processTimeOff(employeeId, requestedDays);

      if (hcmResult.success) {
        // 3. Update Request Status to APPROVED
        this.logger.log(`AUDIT: HCM APPROVED request for employee ${employeeId}`);
        request.status = RequestStatus.APPROVED;
        await this.requestRepository.save(request);

        // 4. Update local balance
        const balance = await this.balanceRepository.findOne({ where: { employeeId } });
        if (balance) {
          balance.balance -= requestedDays;
          await this.balanceRepository.save(balance);
          this.logger.log(`AUDIT: Local balance updated for employee ${employeeId}. New balance: ${balance.balance}`);
        }
      } else {
        // 3. Update Request Status to REJECTED
        this.logger.warn(`AUDIT: HCM REJECTED request for employee ${employeeId}. Reason: ${hcmResult.reason}`);
        request.status = RequestStatus.REJECTED;
        request.rejectionReason = hcmResult.reason;
        await this.requestRepository.save(request);
      }
    } catch (error) {
      // 3. Update Request Status to SYSTEM_ERROR
      this.logger.error(`AUDIT: SYSTEM ERROR during HCM validation for employee ${employeeId}`, error.stack);
      request.status = RequestStatus.SYSTEM_ERROR;
      request.rejectionReason = 'HCM System Unavailable';
      await this.requestRepository.save(request);
    }

    return request;
  }
}
