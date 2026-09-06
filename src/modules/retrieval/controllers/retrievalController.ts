import { RequestHandler } from "express";
import { env } from "../../../config/env";
import { EmbeddingService } from "../../ingestion/services/EmbeddingService";
import { SearchFilters } from "../types/retrieval.types";
import { SearchService } from "../services/SearchService";
import { RetrievalValidationService } from "../services/RetrievalValidationService";

const retrievalValidationService = new RetrievalValidationService();
const embeddingService = new EmbeddingService();
const searchService = new SearchService();

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

function sendSearchError(
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

export const searchBm25: RequestHandler = async (request, response) => {
  const { query, topK, filters } = request.body as {
    query?: unknown;
    topK?: unknown;
    filters?: unknown;
  };

  if (typeof query !== "string" || query.trim().length === 0) {
    sendSearchError(
      response,
      400,
      "INVALID_SEARCH_QUERY",
      "Search query is required"
    );
    return;
  }

  if (
    topK !== undefined &&
    (typeof topK !== "number" || !Number.isInteger(topK) || topK < 1 || topK > 100)
  ) {
    sendSearchError(
      response,
      400,
      "INVALID_SEARCH_OPTIONS",
      "topK must be an integer between 1 and 100"
    );
    return;
  }

  const searchFilters = filters ?? {};
  if (
    typeof searchFilters !== "object" ||
    searchFilters === null ||
    Array.isArray(searchFilters) ||
    ("minYearsExperience" in searchFilters &&
      (typeof searchFilters.minYearsExperience !== "number" ||
        !Number.isFinite(searchFilters.minYearsExperience) ||
        searchFilters.minYearsExperience < 0))
  ) {
    sendSearchError(
      response,
      400,
      "INVALID_SEARCH_FILTERS",
      "minYearsExperience must be a non-negative number"
    );
    return;
  }

  try {
    const results = await searchService.bm25Search(
      query.trim(),
      searchFilters as SearchFilters,
      typeof topK === "number" ? topK : 20
    );

    response.status(200).json({
      mode: "bm25",
      query: query.trim(),
      count: results.length,
      results: results.map(({ bm25Score, ...candidate }) => ({
        ...candidate,
        score: bm25Score
      }))
    });
  } catch (error) {
    console.error(error);
    sendSearchError(response, 503, "BM25_SEARCH_FAILED", "BM25 search failed");
  }
};

export const searchVector: RequestHandler = async (request, response) => {
  const { query, topK, filters } = request.body as {
    query?: unknown;
    topK?: unknown;
    filters?: unknown;
  };

  if (typeof query !== "string" || query.trim().length === 0) {
    sendSearchError(
      response,
      400,
      "INVALID_SEARCH_QUERY",
      "Search query is required"
    );
    return;
  }

  if (
    topK !== undefined &&
    (typeof topK !== "number" || !Number.isInteger(topK) || topK < 1 || topK > 100)
  ) {
    sendSearchError(
      response,
      400,
      "INVALID_SEARCH_OPTIONS",
      "topK must be an integer between 1 and 100"
    );
    return;
  }

  const searchFilters = filters ?? {};
  if (
    typeof searchFilters !== "object" ||
    searchFilters === null ||
    Array.isArray(searchFilters) ||
    ("minYearsExperience" in searchFilters &&
      (typeof searchFilters.minYearsExperience !== "number" ||
        !Number.isFinite(searchFilters.minYearsExperience) ||
        searchFilters.minYearsExperience < 0))
  ) {
    sendSearchError(
      response,
      400,
      "INVALID_SEARCH_FILTERS",
      "minYearsExperience must be a non-negative number"
    );
    return;
  }

  try {
    const results = await searchService.vectorSearch(
      query.trim(),
      searchFilters as SearchFilters,
      typeof topK === "number" ? topK : 20
    );

    response.status(200).json({
      mode: "vector",
      query: query.trim(),
      count: results.length,
      results
    });
  } catch (error) {
    console.error(error);
    sendSearchError(
      response,
      503,
      "VECTOR_SEARCH_FAILED",
      "Vector search failed"
    );
  }
};
