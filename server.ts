import express from 'express';
import { MqttClient } from 'mqtt';
import 'dotenv/config';

import { EventPacket } from './src/providers/types/daemonEvent';
import EventPacketHandler from './src/providers/packets/packetHandler';
import MQTTClientProvider from './src/lib/mqttClientProvider';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const mqttClient: MqttClient = MQTTClientProvider.getClient();

mqttClient.on('connect', function () {
    mqttClient.subscribe('rootscope-daemon2');
});

mqttClient.on('message', function (topic, message) {
    const packetHandler: EventPacketHandler = EventPacketHandler.getInstance();
    const mqttMessage: EventPacket = JSON.parse(message.toString());
    packetHandler.process(mqttMessage);
});

app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
