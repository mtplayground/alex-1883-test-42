import cors from "cors";
import express from "express";
import morgan from "morgan";

import { getAppConfig } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.js";
import { createRunRouter } from "./routes/run.js";

export function createApp() {
  const config = getAppConfig();
  const app = express();
  const corsOrigin =
    config.allowedOrigins.length === 0 || config.allowedOrigins.includes("*")
      ? true
      : config.allowedOrigins;

  app.disable("x-powered-by");
  app.use(morgan("combined"));
  app.use(
    cors({
      origin: corsOrigin
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRouter);
  app.use("/run", createRunRouter({ config }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
