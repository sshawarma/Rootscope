import 'dotenv/config';
import express from 'express';
import { MqttClient } from 'mqtt';

import MQTTClientProvider from './src/lib/mqttClientProvider';
import EventPacketHandler from './src/providers/packets/packetHandler';
import { EventPacket } from './src/providers/types/daemonEvent';
import { fsTestPacket } from './testfiles/packet';
import { ErrorMessage, ErrorType } from './src/providers/types/errors';
import { EventType } from './src/providers/types/fileSystemChangeEvent';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const mqttClient: MqttClient = MQTTClientProvider.getClient();

mqttClient.on('connect', function () {
    mqttClient.subscribe({ 'rootscope-daemon4': { qos: 1 } });
    console.log('connected')
});

mqttClient.on('message', async (topic, message) => {
    // const packetHandler: EventPacketHandler = EventPacketHandler.getInstance();
    const mqttMessage: EventPacket = JSON.parse(message.toString());
                const messageToPublish: ErrorMessage = {
                errorType: ErrorType.OUT_OF_ORDER,
                eventType: mqttMessage?.event_type ?? EventType.UNKNOWN,
                timeOfError: new Date(),
                data: { eventId: 4124 }
            };
            MQTTClientProvider.publishToTopic(JSON.stringify(messageToPublish));
    // await packetHandler.process(mqttMessage);
});

app.listen(port, async () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
