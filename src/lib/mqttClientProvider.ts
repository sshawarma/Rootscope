import mqtt, { MqttClient } from 'mqtt';

class MQTTClientProvider {
    private static _instance: MQTTClientProvider;
    private static client: MqttClient;

    private constructor() {}

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new MQTTClientProvider();
        return this._instance;
    }

    static getClient = (): MqttClient => {
        if (this.client) return this.client;

        this.client = mqtt.connect(process.env.MQTT_URL, {
            clientId: 'ExampleClient4',
            username: process.env.MQTT_USERNAME,
            password: process.env.MQTT_PASSWORD
        });

        return this.client;
    };
}

export default MQTTClientProvider;
