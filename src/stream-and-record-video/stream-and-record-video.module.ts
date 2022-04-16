import { LockerService } from './../locker/locker.service';
import { Module } from '@nestjs/common';
import { StreamAndRecordVideoService } from './stream-and-record-video.service';
import { StreamAndRecordVideoGateway } from './stream-and-record-video.gateway';
import { LockerGateway } from 'src/locker/locker.gateway';

@Module({
  providers: [
    StreamAndRecordVideoGateway,
    StreamAndRecordVideoService,
  ],
})
export class StreamAndRecordVideoModule {}
