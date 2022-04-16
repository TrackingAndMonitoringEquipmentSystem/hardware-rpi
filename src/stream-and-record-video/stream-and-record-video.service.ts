import { Injectable } from '@nestjs/common';
import * as cv from 'opencv4nodejs';
import { Buffer } from 'buffer';
@Injectable()
export class StreamAndRecordVideoService {
  private captures: Record<number, cv.VideoCapture> = {};
  private readonly cameraMap: string[];
  constructor() {
    this.cameraMap = process.env.CAMERA_MAP.split(',');
  }

  getFrame(camera: number): string {
    if (!this.captures[camera]) {
      this.captures[camera] = new cv.VideoCapture(this.cameraMap[camera]);
    }
    const frame = this.captures[camera].read();
    const image = cv.imencode('.jpg', frame).toString('base64');
    return image;
  }

  async getFrameImage(camera: number): Promise<Buffer> {
    if (!this.captures[camera]) {
      this.captures[camera] = new cv.VideoCapture(this.cameraMap[camera]);
    }
    const frame = await this.captures[camera].readAsync();
    return cv.imencode('.jpg', frame);
  }
  
  releaseCamera(camera: number): void {
    this.captures[camera].release();
    this.captures[camera] = null;
  }
}
