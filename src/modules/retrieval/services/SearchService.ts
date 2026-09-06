import { EmbeddingService } from "../../ingestion/services/EmbeddingService";
import { LLMService } from "./LLMService";
import { ResumeRepository } from "../repositories/ResumeRepository";
import {
  HybridSearchResult,
  EndToEndSearchResult,
  FinalSearchCandidate,
  SearchCandidate,
  SearchFilters,
  SearchOptions
} from "../types/retrieval.types";
import { mapResumeToCandidate } from "../utils/candidateMapper";
import { mergeCandidates } from "../utils/deduplicate";

export class SearchService {
  constructor(
    private readonly resumeRepository = new ResumeRepository(),
    private readonly embeddingService = new EmbeddingService(),
    private readonly llmService = new LLMService()
  ) {}

  async bm25Search(
    query: string,
    filters: SearchFilters = {},
    topK = 20
  ): Promise<SearchCandidate[]> {
    const resumes = await this.resumeRepository.searchBm25(query, filters, topK);
    return resumes.map((resume) =>
      mapResumeToCandidate(resume, "bm25", resume.bm25Score)
    );
  }

  async vectorSearch(
    query: string,
    filters: SearchFilters = {},
    topK = 20
  ): Promise<SearchCandidate[]> {
    const queryVector = await this.embeddingService.createEmbedding(query);
    const resumes = await this.resumeRepository.searchVector(
      queryVector,
      filters,
      topK
    );

    return resumes.map((resume) =>
      mapResumeToCandidate(resume, "vector", resume.vectorScore)
    );
  }

  async hybridSearch(
    query: string,
    filters: SearchFilters = {},
    topK = 20,
    vectorTopK = topK
  ): Promise<HybridSearchResult> {
    const embeddingStartedAt = Date.now();
    const bm25StartedAt = Date.now();

    const bm25Promise = this.resumeRepository
      .searchBm25(query, filters, topK)
      .then((resumes) => ({
        results: resumes.map((resume) =>
          mapResumeToCandidate(resume, "bm25", resume.bm25Score)
        ),
        durationMs: Date.now() - bm25StartedAt
      }));

    const embeddingPromise = this.embeddingService
      .createEmbedding(query)
      .then((queryVector) => ({
        queryVector,
        durationMs: Date.now() - embeddingStartedAt
      }));

    const [bm25Result, embeddingResult] = await Promise.all([
      bm25Promise,
      embeddingPromise
    ]);
    const vectorStartedAt = Date.now();
    const vectorResumes = await this.resumeRepository.searchVector(
      embeddingResult.queryVector,
      filters,
      vectorTopK
    );

    return {
      bm25: bm25Result.results,
      vector: vectorResumes.map((resume) =>
        mapResumeToCandidate(resume, "vector", resume.vectorScore)
      ),
      timings: {
        bm25Ms: bm25Result.durationMs,
        embeddingMs: embeddingResult.durationMs,
        vectorMs: Date.now() - vectorStartedAt
      }
    };
  }

  async endToEndSearch(
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<EndToEndSearchResult> {
    const startedAt = Date.now();
    const warnings: string[] = [];
    const bm25StartedAt = Date.now();
    const embeddingStartedAt = Date.now();
    const bm25Promise = this.bm25Search(
      query,
      filters,
      options.bm25TopK ?? 20
    ).catch(() => {
      warnings.push("BM25_SEARCH_FAILED");
      return [];
    });
    const embeddingPromise = this.embeddingService
      .createEmbedding(query)
      .catch(() => {
        warnings.push("VECTOR_SEARCH_FAILED");
        return null;
      });
    const [bm25, queryVector] = await Promise.all([bm25Promise, embeddingPromise]);
    const bm25Ms = Date.now() - bm25StartedAt;
    const embeddingMs = Date.now() - embeddingStartedAt;
    const vectorStartedAt = Date.now();
    let vector: SearchCandidate[] = [];

    if (queryVector) {
      try {
        const resumes = await this.resumeRepository.searchVector(
          queryVector,
          filters,
          options.vectorTopK ?? 20
        );
        vector = resumes.map((resume) =>
          mapResumeToCandidate(resume, "vector", resume.vectorScore)
        );
      } catch {
        warnings.push("VECTOR_SEARCH_FAILED");
      }
    }

    if (bm25.length === 0 && vector.length === 0) {
      const error = new Error("No retrieval strategy is currently available") as Error & {
        code?: string;
      };
      error.code = "SEARCH_UNAVAILABLE";
      throw error;
    }

    const mergedCandidates = mergeCandidates(bm25, vector);
    const rerankStartedAt = Date.now();
    let reranked: FinalSearchCandidate[];
    try {
      reranked = await this.llmService.rerankCandidates(
        query,
        mergedCandidates,
        options.rerankTopN ?? 10
      );
    } catch {
      warnings.push("LLM_RERANK_FAILED");
      reranked = mergedCandidates
        .slice(0, options.rerankTopN ?? 10)
        .map((candidate, index) => ({
          ...candidate,
          rank: index + 1,
          relevanceScore: 0,
          reason: "Fallback ordering: BM25 results followed by vector results"
        }));
    }

    const finalCandidates: FinalSearchCandidate[] = reranked.slice(
      0,
      options.finalTopK ?? 5
    );
    const rerankMs = Date.now() - rerankStartedAt;
    const summarizeStartedAt = Date.now();

    if (options.summarize) {
      await Promise.all(finalCandidates.map(async (candidate) => {
        try {
          candidate.summary = await this.llmService.summarizeCandidateFit(
            query,
            candidate,
            { style: options.summaryStyle ?? "short", maxTokens: 150 }
          );
        } catch {
          warnings.push("SUMMARIZATION_FAILED");
        }
      }));
    }

    return {
      results: finalCandidates,
      degraded: warnings.length > 0,
      warnings: [...new Set(warnings)],
      timings: {
        embeddingMs,
        bm25Ms,
        vectorMs: Date.now() - vectorStartedAt,
        rerankMs,
        summarizeMs: options.summarize ? Date.now() - summarizeStartedAt : 0,
        totalMs: Date.now() - startedAt
      }
    };
  }
}
