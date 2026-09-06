import { EmbeddingService } from "../../ingestion/services/EmbeddingService";
import { ResumeRepository } from "../repositories/ResumeRepository";
import { SearchCandidate, SearchFilters } from "../types/retrieval.types";
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
}
