import { Controller, Post, Body, Ip, Logger } from '@nestjs/common';
import { TimeOffRequestService } from './time-off-request.service';
import { CreateTimeOffRequestDto } from './dto/create-request.dto';

@Controller('requests')
export class TimeOffRequestController {
  private readonly logger = new Logger(TimeOffRequestController.name);

  constructor(private readonly requestService: TimeOffRequestService) {}

  @Post()
  async createRequest(@Body() dto: CreateTimeOffRequestDto, @Ip() ip: string) {
    this.logger.log(
      `Received time-off request for employee ${dto.employeeId} from IP ${ip}`,
    );
    return this.requestService.submitRequest(
      dto.employeeId,
      new Date(dto.startDate),
      new Date(dto.endDate),
      dto.requestedDays,
      ip,
    );
  }
}
