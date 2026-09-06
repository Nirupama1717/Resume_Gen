import { EmbeddingService } from "../../ingestion/services/EmbeddingService";
import { ResumeRepository } from "../repositories/ResumeRepository";
import {
  HybridSearchResult,
  SearchCandidate,
  SearchFilters
} from "../types/retrieval.types";
import { mapResumeToCandidate } from "../utils/candidateMapper";

export class SearchService {
  constructor(
    private readonly resumeRepository = new ResumeRepository(),
    private readonly embeddingService = new EmbeddingService()
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
    topK = 20
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
      topK
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
}
