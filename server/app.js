const http = require("http");
const url = require("url");
const port = 3000;
const client = require("prom-client");
const data = {};
const guage = new client.Gauge({
  name: "SensorMonitor",
  help: "The metric provide density from sensor to user.",
  labelNames: ["sensor_id", "user_id"],
});

const requestHandler = async (request, response) => {
  if (request.url === "/metrics") {
    Object.keys(data).forEach((user) => {
      const sensorDict = data[user];
      Object.keys(sensorDict).forEach((sensor) => {
        guage.set(
          {
            sensor_id: sensor,
            user_id: user,
          },
          sensorDict[sensor]
        );
      });
    });

    return response.end(await client.register.metrics());
  }

  const { pathname, query } = url.parse(request.url, true);

  if (pathname === "/update") {
    const { user, sensor, distance } = query;
    if (!data[user]) data[user] = {};
    if (!data[user][sensor]) data[user][sensor] = {};
    data[user][sensor] = parseFloat(distance);
  }

  return response.end("Hello Node.js Server!");
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log("something bad happened", err);
  }
  console.log(`server is listening on ${port}`);
});
