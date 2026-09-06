import { RequestHandler } from "express";
import { env } from "../../../config/env";
import { EmbeddingService } from "../../ingestion/services/EmbeddingService";
import { RetrievalValidationService } from "../services/RetrievalValidationService";

const retrievalValidationService = new RetrievalValidationService();
const embeddingService = new EmbeddingService();

function sendEmbeddingError(
  response: Parameters<RequestHandler>[1],
  statusCode: number,
  errorCode: string,
  message: string
): void {
  response.status(statusCode).json({
    success: false,
    requestId: response.getHeader("x-request-id"),
    errorCode,
    message
  });
}

export const getRetrievalReadiness: RequestHandler = async (_request, response) => {
  try {
    const readiness = await retrievalValidationService.checkReadiness();
    response.status(readiness.ready ? 200 : 503).json(readiness);
  } catch (error) {
    console.error(error);

    response.status(503).json({
      success: false,
      requestId: response.getHeader("x-request-id"),
      ready: false,
      errorCode: "READINESS_CHECK_FAILED",
      message: "Retrieval readiness check failed"
    });
  }
};

export const createQueryEmbedding: RequestHandler = async (request, response) => {
  const { model, input } = request.body as {
    model?: unknown;
    input?: unknown;
  };

  if (
    typeof input !== "string" ||
    input.trim().length === 0 ||
    (model !== undefined && model !== env.mistralEmbedModel)
  ) {
    sendEmbeddingError(
      response,
      400,
      "EMBEDDING_INPUT_INVALID",
      `input is required and model must be ${env.mistralEmbedModel}`
    );
    return;
  }

  try {
    const embedding = await embeddingService.createEmbedding(input.trim());

    response.status(200).json({
      embedding,
      model: env.mistralEmbedModel,
      dimension: embedding.length
    });
  } catch (error) {
    console.error(error);
    sendEmbeddingError(
      response,
      502,
      "EMBEDDING_FAILED",
      "Mistral embedding failed"
    );
  }
};
