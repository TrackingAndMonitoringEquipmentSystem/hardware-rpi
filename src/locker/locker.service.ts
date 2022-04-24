import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Locker } from 'src/entities/locker.entity';
import { Repository } from 'typeorm/repository/Repository';
import axios from 'axios';
import { BinaryValue, Gpio } from 'onoff';
import * as cv from 'opencv4nodejs';
import { StreamAndRecordVideoService } from 'src/stream-and-record-video/stream-and-record-video.service';
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
    private streamAndRecordVideoService: StreamAndRecordVideoService,
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
    // await this.ledLight1.write(status);
    // await this.ledLight2.write(status);
    // await this.ledLight3.write(status);
    // await this.ledLight4.write(status);
  }

  async detectObject(): Promise<any> {
    await this.setAllLightStatus(1);
    const cap = new cv.VideoCapture('/dev/video0');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const frame = await cap.readAsync();
    const grayFrame = await frame.bgrToGrayAsync();
    const thresed = await grayFrame.thresholdAsync(
      cv.THRESH_BINARY,
      255,
      cv.THRESH_OTSU,
    );
    const kernel = new cv.Mat(5, 5, cv.CV_8U);
    const removedNoise = await thresed.morphologyExAsync(
      kernel,
      cv.MORPH_OPEN,
      new cv.Point2(0, 0),
      2,
    );

    const contours = await removedNoise.findContoursAsync(
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE,
    );
    for (const contour of contours) {
      console.log('->rect:', contour.boundingRect.toString());
    }
    await this.setAllLightStatus(0);
    return (await cv.imencodeAsync('.png', frame)).toString('base64');
  }
}
