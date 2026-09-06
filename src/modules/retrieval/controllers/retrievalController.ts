import { RequestHandler } from "express";
import { env } from "../../../config/env";
import { EmbeddingService } from "../../ingestion/services/EmbeddingService";
import {
  RerankedCandidate,
  SearchCandidate,
  SearchFilters,
  SearchOptions
} from "../types/retrieval.types";
import { LLMService } from "../services/LLMService";
import { SearchService } from "../services/SearchService";
import { RetrievalValidationService } from "../services/RetrievalValidationService";

const retrievalValidationService = new RetrievalValidationService();
const embeddingService = new EmbeddingService();
const searchService = new SearchService();
const llmService = new LLMService();

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

export const searchHybrid: RequestHandler = async (request, response) => {
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
    const result = await searchService.hybridSearch(
      query.trim(),
      searchFilters as SearchFilters,
      typeof topK === "number" ? topK : 20
    );

    response.status(200).json({
      mode: "hybrid-debug",
      query: query.trim(),
      bm25: result.bm25,
      vector: result.vector,
      timings: result.timings
    });
  } catch (error) {
    console.error(error);
    sendSearchError(response, 503, "HYBRID_SEARCH_FAILED", "Hybrid search failed");
  }
};

export const rerankSearchCandidates: RequestHandler = async (
  request,
  response
) => {
  const { query, candidates, topK } = request.body as {
    query?: unknown;
    candidates?: unknown;
    topK?: unknown;
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
    !Array.isArray(candidates) ||
    candidates.length === 0 ||
    candidates.length > 100
  ) {
    sendSearchError(
      response,
      400,
      "INVALID_RERANK_CANDIDATES",
      "candidates must be a non-empty array with at most 100 items"
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

  const normalizedCandidates: SearchCandidate[] = [];
  for (const candidate of candidates) {
    if (!isRerankCandidate(candidate)) {
      sendSearchError(
        response,
        400,
        "INVALID_RERANK_CANDIDATES",
        "Each candidate must include a non-empty resumeId and snippet"
      );
      return;
    }

    normalizedCandidates.push({
      resumeId: candidate.resumeId,
      snippet: candidate.snippet,
      name: typeof candidate.name === "string" ? candidate.name : undefined,
      role: typeof candidate.role === "string" ? candidate.role : undefined,
      company:
        typeof candidate.company === "string" ? candidate.company : undefined,
      skills: Array.isArray(candidate.skills)
        ? candidate.skills.filter((skill): skill is string => typeof skill === "string")
        : undefined,
      sources: Array.isArray(candidate.sources)
        ? candidate.sources.filter(
            (source): source is "bm25" | "vector" =>
              source === "bm25" || source === "vector"
          )
        : []
    });
  }

  try {
    const results = await llmService.rerankCandidates(
      query.trim(),
      normalizedCandidates,
      typeof topK === "number" ? topK : 10
    );

    response.status(200).json({
      results,
      model: env.groqModel
    });
  } catch (error) {
    console.error(error);
    sendSearchError(response, 503, "RERANK_FAILED", "Candidate re-ranking failed");
  }
};

export const summarizeSearchCandidate: RequestHandler = async (
  request,
  response
) => {
  const { query, candidate, style, maxTokens } = request.body as {
    query?: unknown;
    candidate?: unknown;
    style?: unknown;
    maxTokens?: unknown;
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

  if (!isRerankCandidate(candidate)) {
    sendSearchError(
      response,
      400,
      "INVALID_SUMMARY_CANDIDATE",
      "candidate must include a non-empty resumeId and snippet"
    );
    return;
  }

  if (style !== undefined && style !== "short" && style !== "detailed") {
    sendSearchError(
      response,
      400,
      "INVALID_SUMMARY_OPTIONS",
      "style must be short or detailed"
    );
    return;
  }

  if (
    maxTokens !== undefined &&
    (typeof maxTokens !== "number" ||
      !Number.isInteger(maxTokens) ||
      maxTokens < 1 ||
      maxTokens > 1000)
  ) {
    sendSearchError(
      response,
      400,
      "INVALID_SUMMARY_OPTIONS",
      "maxTokens must be an integer between 1 and 1000"
    );
    return;
  }

  const normalizedCandidate: SearchCandidate = {
    resumeId: candidate.resumeId,
    snippet: candidate.snippet,
    name: typeof candidate.name === "string" ? candidate.name : undefined,
    role: typeof candidate.role === "string" ? candidate.role : undefined,
    company:
      typeof candidate.company === "string" ? candidate.company : undefined,
    skills: Array.isArray(candidate.skills)
      ? candidate.skills.filter((skill): skill is string => typeof skill === "string")
      : undefined,
    sources: Array.isArray(candidate.sources)
      ? candidate.sources.filter(
          (source): source is "bm25" | "vector" =>
            source === "bm25" || source === "vector"
        )
      : []
  };

  try {
    const summary = await llmService.summarizeCandidateFit(
      query.trim(),
      normalizedCandidate,
      {
        style: style === "detailed" ? "detailed" : "short",
        maxTokens: typeof maxTokens === "number" ? maxTokens : 150
      }
    );

    response.status(200).json({
      resumeId: normalizedCandidate.resumeId,
      summary
    });
  } catch (error) {
    console.error(error);
    sendSearchError(response, 503, "SUMMARIZATION_FAILED", "Candidate summarization failed");
  }
};

export const endToEndSearch: RequestHandler = async (request, response) => {
  const { query, filters, options } = request.body as {
    query?: unknown;
    filters?: unknown;
    options?: unknown;
  };

  if (typeof query !== "string" || query.trim().length === 0) {
    sendSearchError(response, 400, "INVALID_SEARCH_QUERY", "Search query is required");
    return;
  }

  if (!isValidSearchFilters(filters)) {
    sendSearchError(
      response,
      400,
      "INVALID_SEARCH_FILTERS",
      "minYearsExperience must be a non-negative number"
    );
    return;
  }

  if (!isValidEndToEndOptions(options)) {
    sendSearchError(response, 400, "INVALID_SEARCH_OPTIONS", "Search options are invalid");
    return;
  }

  try {
    const result = await searchService.endToEndSearch(
      query.trim(),
      (filters ?? {}) as SearchFilters,
      (options ?? {}) as SearchOptions
    );

    response.status(200).json({
      query: query.trim(),
      results: result.results.map((candidate, index) => ({
        rank: index + 1,
        resumeId: candidate.resumeId,
        name: candidate.name,
        role: candidate.role,
        company: candidate.company,
        totalExperience: candidate.totalExperience,
        skills: candidate.skills,
        snippet: candidate.snippet,
        sources: candidate.sources,
        bm25Score: candidate.bm25Score,
        vectorScore: candidate.vectorScore,
        relevanceScore: candidate.relevanceScore,
        reason: candidate.reason,
        ...(candidate.summary ? { summary: candidate.summary } : {})
      })),
      degraded: false,
      warnings: [],
      timings: result.timings
    });
  } catch (error) {
    console.error(error);
    sendSearchError(response, 503, "SEARCH_FAILED", "End-to-end search failed");
  }
};

function isValidSearchFilters(filters: unknown): boolean {
  if (filters === undefined) {
    return true;
  }
  if (typeof filters !== "object" || filters === null || Array.isArray(filters)) {
    return false;
  }

  const value = filters as { minYearsExperience?: unknown };
  return (
    value.minYearsExperience === undefined ||
    (typeof value.minYearsExperience === "number" &&
      Number.isFinite(value.minYearsExperience) &&
      value.minYearsExperience >= 0)
  );
}

function isValidEndToEndOptions(options: unknown): boolean {
  if (options === undefined) {
    return true;
  }
  if (typeof options !== "object" || options === null || Array.isArray(options)) {
    return false;
  }

  const value = options as Record<string, unknown>;
  const limits = ["bm25TopK", "vectorTopK", "rerankTopN", "finalTopK"];
  if (
    limits.some(
      (key) =>
        value[key] !== undefined &&
        (typeof value[key] !== "number" ||
          !Number.isInteger(value[key]) ||
          value[key] < 1 ||
          value[key] > 100)
    )
  ) {
    return false;
  }

  return (
    (value.summarize === undefined || typeof value.summarize === "boolean") &&
    (value.summaryStyle === undefined ||
      value.summaryStyle === "short" ||
      value.summaryStyle === "detailed")
  );
}

function isRerankCandidate(
  candidate: unknown
): candidate is { resumeId: string; snippet: string; [key: string]: unknown } {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return false;
  }

  const value = candidate as { resumeId?: unknown; snippet?: unknown };
  return (
    typeof value.resumeId === "string" &&
    value.resumeId.trim().length > 0 &&
    typeof value.snippet === "string" &&
    value.snippet.trim().length > 0
  );
}
