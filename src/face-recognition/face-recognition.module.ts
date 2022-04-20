import { Module } from '@nestjs/common';
import { FaceRecognitionService } from './face-recognition.service';
import { FaceRecognitionGateway } from './face-recognition.gateway';
import { StreamAndRecordVideoService } from 'src/stream-and-record-video/stream-and-record-video.service';
import { LockerModule } from 'src/locker/locker.module';

@Module({
  imports:[LockerModule],
  providers: [FaceRecognitionGateway, FaceRecognitionService, StreamAndRecordVideoService],
})
export class FaceRecognitionModule {}
