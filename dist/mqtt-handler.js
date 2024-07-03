"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mqtt_1 = require("mqtt");
class MqttHandler {
    constructor(host) {
        this.mqttClient = null;
        this.host = host;
    }
    connect() {
        // Connect mqtt with credentials (in case of needed, otherwise we can omit 2nd param)
        this.mqttClient = (0, mqtt_1.connect)(this.host);
        // Mqtt error calback
        this.mqttClient.on('error', (err) => {
            console.log('Error encountered: ', err);
            this.mqttClient.end();
        });
        // Connection callback
        this.mqttClient.on('connect', () => {
            console.log(`mqtt client connected`);
        });
        // mqtt subscriptions
        this.mqttClient.subscribe('mytopic', { qos: 0 });
        // When a message arrives, console.log it
        this.mqttClient.on('message', function (topic, message) {
            console.log(message.toString());
        });
        this.mqttClient.on('close', () => {
            console.log(`mqtt client disconnected`);
        });
    }
    // Sends a mqtt message to topic: mytopic
    sendMessage(message) {
        this.mqttClient.publish('mytopic', message);
    }
}
module.exports = MqttHandler;
//# sourceMappingURL=mqtt-handler.js.map