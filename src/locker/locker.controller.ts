import { Controller, Get } from '@nestjs/common';
import { getResponse, ResponseDto } from 'src/utils/response';
import { LockerService } from './locker.service';


@Controller('lockers')
export class LockerController {
  constructor(private readonly lockerService: LockerService) {}

  @Get()
  async getLocker(): Promise<ResponseDto> {
    return getResponse('00', await this.lockerService.getLocker())
  }
}
