import { Module } from '@nestjs/common';
import { LockerService } from './locker.service';
import { LockerGateway } from './locker.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Locker } from 'src/entities/locker.entity';
import { LockerController } from './locker.controller';

@Module({
  imports:[TypeOrmModule.forFeature([Locker])],
  providers: [LockerGateway, LockerService],
  controllers:[ LockerController],
  exports:[LockerService],
})
export class LockerModule {}
