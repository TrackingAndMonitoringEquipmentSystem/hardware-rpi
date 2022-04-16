import { Injectable } from '@nestjs/common';
import * as faceapi from '@vladmandic/face-api/dist/face-api.node.js';
import * as tf from '@tensorflow/tfjs-node';
import * as path from 'path';
import { StreamAndRecordVideoService } from 'src/stream-and-record-video/stream-and-record-video.service';
import * as canvas from "canvas";
@Injectable()
export class FaceRecognitionService {
    constructor(
        private streamAndRecordVideoService: StreamAndRecordVideoService,
    ) {
        this.initialFaceApi();
    }
    async initialFaceApi(): Promise<void> {
        const modelPath = path.resolve(__dirname, './models');
        await faceapi.tf.setBackend("tensorflow");
        await faceapi.tf.enableProdMode();
        await faceapi.tf.ENV.set("DEBUG", false);
        await faceapi.tf.ready();
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
        const { Canvas, Image, ImageData } = canvas;
        faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

    }

    async detectFace(): Promise<Record<string, unknown>> {
        const rawFrameImage = await this.streamAndRecordVideoService.getFrameImage(0)
        const image = this.parseImage(rawFrameImage);
        const result = await faceapi.detectSingleFace(image as faceapi.TNetInput, new faceapi.SsdMobilenetv1Options({
            minConfidence: 0.5,
        }));
        if (result) {
            const canvasImg = await canvas.loadImage(rawFrameImage);
            const out = await faceapi.createCanvasFromMedia(canvasImg);
            faceapi.draw.drawDetections(out, result);
            return { isDetectedFace: true, image: out.toBuffer("image/jpeg").toString('base64'), rawBase64: rawFrameImage.toString('base64') };
        } else {
            return { isDetectedFace: false, image: rawFrameImage.toString('base64') };
        }

    }

    parseImage(file: Uint8Array): unknown {
        const decoded = tf.node.decodeImage(file);
        const casted = decoded.toFloat();
        const result = casted.expandDims(0);
        decoded.dispose();
        casted.dispose();
        return result;
    }
}
