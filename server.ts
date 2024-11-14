import 'dotenv/config';
import express from 'express';
import { MqttClient } from 'mqtt';

import MQTTClientProvider from './src/lib/mqttClientProvider';
import EventPacketHandler from './src/providers/packets/packetHandler';
import { EventPacket } from './src/providers/types/daemonEvent';
import { ErrorMessage, ErrorType } from './src/providers/types/errors';
import { EventType } from './src/providers/types/fileSystemChangeEvent';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const mqttClient: MqttClient = MQTTClientProvider.getClient();

mqttClient.on('connect', function () {
    mqttClient.subscribe({ 'rootscope-daemon2': { qos: 1 } });
});

mqttClient.on('message', function (topic, message) {
    const packetHandler: EventPacketHandler = EventPacketHandler.getInstance();
    const mqttMessage: EventPacket = JSON.parse(message.toString());
    const now = new Date()
    const messageToPublish: ErrorMessage = {
        errorType: ErrorType.OUT_OF_ORDER,
        eventType: mqttMessage.event_type ?? EventType.UNKNOWN,
        lastSuccesfulEventTime: parseInt((new Date().getTime() / 1000).toFixed(0)),
        data: { eventId:123 }
    };
    MQTTClientProvider.publishToTopic(JSON.stringify(messageToPublish));
    // packetHandler.process(mqttMessage);
});

app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
