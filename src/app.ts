import cors from "cors";
import express from "express";
import { checkDatabaseConnection } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { loggerMiddleware } from "./middleware/logger";
import { requestIdMiddleware } from "./middleware/requestId";
import { ingestionRoutes } from "./modules/ingestion/routes/ingestionRoutes";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(requestIdMiddleware);
app.use(loggerMiddleware);

app.get("/v1/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    app: "resume-rag-backend",
    version: "1.0.0",
    uptime: process.uptime()
  });
});

app.get("/v1/health/db", async (_request, response) => {
  try {
    const latencyMs = await checkDatabaseConnection();

    response.status(200).json({
      status: "ok",
      database: "mongodb",
      connected: true,
      latencyMs
    });
  } catch (error) {
    console.error(error);

    response.status(503).json({
      success: false,
      requestId: response.getHeader("x-request-id"),
      database: "mongodb",
      connected: false,
      errorCode: "DB_CONNECTION_FAILED",
      message: "MongoDB connection failed"
    });
  }
});

app.use("/v1", ingestionRoutes);

app.use(errorHandler);
