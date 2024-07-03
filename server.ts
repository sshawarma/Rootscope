import express from 'express';
import mqtt from 'mqtt'

const app = express();
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('Hello World! swag');
});
const client  = mqtt.connect("mqtt://test.mosquitto.org",{clientId:"mqttjs01"});
// const client = mqtt.connect(`wss://localhost:${port}/mqtt`, {
//   clientId: 'client'
// });

client.on('connect', function () {
  console.log("connected  "+client.connected);
  client.subscribe('testtopic');
});


client.on('message', function (topic, message) {
  console.log(message.toString());
  client.publish('testtopic', 'test payload');
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
