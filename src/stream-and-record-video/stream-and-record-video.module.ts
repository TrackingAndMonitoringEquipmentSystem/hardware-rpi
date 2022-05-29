import { Module } from '@nestjs/common';
import { StreamAndRecordVideoService } from './stream-and-record-video.service';
import { StreamAndRecordVideoGateway } from './stream-and-record-video.gateway';

@Module({
  imports: [],
  providers: [StreamAndRecordVideoGateway, StreamAndRecordVideoService],
  exports: [StreamAndRecordVideoService],
})
export class StreamAndRecordVideoModule {}
