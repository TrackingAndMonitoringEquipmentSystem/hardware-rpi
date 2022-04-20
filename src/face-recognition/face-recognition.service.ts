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
        const rawFrameImage = await this.streamAndRecordVideoService.getFrameImage(Number(process.env.FACE_RECOG_CAM))
        const { objects, numDetections } = this.face_cascade.detectMultiScale(rawFrameImage.bgrToGray(), 1.1, 4);

        if (numDetections.length == 1) {
            cv.drawDetection(rawFrameImage, objects[0]);
            const outputImage = cv.imencode('.png', rawFrameImage);
            return { isDetectedFace: true, image: outputImage.toString('base64'), rawBase64: cv.imencode('.png', rawFrameImage).toString('base64'), };
        } else if (numDetections.length > 1) {
            for (let object of objects) {
                cv.drawDetection(rawFrameImage, object);
            }
            const outputImage = cv.imencode('.png', rawFrameImage);
            return { isDetectedMultipleFace: true, image: outputImage.toString('base64') };
        } else {
            return { isDetectedFace: false, image: cv.imencode('.png', rawFrameImage).toString('base64') };
        }

    }

}
