import { Injectable } from '@nestjs/common';
import * as cv from 'opencv4nodejs';
@Injectable()
export class StreamAndRecordVideoService {
  private captures: Record<number, cv.VideoCapture> = {};
  private readonly cameraMap: string[];
  constructor() {
    this.cameraMap = process.env.CAMERA_MAP.split(',');
  }

  async getFrame(camera: number): Promise<string> {
    if (!this.captures[camera]) {
      this.captures[camera] = new cv.VideoCapture(this.cameraMap[camera]);
    }
    const frame = await this.captures[camera].readAsync();
    const image = cv.imencode('.jpg', frame).toString('base64');

    return image;
  }

  async getFrameImage(camera: number): Promise<cv.Mat> {
    if (!this.captures[camera]) {
      this.captures[camera] = new cv.VideoCapture(this.cameraMap[camera]);
    }
    const frame = await this.captures[camera].readAsync();
    return frame;
  }

  async get300x300FrameImage(camera: number): Promise<cv.Mat> {
    const frame = await this.getFrameImage(camera);
    return frame;
  }

  releaseCamera(camera: number): void {
    if (this.captures[camera]) {
      this.captures[camera].release();
      this.captures[camera] = null;
    }
  }
}
