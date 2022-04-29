import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { StreamAndRecordVideoService } from 'src/stream-and-record-video/stream-and-record-video.service';
import * as cv from 'opencv4nodejs';
@Injectable()
export class FaceRecognitionService {
  private face_cascade: cv.CascadeClassifier;
  constructor(
    private streamAndRecordVideoService: StreamAndRecordVideoService,
  ) {
    this.initialFaceApi();
  }
  async initialFaceApi(): Promise<void> {
    this.face_cascade = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);
  }

  async detectFace(): Promise<Record<string, unknown>> {
    const rawFrameImage = await this.streamAndRecordVideoService.getFrameImage(
      Number(process.env.FACE_RECOG_CAM),
    );
    const { objects, numDetections } = this.face_cascade.detectMultiScale(
      rawFrameImage.bgrToGray(),
      1.1,
      4,
    );
    console.log('->objects[0]:', objects[0]);
    if (numDetections.length == 1 && objects[0].width > 150) {
      const outputImage = rawFrameImage.copy();
      cv.drawDetection(outputImage, objects[0]);
      return {
        isDetectedFace: true,
        image: cv.imencode('.jpg', outputImage).toString('base64'),
        rawBase64: cv.imencode('.jpg', rawFrameImage).toString('base64'),
      };
    } else {
      return {
        isDetectedFace: false,
        image: cv
          .imencode('.jpg', rawFrameImage, [cv.IMWRITE_JPEG_QUALITY, 30])
          .toString('base64'),
      };
    }
  }
}
