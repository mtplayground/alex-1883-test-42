import cors from "cors";
import express from "express";
import morgan from "morgan";

import { getServerConfig } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.js";

export function createApp() {
  const config = getServerConfig();
  const app = express();

  app.disable("x-powered-by");
  app.use(morgan("combined"));
  app.use(
    cors({
      origin: config.corsOrigins.length > 0 ? config.corsOrigins : true
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
