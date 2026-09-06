import { NextFunction, Request, Response } from "express";

interface IngestionTimings {
  extractMs?: number;
  cleanMs?: number;
  parseMs?: number;
  embeddingMs?: number;
  mongoInsertMs?: number;
  totalMs?: number;
}

interface RetrievalTimings {
  embeddingMs: number;
  bm25Ms: number;
  vectorMs: number;
  rerankMs: number;
  summarizeMs: number;
  totalMs: number;
}

export function loggerMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  const startedAt = Date.now();

  response.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const timings = response.locals.ingestionTimings as
      | IngestionTimings
      | undefined;
    const retrievalTimings = response.locals.retrievalTimings as
      | RetrievalTimings
      | undefined;
    const retrievalWarnings = response.locals.retrievalWarnings as
      | string[]
      | undefined;
    const fileName =
      response.locals.fileName ?? request.file?.originalname;

    console.log(
      JSON.stringify({
        requestId: response.getHeader("x-request-id"),
        method: request.method,
        endpoint: request.originalUrl,
        statusCode: response.statusCode,
        ...(typeof fileName === "string" ? { fileName } : {}),
        ...(retrievalTimings
          ? {
              durationMs,
              componentTimings: retrievalTimings,
              ...(retrievalWarnings?.length
                ? { warnings: retrievalWarnings }
                : {})
            }
          : timings ?? { totalMs: durationMs })
      })
    );
  });

  next();
}
