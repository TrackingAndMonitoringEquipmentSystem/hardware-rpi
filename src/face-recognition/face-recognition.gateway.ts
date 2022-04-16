import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { StreamAndRecordVideoService } from 'src/stream-and-record-video/stream-and-record-video.service';
import { FaceRecognitionService } from './face-recognition.service';
import { Server } from 'socket.io';
import axios from 'axios';

@WebSocketGateway({ cors: true })
export class FaceRecognitionGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private logger: Logger = new Logger('FaceRecognitionGateway');
  private intervalHandler: NodeJS.Timeout;
  private isRunning = false;
  @WebSocketServer()
  server: Server;
  constructor(
    private readonly faceRecognitionService: FaceRecognitionService,
    private streamAndRecordVideoService: StreamAndRecordVideoService,
  ) {

  }
  afterInit(server: any) {
    this.logger.log('initialized');
  }

  handleConnection(client: any, ...args: any[]) {
    this.logger.log(`client: ${client.id} is connected`);
  }

  handleDisconnect(client: any) {
    this.logger.log(`client: ${client.id} is disconnected`);
  }

  @SubscribeMessage('startFaceRecognition')
  onStartFaceRecognition(): void {
    if (!this.isRunning) {
      this.logger.log(`start face recognition`);
      this.emitFaceRecognitionResult();
      this.isRunning = true;
    } else {
      this.logger.log(`already started face recognition`);
    }
  }

  async emitFaceRecognitionResult(): Promise<void> {
    const result = await this.faceRecognitionService.detectFace();
    this.server.emit('faceRecognitionResult', result)
    if (result.isDetectedFace) {
      this.onStopFaceRecognition();
      const faceRecogResult = await axios.post(`${process.env.BACKEND_URL}/${process.env.FACE_RECOGNITION_PATH}/${process.env.FACE_RECOGNITION_PATH_VALIDATE_FACE_ID}`,
        {
          base64File: result.rawBase64,
        });
      console.log('->faceRecogResult.data:', faceRecogResult.data);
    }
    if (this.isRunning) {
      this.intervalHandler = setTimeout(this.emitFaceRecognitionResult.bind(this), 1000 / Number(process.env.FACE_RECOG_FPS));
    }
  }

  @SubscribeMessage('stopFaceRecognition')
  onStopFaceRecognition(): void {
    this.isRunning = false;
    if (this.intervalHandler) {
      clearTimeout(this.intervalHandler);
    }
    this.streamAndRecordVideoService.releaseCamera(0);
  }
}
