import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { LockerService } from './locker.service';
import { Server } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import * as io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { Locker } from 'src/entities/locker.entity';
import { BluetoothEquipmentScanningService } from 'src/bluetooth-equipment-scanning/bluetooth-equipment-scanning.service';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { StreamAndRecordVideoService } from 'src/stream-and-record-video/stream-and-record-video.service';
@WebSocketGateway({ cors: true })
@Injectable()
export class LockerGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private logger: Logger = new Logger('LockerGateway');
  @WebSocketServer()
  server: Server;
  private socket: Socket;
  private locker: Locker;
  constructor(private readonly lockerService: LockerService, 
    private readonly bluetoothEquipmentScanningService: BluetoothEquipmentScanningService,
    private readonly streamAndRecordVideoService: StreamAndRecordVideoService,
    ) {
    this.socket = io(
      `${process.env.SOCKET_IO_HOST}:${process.env.SOCKET_IO_PORT}/${process.env.SOCKET_IO_LOCKER_NAME_SPACE}`,
    );
    this.socket.on('connect', this.onConnectedHandler.bind(this));
    this.socket.on('disconnect', this.onDisconnectedHandler.bind(this));
    this.socket.on('connect_error', this.onConnectErrorHandler.bind(this));
    this.subscribeToEvents(this.socket);
  }
  afterInit(server: any) {
    this.logger.log('initialized');
  }
  handleConnection(client: any, ...args: any[]) {
    this.logger.log('Client connected: ');
  }
  handleDisconnect(client: any) {
    this.logger.log('Client disconnected: ');
    this.logger.log('->backend socket io connected');
    this.socket.emit('join', {
      room: process.env.LOCKER_UID,
    });
  }

  onConnectedHandler(): void {
    this.logger.log('->backend/locker socket io connected');
  }

  onDisconnectedHandler(): void {
    this.logger.log('->backend/locker socket io disconnected');
  }

  onConnectErrorHandler(error: any): void {
    this.logger.error(`->backend/locker socket io connect_error: ${error}`);
  }

  async subscribeToEvents(socket: Socket): Promise<void> {
    this.locker = await this.lockerService.getLocker();
    socket.on(`locker/${this.locker.id}`, this.onLockerCommand.bind(this));
  }

  async onLockerCommand(data: any) {
    console.log('->onLockerCommand:', data);
    if(data.command == 'lockerUpdate'){
      const updatedLocker = data.data;
      const locker = await this.lockerService.updateLocker({
        id: updatedLocker.locker_id,
        location: `ห้อง ${updatedLocker.room.name} ชั้น ${updatedLocker.room.floor.name} อาคาร ${updatedLocker.room.floor.building.name}`,
        name: updatedLocker.locker_name,
        description: updatedLocker.description,
        status: updatedLocker.status,
      } as Locker);
      this.server.emit('locker_updated', locker);
    } else if(data.command == 'addEquipment') {
      try{
        const scanPromise = this.bluetoothEquipmentScanningService.scan();
        const objectDetectPromise = this.detectObject();
        const promiseResults = await Promise.all([scanPromise,objectDetectPromise]);
        console.log('->promiseResults.data:', promiseResults[1]);
        this.socket.emit(`locker/addEquipment/response`,{id: this.locker.id, data:promiseResults[0]});

      }catch(error) {
        console.error('Error:', error);
      }
    }
    
  }

  async detectObject(): Promise<any>{
    const objectDetectCameraMap = [0];
    const detectResults = [];
    await this.lockerService.setAllLightStatus(1);
    for(const cameraNo of objectDetectCameraMap) {
      const frame = await this.streamAndRecordVideoService.getFrame(cameraNo);
     const detectResult = await axios.post(`${process.env.OBJECT_DETECTION_URL}:${process.env.OBJECT_DETECTION_PORT}/${process.env.OBJECT_DETECTION_DETECT_PATH}`,
          {
            uuid: uuidv4(),
            image: frame,
          }
        );
    detectResults.push(detectResult);
    }
    await this.lockerService.setAllLightStatus(0);
    return detectResults;
  }
}
