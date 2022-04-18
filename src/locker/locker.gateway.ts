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
        const results = await this.bluetoothEquipmentScanningService.scan();
        this.socket.emit(`locker/addEquipment/response`,{id: this.locker.id, data:results});
      }catch(error) {
        console.error(error);
      }
      
      
    }
    
  }
}
