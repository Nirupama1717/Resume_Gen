import express from "express";
import request from "supertest";
import { loggerMiddleware } from "../src/middleware/logger";
import { requestIdMiddleware } from "../src/middleware/requestId";

describe("request logger", () => {
  test("logs retrieval component timings and warnings without payload data", async () => {
    const app = express();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    app.use(requestIdMiddleware);
    app.use(loggerMiddleware);
    app.post("/search", (_request, response) => {
      response.locals.retrievalTimings = {
        embeddingMs: 10,
        bm25Ms: 20,
        vectorMs: 30,
        rerankMs: 40,
        summarizeMs: 50,
        totalMs: 150
      };
      response.locals.retrievalWarnings = ["LLM_RERANK_FAILED"];
      response.status(200).json({ resumeText: "private resume content" });
    });

    await request(app)
      .post("/search")
      .set("x-request-id", "request-123")
      .send({ resumeText: "private resume content" });

    const logEntry = JSON.parse(logSpy.mock.calls[0][0] as string) as Record<
      string,
      unknown
    >;
    expect(logEntry).toMatchObject({
      requestId: "request-123",
      endpoint: "/search",
      statusCode: 200,
      componentTimings: {
        embeddingMs: 10,
        bm25Ms: 20,
        vectorMs: 30,
        rerankMs: 40,
        summarizeMs: 50,
        totalMs: 150
      },
      warnings: ["LLM_RERANK_FAILED"]
    });
    expect(logEntry.resumeText).toBeUndefined();
    expect(logEntry.private).toBeUndefined();

    logSpy.mockRestore();
  });
});
