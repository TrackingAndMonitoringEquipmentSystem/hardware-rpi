import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Locker } from 'src/entities/locker.entity';
import { Repository } from 'typeorm/repository/Repository';
import axios from 'axios';
@Injectable()
export class LockerService {

    private logger = new Logger('LockerService');
    constructor(
        @InjectRepository(Locker)
        private lockerRepository: Repository<Locker>
    ) {
        this.initialLocker();
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
}
