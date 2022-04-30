import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { LockerService } from './locker.service';
import { Server } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import * as io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { Locker } from 'src/entities/locker.entity';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { StreamAndRecordVideoService } from 'src/stream-and-record-video/stream-and-record-video.service';
import { MacAddress } from 'src/entities/mac-address.entity';
@WebSocketGateway({ cors: true })
@Injectable()
export class LockerGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger: Logger = new Logger('LockerGateway');
  @WebSocketServer()
  server: Server;
  private socket: Socket;
  private locker: Locker;
  constructor(
    private readonly lockerService: LockerService,
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
    if (data.command == 'lockerUpdate') {
      const updatedLocker = data.data;
      const locker = await this.lockerService.updateLocker({
        id: updatedLocker.locker_id,
        location: `ห้อง ${updatedLocker.room.name} ชั้น ${updatedLocker.room.floor.name} อาคาร ${updatedLocker.room.floor.building.name}`,
        name: updatedLocker.locker_name,
        description: updatedLocker.description,
        status: updatedLocker.status,
      } as Locker);
      this.server.emit('locker_updated', locker);
    } else if (data.command == 'addEquipment') {
      try {
        this.streamAndRecordVideoService.releaseCamera(0);
        this.streamAndRecordVideoService.releaseCamera(2);
        this.streamAndRecordVideoService.releaseCamera(3);
        this.streamAndRecordVideoService.releaseCamera(4);
        this.lockerService.setAllLightStatus(1);
        const uuid = uuidv4();
        const detectResult = await axios.post(
          `${process.env.OBJECT_DETECTION_URL}:${process.env.OBJECT_DETECTION_PORT}/${process.env.OBJECT_DETECTION_DETECT_PATH}`,
          {
            uuid: uuid,
          },
        );
        this.lockerService.setAllLightStatus(0);
        this.socket.emit(`locker/addEquipment/response`, {
          isSucceed: true,
          message: 'Succeed',
          id: this.locker.id,
          data: { ...detectResult.data, uuid },
        });
      } catch (error) {
        this.lockerService.setAllLightStatus(0);
        console.error('error.response.data:', error.response.data);
        if (error.response.status === 400) {
          this.socket.emit(`locker/addEquipment/response`, {
            isSucceed: false,
            message: error.response.data.message,
            id: this.locker.id,
          });
        } else {
          this.socket.emit(`locker/addEquipment/response`, {
            isSucceed: false,
            message: 'Internal Server Error',
            id: this.locker.id,
          });
        }
      }
    } else if (data.command == 'saveEquipment') {
      try {
        const saveResult = await axios.patch(
          `${process.env.OBJECT_DETECTION_URL}:${process.env.OBJECT_DETECTION_PORT}/${process.env.OBJECT_DETECTION_SAVE_PATH}`,
          {
            uuid: data.data.uuid,
            macAddresses: data.data.macAddresses,
          },
        );
        await this.lockerService.saveMacAddresses(
          data.data.macAddresses.map(
            (macAddress) =>
              ({
                macAddress,
              } as MacAddress),
          ),
        );
      } catch (error) {
        console.log('->error:', error);
      }
    }
  }

  @SubscribeMessage('unlock')
  async onUnlock(): Promise<void> {
    this.lockerService.setDoorState(1, 1);
    this.lockerService.setDoorState(2, 1);
    this.lockerService.setDoorState(3, 1);
    this.lockerService.setDoorState(4, 1);
  }

  @SubscribeMessage('lock')
  async onLock(): Promise<void> {
    this.lockerService.setDoorState(1, 0);
    this.lockerService.setDoorState(2, 0);
    this.lockerService.setDoorState(3, 0);
    this.lockerService.setDoorState(4, 0);
  }

  @SubscribeMessage('borrow')
  async onBorrow(@MessageBody() data: any): Promise<void> {
    console.log('->data:', data);
    try {
      await this.lockerService.setAllLightStatus(1);
      const borrowResult = await axios.get(
        `${process.env.OBJECT_DETECTION_URL}:${process.env.OBJECT_DETECTION_PORT}/${process.env.OBJECT_DETECTION_RECOGNITION_PATH}`,
      );
      this.lockerService.setAllLightStatus(0);
      const macAddresses = await this.lockerService.getAllMacAddresses();
      const borrowMacAddresses = macAddresses.filter(
        (macAddress) => !borrowResult.data.includes(macAddress.macAddress),
      );

      await this.lockerService.deleteMacAdrresses(
        macAddresses.map((e) => e.id),
      );
      try {
        const saveBorrowResult = await axios.post(
          `${process.env.BACKEND_URL}/${process.env.LOCKER_PATH_BORROW}`,
          {
            userId: data,
            tag_ids: macAddresses.map((e) => e.macAddress),
          },
        );
        console.log('->saveBorrowResult:', saveBorrowResult.data);
        await axios.post(
          `${process.env.BACKEND_URL}/${process.env.USER_PATH}/${process.env.USER_PATH_SEND_NOTI}`,
          {
            userId: data,
            payload: {
              notification: {
                title: 'Hello World',
                body: 'This is notification',
              },
              data: {
                type: 'borrow',
                id: `${saveBorrowResult.data.data.id}`,
              },
            },
          },
        );
      } catch (error) {
        console.log('->saveBorrowResult error:', error);
      }
    } catch (error) {
      this.lockerService.setAllLightStatus(0);

      console.error('->error.data', error.data);
    }
  }

  @SubscribeMessage('return')
  async onReturn(@MessageBody() data: any): Promise<void> {
    console.log('->data:', data);
    try {
      const groupBorrow = await axios.get(
        `${process.env.BACKEND_URL}/${process.env.GROUP_BORROW_PATH}/${process.env.GROUP_BORROW_PATH_VIEW_GROUP}/${data}`,
      );
      const borrowMacAddresses = groupBorrow.data.data[0].borrowReturns.map(
        (borrowReturn) => borrowReturn.equipment.tag_id,
      );

      await this.lockerService.setAllLightStatus(1);
      const returnResults = await axios.get(
        `${process.env.OBJECT_DETECTION_URL}:${process.env.OBJECT_DETECTION_PORT}/${process.env.OBJECT_DETECTION_RECOGNITION_PATH}`,
      );
      this.lockerService.setAllLightStatus(0);
      console.log('->returnResults.data:', returnResults.data);
      const macAddresses = await this.lockerService.getAllMacAddresses();
      const returnMacAddresses = returnResults.data.filter(
        (returnResult) =>
          !macAddresses.find(
            (macAddress) => macAddress.macAddress === returnResult,
          ),
      );
      console.log('->returnMacAddresses:', returnMacAddresses);
      const detectedReturnMacAddresses = returnMacAddresses.filter(
        (returnMacAddress) => borrowMacAddresses.includes(returnMacAddress),
      );
      console.log('->detectedReturnMacAddresses:', detectedReturnMacAddresses);
      await this.lockerService.saveMacAddresses(
        detectedReturnMacAddresses.map(
          (e) => ({ macAddress: e } as MacAddress),
        ),
      );
      try {
        const saveReturnResult = await axios.patch(
          `${process.env.BACKEND_URL}/${process.env.BORROW_PATH}/${process.env.BORROW_PATH_RETURN}/${groupBorrow.data.data[0].id}`,
        );
        console.log('->saveReturnResult:', saveReturnResult.data);
        await axios.post(
          `${process.env.BACKEND_URL}/${process.env.USER_PATH}/${process.env.USER_PATH_SEND_NOTI}`,
          {
            userId: data,
            payload: {
              notification: {
                title: 'Hello World',
                body: 'This is notification',
              },
              data: {
                type: 'borrow',
                id: `${groupBorrow.data.data[0].id}`,
              },
            },
          },
        );
      } catch (error) {
        console.log('->saveBorrowResult error:', error);
      }
    } catch (error) {
      this.lockerService.setAllLightStatus(0);

      console.error('->error.data', error.data);
    }
  }
}
