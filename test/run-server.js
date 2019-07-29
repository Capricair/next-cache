const Server = require("../src/server/index");

process.env.NODE_ENV = "production";

const server = new Server({
    accessLog: true,
});
server.start();