import { Injectable } from '@nestjs/common';
import * as can from 'socketcan';
@Injectable()
export class BluetoothEquipmentScanningService {
  private channel: any;
  private resolveScanFunction: (result: Record<string, any>) => void;
  private bufferList: string[] = [];
  constructor() {
    this.channel = can.createRawChannel(process.env.CAN_INTERFACE, true);
    this.channel.addListener('onMessage', this.messageHandler.bind(this));
    this.channel.start();
  }

  messageHandler(frame: any): void {
    if (frame.id === 0) {
      const message: string = String.fromCharCode(...frame.data);
      // console.log('message:',message,`(${frame.data.toString('hex')})`);
      if (message === 'finished') {
        this.resolveScanFunction({ successful: true, data: this.bufferList });
      } else {
        this.bufferList.push(frame.data.toString('hex'));
      }
    }
  }

  async scan(): Promise<string[]> {
    this.bufferList = [];
    this.channel.send({
      id: 1,
      data: Buffer.from('scan'),
    });
    const result: any = await new Promise((resolve, reject) => {
      this.resolveScanFunction = resolve;
      setTimeout(() => {
        reject({
          successful: false,
          message: 'SCAN TIMEOUT',
        });
      }, 20000);
    });
    if (result.successful) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  }
}
