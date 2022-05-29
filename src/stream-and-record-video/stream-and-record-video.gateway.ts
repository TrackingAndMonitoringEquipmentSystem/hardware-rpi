import { StreamAndRecordVideoService } from './stream-and-record-video.service';
import { Injectable, Logger } from '@nestjs/common';
import * as io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { LockerGateway } from 'src/locker/locker.gateway';

@Injectable()
export class StreamAndRecordVideoGateway {
  private socket: Socket;
  private logger: Logger = new Logger('StreamAndRecordVideoGateway');
  private liveIntervalHandler: Record<number, NodeJS.Timeout> = {};
  constructor(
    private readonly streamAndRecordVideoService: StreamAndRecordVideoService,
  ) {
    this.socket = io(
      `${process.env.SOCKET_IO_HOST}:${process.env.SOCKET_IO_PORT}/${process.env.SOCKET_IO_VIDEO_NAME_SPACE}`,
    );
    this.socket.on('connect', this.onConnectedHandler.bind(this));
    this.socket.on('disconnect', this.onDisconnectedHandler.bind(this));
    this.socket.on('connect_error', this.onConnectErrorHandler.bind(this));
    this.subscribeToEvents(this.socket);
  }

  onConnectedHandler(): void {
    this.logger.log('->socket io connected');
    this.socket.emit('join', {
      room: process.env.LOCKER_UID,
    });
  }

  onDisconnectedHandler(): void {
    this.logger.log('->socket io disconnected');
  }

  onConnectErrorHandler(error: any): void {
    this.logger.error(`->socket io connect_error: ${error}`);
  }

  subscribeToEvents(socket: Socket): void {
    socket.on(`start_live`, this.onStartLive.bind(this));
    socket.on(`stop_live`, this.onStopLive.bind(this));
  }

  onStartLive(data: { camera: number }): void {
    if (!this.liveIntervalHandler[data.camera]) {
      this.liveIntervalHandler[data.camera] = setInterval(
        () => this.emitPicture(data.camera),
        1000 / Number(process.env.FPS),
      );
    }
  }

  onStopLive(data: { camera: number }): void {
    if (this.liveIntervalHandler[data.camera]) {
      clearInterval(this.liveIntervalHandler[data.camera]);
      this.liveIntervalHandler[data.camera] = null;
      this.streamAndRecordVideoService.releaseCamera(data.camera);
    }
  }

  emitPicture(camera: number): void {
    const picture = this.streamAndRecordVideoService.getFrame(camera);
    const emitData = {
      lockerUid: process.env.LOCKER_UID,
      camera: camera,
      picture: picture,
    };
    this.socket.emit(`live`, emitData);
  }
}
