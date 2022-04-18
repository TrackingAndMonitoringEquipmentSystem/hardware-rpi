import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Locker } from 'src/entities/locker.entity';
import { Repository } from 'typeorm/repository/Repository';
import axios from 'axios';
import * as cv from 'opencv4nodejs';
import * as path from 'path';
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


        // const modelPath = path.resolve(__dirname, './images');
        // const img1 = await cv.imreadAsync(path.join(modelPath, 'image.png'), cv.IMREAD_GRAYSCALE);
        // const img2 = await cv.imreadAsync(path.join(modelPath, 'image-r90.png'), cv.IMREAD_GRAYSCALE);
        // const sift = new cv.SIFTDetector();
        // const key1 = await sift.detectAsync(img1);
        // const key2 = await sift.detectAsync(img2);
        // const desp1 = await sift.computeAsync(img1, key1);
        // const desp2 = await sift.computeAsync(img2, key2);
        // console.log('->key1:', key1.length);
        // console.log('->key2:', key2.length);
        // const results = await cv.matchKnnFlannBasedAsync(desp1, desp2, 2);
        // console.log('->result match length:', results.length);
        // let matchCount = 0;
        // for (let match of results) {
        //     if (match[0].distance < 0.7 * match[1].distance) {
        //         matchCount++;
        //     }
        // }
        // console.log('->matchCount:', matchCount);
        console.log('->cv.xmodules:', cv.xmodules);
        if (!cv.xmodules.dnn) {
            throw new Error('exiting: opencv4nodejs compiled without dnn module');
        }
    }

    async getLocker(): Promise<Locker> {
        return await this.lockerRepository.findOne();
    }

    async updateLocker(locker: Locker): Promise<Locker> {
        return await this.lockerRepository.save(locker);
    }
}
