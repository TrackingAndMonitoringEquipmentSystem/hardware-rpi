const can = require('socketcan');
var channel = can.createRawChannel('can0', true);
channel.addListener('onMessage', messageHandler);
channel.start();

function messageHandler(message) {
  if (1) {
    console.log('->message:', message);
    channel.send({
      id: 0,
      ext: true,
      data: Buffer.from('1234', 'ascii'),
    });
    channel.send({
      id: 0,
      ext: true,
      data: Buffer.from('finished', 'utf8'),
    });
  }
}

channel.send({
  id: 1,
  ext: true,
  data: Buffer.from('finished', 'utf8'),
});
