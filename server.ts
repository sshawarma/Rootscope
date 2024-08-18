import express from 'express';
import mqtt from 'mqtt';
import 'dotenv/config';

import { EventPacket } from './src/providers/types/daemonEvent';
import EventPacketHandler from './src/providers/packets/packetHandler';

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

client.on('connect', function () {
    client.subscribe('rootscope-daemon1');
});

client.on('message', function (topic, message) {
    const packetHandler: EventPacketHandler = EventPacketHandler.getInstance()
    const mqttMessage: EventPacket = JSON.parse(message.toString());
    console.log('unstring', message);
    packetHandler.process(mqttMessage)

    console.log(
        `Message received from topic: ${topic} \n
         Message content as string: ${message.toString()}`
    );

    try {
        console.log('unpackedMessage:');

        client.publish('rootscope-daemon-ack', 'success');
    } catch (error) {
        console.log('failed to unpack message');
        client.publish('rootscope-daemon-ack', 'failure');
    }
});

app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
