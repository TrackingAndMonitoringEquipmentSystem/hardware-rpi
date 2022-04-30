import { Module } from '@nestjs/common';
import { LockerService } from './locker.service';
import { LockerGateway } from './locker.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Locker } from 'src/entities/locker.entity';
import { LockerController } from './locker.controller';
import { StreamAndRecordVideoModule } from 'src/stream-and-record-video/stream-and-record-video.module';
import { MacAddress } from 'src/entities/mac-address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Locker, MacAddress]),
    StreamAndRecordVideoModule,
  ],
  providers: [LockerService, LockerGateway],
  controllers: [LockerController],
  exports: [LockerService],
})
export class LockerModule {}
