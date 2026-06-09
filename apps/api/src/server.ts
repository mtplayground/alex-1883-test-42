import { createServer } from "node:http";

import { createApp } from "./app.js";
import { getAppConfig } from "./config.js";

const config = getAppConfig();
const app = createApp();
const server = createServer(app);

server.listen(config.port, config.host, () => {
  console.log(`API server listening on http://${config.host}:${config.port}`);
});

function shutdown(signal: NodeJS.Signals) {
  console.log(`Received ${signal}; shutting down API server.`);
  server.close((error) => {
    if (error) {
      console.error("Error while closing API server", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      process.exitCode = 1;
    }
    process.exit();
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
