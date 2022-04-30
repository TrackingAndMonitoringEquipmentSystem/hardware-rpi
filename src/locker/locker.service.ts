import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Locker } from 'src/entities/locker.entity';
import { Repository } from 'typeorm/repository/Repository';
import axios from 'axios';
import { BinaryValue, Gpio } from 'onoff';
import { MacAddress } from 'src/entities/mac-address.entity';
@Injectable()
export class LockerService {
  private logger = new Logger('LockerService');
  private ledLight1 = new Gpio(Number(process.env.LED_LIGHT_1), 'out', null, {
    activeLow: true,
  });
  private ledLight2 = new Gpio(Number(process.env.LED_LIGHT_2), 'out', null, {
    activeLow: true,
  });
  private ledLight3 = new Gpio(Number(process.env.LED_LIGHT_3), 'out', null, {
    activeLow: true,
  });
  private ledLight4 = new Gpio(Number(process.env.LED_LIGHT_4), 'out', null, {
    activeLow: true,
  });
  private door1 = new Gpio(Number(process.env.DOOR_1), 'out', null, {
    activeLow: true,
  });
  private door2 = new Gpio(Number(process.env.DOOR_2), 'out', null, {
    activeLow: true,
  });
  private door3 = new Gpio(Number(process.env.DOOR_3), 'out', null, {
    activeLow: true,
  });
  private door4 = new Gpio(Number(process.env.DOOR_4), 'out', null, {
    activeLow: true,
  });
  constructor(
    @InjectRepository(Locker)
    private lockerRepository: Repository<Locker>,
    @InjectRepository(MacAddress)
    private macAddressRepository: Repository<MacAddress>,
  ) {
    this.initialGpio();
    this.initialLocker();
  }

  async initialGpio(): Promise<any> {
    this.ledLight1.write(0);
    this.ledLight2.write(0);
    this.ledLight3.write(0);
    this.ledLight4.write(0);
    this.door1.write(0);
    this.door2.write(0);
    this.door3.write(0);
    this.door4.write(0);
  }

  async initialLocker(): Promise<void> {
    const locker = await this.lockerRepository.findOne();
    if (!locker) {
      try {
        const preRegistedLocker = await axios.post(
          `${process.env.BACKEND_URL}/${process.env.LOCKER_PATH}/${
            process.env.LOCKER_PATH_PRE_REGISTER
          }/${process.env.CAMERA_MAP.split(',').length}`,
        );
        await this.lockerRepository.save(
          this.lockerRepository.create({
            id: preRegistedLocker.data.data.locker_id,
            status: preRegistedLocker.data.data.status,
            totalEquipment: 0,
          }),
        );
      } catch (error) {
        this.logger.error(error);
      }
    } else {
      this.logger.log(`lockerId: ${locker.id}`);
    }
  }

  async getLocker(): Promise<Locker> {
    return await this.lockerRepository.findOne();
  }

  async updateLocker(locker: Locker): Promise<Locker> {
    return await this.lockerRepository.save(locker);
  }

  async setAllLightStatus(status: BinaryValue): Promise<any> {
    await this.ledLight1.write(status);
    await this.ledLight2.write(status);
    await this.ledLight3.write(status);
    await this.ledLight4.write(status);
  }

  async setDoorState(doorNo: number, state: BinaryValue): Promise<void> {
    switch (doorNo) {
      case 1:
        this.door1.write(state);
        break;
      case 2:
        this.door2.write(state);
        break;
      case 3:
        this.door3.write(state);
        break;
      case 4:
        this.door4.write(state);
        break;
    }
  }

  async saveMacAddresses(macAddress: MacAddress[]) {
    return await this.macAddressRepository.save(macAddress);
  }

  async getAllMacAddresses(): Promise<MacAddress[]> {
    return await this.macAddressRepository.find();
  }

  async deleteMacAdrresses(macAddressIds: number[]): Promise<void> {
    await this.macAddressRepository.delete(macAddressIds);
  }
}
