import express from 'express';
import mqtt from 'mqtt'
import 'dotenv/config';

import { msg } from './src/lib/msgpack';
import MsgPack from './src/lib/msgpack';
import EventHandler from './src/providers/messageHandler';
import { DaemonEvent, fullScanEvent } from './src/providers/types/eventTypes';

const app = express();
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('Hello World! swag');
});
const client  = mqtt.connect(process.env.MQTT_URL ,{clientId:"ExampleClient1", username:'rootscope', password:'RootScope22'});
// const client = mqtt.connect(`wss://localhost:${port}/mqtt`, {
//   clientId: 'client'
// });

client.on('connect', function () {
  console.log("connected  "+client.connected);
  client.subscribe('rootscope-daemon1');
});


client.on('message', function (topic, message) {
  // console.log(message.toString());
  const msgPack: MsgPack = MsgPack.getInstance()
  const eventHandler: EventHandler = EventHandler.getInstance()
  console.log('raw:', message.toString())
  // const packedMessage: Buffer = msgPack.packMessage(message.toString())
  // console.log('packedMessage:', packedMessage)
  const unpackedMessage: DaemonEvent = msgPack.unpackMessage(message)
  console.log("unpackedMessage:", unpackedMessage)
  // console.log('unpacked', unpackedMessage)
  // console.log('unpackedType', typeof unpackedMessage)

  // const parsedMessage = JSON.parse(unpackedMessage)
  // console.log('unpackedMessage:',typeof parsedMessage)
  // msgPack.storeMessage(msg)
  // eventHandler.process(fullScanEvent)
  // console.log('storedMessage:')

  // packAndUnpack(message.toString())

});

app.listen(port, () => {
  const eventHandler: EventHandler = EventHandler.getInstance()
  // eventHandler.process(fullScanEvent)
  console.log(process.env.TEST)
  return console.log(`Express is listening at http://localhost:${port}`);
});
// unpack, then try to save to db

// {0: Unknown, 1: FullScan, 2: FileSystemUpdate, 3: NetworkUpdate, 4:Hardware } // collection for each
// Daemon Crash collection
// Map directories to proper schema DONE
// In fileSystemUpdate, update the FullScan record