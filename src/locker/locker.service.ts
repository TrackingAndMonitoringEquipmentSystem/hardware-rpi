import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Locker } from 'src/entities/locker.entity';
import { Repository } from 'typeorm/repository/Repository';
import axios from 'axios';
import {BinaryValue, Gpio} from 'onoff';
@Injectable()
export class LockerService {
    private logger = new Logger('LockerService');
    private ledLight1 = new Gpio(Number(process.env.LED_LIGHT_1), 'out', null, {activeLow: true});
    private ledLight2 = new Gpio(Number(process.env.LED_LIGHT_2), 'out', null, {activeLow: true});
    private ledLight3 = new Gpio(Number(process.env.LED_LIGHT_3), 'out', null, {activeLow: true});
    private ledLight4 = new Gpio(Number(process.env.LED_LIGHT_4), 'out', null, {activeLow: true});
    constructor(
        @InjectRepository(Locker)
        private lockerRepository: Repository<Locker>
    ) {
        this.initialGpio();
        this.initialLocker();
    }

    async initialGpio(): Promise<any>{
        await this.ledLight1.write(0);
        await this.ledLight2.write(0);
        await this.ledLight3.write(0);
        await this.ledLight4.write(0);
    }

    async initialLocker(): Promise<void> {
        const locker = await this.lockerRepository.findOne();
        if (!locker) {
            try {
                const preRegistedLocker = await axios.post(`${process.env.BACKEND_URL}/${process.env.LOCKER_PATH}/${process.env.LOCKER_PATH_PRE_REGISTER}/${process.env.CAMERA_MAP.split(',').length}`);
                await this.lockerRepository.save(this.lockerRepository.create({
                    id: preRegistedLocker.data.data.locker_id,
                    status: preRegistedLocker.data.data.status,
                    totalEquipment: 0,
                }));
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

    async setAllLightStatus(status: BinaryValue): Promise<any>{
        await this.ledLight1.write(status);
        await this.ledLight2.write(status);
        await this.ledLight3.write(status);
        await this.ledLight4.write(status);
    }
}
