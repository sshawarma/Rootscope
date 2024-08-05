import express from 'express';
import mqtt from 'mqtt';
import 'dotenv/config';

import MsgPack from './src/lib/msgpack';
import EventHandler from './src/providers/eventHandler';
import { DaemonEvent, testEvent, testFullScanEvent } from './src/providers/types/daemonEvent';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello World! swag');
});
const client = mqtt.connect(process.env.MQTT_URL, {
    clientId: 'ExampleClient1',
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
});
// const client = mqtt.connect(`wss://localhost:${port}/mqtt`, {
//   clientId: 'client'
// });

client.on('connect', function () {
    client.subscribe('rootscope-daemon1');
});

client.on('message', function (topic, message) {
    const msgPack: MsgPack = MsgPack.getInstance();
    // const eventHandler: EventHandler = EventHandler.getInstance();
    console.log(
        `Message received from topic: ${topic} \n
         Message content as string: ${message.toString()}`
    );

    try {
        const unpackedMessage: DaemonEvent = msgPack.unpackMessage(message);
        console.log('unpackedMessage:', unpackedMessage);
        client.publish('rootscope-daemon-ack', 'success');
    } catch (error) {
        console.log('failed to unpack message');
        client.publish('rootscope-daemon-ack', 'failure');
    }

    // eventHandler.process(fullScanEvent)
});

app.listen(port, () => {
    const eventHandler: EventHandler = EventHandler.getInstance();
    // eventHandler.process(testEvent)
    return console.log(`Express is listening at http://localhost:${port}`);
});
// unpack, then try to save to db

// {0: Unknown, 1: FullScan, 2: FileSystemUpdate, 3: NetworkUpdate, 4:Hardware } // collection for each
// Daemon Crash collection
// Map directories to proper schema DONE
// In fileSystemUpdate, update the FullScan record
