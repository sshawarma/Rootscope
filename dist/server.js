"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mqtt_1 = __importDefault(require("mqtt"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('Hello World! swag');
});
const client = mqtt_1.default.connect("mqtt://test.mosquitto.org", { clientId: "mqttjs01" });
// const client = mqtt.connect(`wss://localhost:${port}/mqtt`, {
//   clientId: 'client'
// });
client.on('connect', function () {
    console.log("connected  " + client.connected);
    client.subscribe('testtopic');
});
client.on('message', function (topic, message) {
    console.log(message.toString());
    client.publish('testtopic', 'test payload');
});
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map