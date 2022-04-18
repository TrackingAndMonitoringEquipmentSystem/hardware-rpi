import { Module } from '@nestjs/common';
import { LockerService } from './locker.service';
import { LockerGateway } from './locker.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Locker } from 'src/entities/locker.entity';
import { LockerController } from './locker.controller';
import { BluetoothEquipmentScanningModule } from 'src/bluetooth-equipment-scanning/bluetooth-equipment-scanning.module';

@Module({
  imports:[TypeOrmModule.forFeature([Locker]), BluetoothEquipmentScanningModule],
  providers: [LockerService,LockerGateway],
  controllers:[ LockerController],
  exports:[LockerService],
})
export class LockerModule {}
