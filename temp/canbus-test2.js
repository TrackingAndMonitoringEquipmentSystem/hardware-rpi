var can = require('socketcan');
const ID = 2;
var channel = can.createRawChannel('vcan0', true);
channel.addListener('onMessage', messageHandler);
channel.start();

function messageHandler(message){
  if(message.id == ID){
    console.log('->message:', message);
    channel.send({
      id: 0,
      ext: true,
      data: Buffer.from('4567', 'ascii'),
    });
    channel.send({
      id: 0,
      ext: true,
      data: Buffer.from('finished', 'utf8'),
    });
  }
}


