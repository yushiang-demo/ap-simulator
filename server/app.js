const http = require("http");
const port = 3000;
const client = require("prom-client");
let count = 0;
const guage = new client.Gauge({
  name: "chatRoomCount",
  help: "The metric provide the count of chatroom`s people",
  labelNames: ["chat_id"],
});

const requestHandler = async (request, response) => {
  if (request.url === "/metrics") {
    // 更新 metric
    guage.set(
      {
        chat_id: "1",
      },
      count
    );
    guage.set(
      {
        chat_id: "2",
      },
      count + 5
    );
    return response.end(await client.register.metrics());
  }
  if (request.url === "/add") {
    count++;
    return response.end(`now ~ count:${count}`);
  }
  if (request.url === "/leave") {
    count--;
    return response.end(`now ~ count:${count}`);
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
