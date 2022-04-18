import { Injectable } from '@nestjs/common';
import * as can from 'socketcan';

@Injectable()
export class BluetoothEquipmentScanningService {
  private channel: any;
  private resolveScanFunction: (result: Record<string, any>) => void;
  private bufferList: string[] = [];
  private totalCanNode: number = Number(process.env.TOTAL_CAN_NODE);
  private finishedCount = 0;
  constructor() {
    this.channel = can.createRawChannel(process.env.CAN_INTERFACE, true);
    this.channel.addListener('onMessage', this.messageHandler.bind(this));
    this.channel.start();
  }

  messageHandler(frame: any): void {
    if (frame.id === 0) {
      const message: string = String.fromCharCode(...frame.data);
      console.log('->message:', message);
      if (message === 'finished') {
        this.finishedCount++;
        if (this.finishedCount >= this.totalCanNode) {
          this.resolveScanFunction({ successful: true, data: [...new Set(this.bufferList)] });
          this.finishedCount = 0;
        }
      } else {
        this.bufferList.push(frame.data.toString('hex'));
      }
    }
  }

  async scan(): Promise<string[]> {
    this.bufferList = [];
   
    const result: any = await new Promise(((resolve, reject) => { 
      this.resolveScanFunction = resolve;
      for (let i = 1; i <= this.totalCanNode ; i++) {
        this.channel.send({
          id: i,
          data: Buffer.from('scan'),
          ext: true,
        });
      }
      setTimeout(() => {
        reject({
          successful: false,
          message: 'SCAN TIMEOUT',
        });
      }, 20000);
    }).bind(this));
    if (result.successful) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  }
}
