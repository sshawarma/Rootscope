import mqtt, { MqttClient } from 'mqtt';

class MQTTClientProvider {
    private static _instance: MQTTClientProvider;
    private static client: MqttClient;

    private constructor() {}

    static getClient = (): MqttClient => {
        if (this.client) return this.client;

        this.client = mqtt.connect(process.env.MQTT_URL, {
            clientId: 'ExampleClient2',
            username: process.env.MQTT_USERNAME,
            password: process.env.MQTT_PASSWORD
        });

        return this.client;
    };

    static publishToTopic = (message: string) => {
        console.log(`Publishing Message: ${message}`);
        this.client.publish('rootscope-daemon-test', message, { qos: 2 });
    };
}

export default MQTTClientProvider;
