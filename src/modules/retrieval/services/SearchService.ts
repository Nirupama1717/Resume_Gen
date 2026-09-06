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
    const hybrid = await this.hybridSearch(
      query,
      filters,
      options.bm25TopK ?? 20,
      options.vectorTopK ?? 20
    );
    const mergedCandidates = mergeCandidates(hybrid.bm25, hybrid.vector);
    const rerankStartedAt = Date.now();
    const reranked = await this.llmService.rerankCandidates(
      query,
      mergedCandidates,
      options.rerankTopN ?? 10
    );
    const finalCandidates: FinalSearchCandidate[] = reranked.slice(
      0,
      options.finalTopK ?? 5
    );
    const rerankMs = Date.now() - rerankStartedAt;
    const summarizeStartedAt = Date.now();

    if (options.summarize) {
      await Promise.all(
        finalCandidates.map(async (candidate) => {
          candidate.summary = await this.llmService.summarizeCandidateFit(
            query,
            candidate,
            {
              style: options.summaryStyle ?? "short",
              maxTokens: 150
            }
          );
        })
      );
    }

    return {
      results: finalCandidates,
      timings: {
        embeddingMs: hybrid.timings.embeddingMs,
        bm25Ms: hybrid.timings.bm25Ms,
        vectorMs: hybrid.timings.vectorMs,
        rerankMs,
        summarizeMs: options.summarize ? Date.now() - summarizeStartedAt : 0,
        totalMs: Date.now() - startedAt
      }
    };
  }
}
