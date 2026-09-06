import { ResumeRepository } from "../repositories/ResumeRepository";
import { SearchCandidate, SearchFilters } from "../types/retrieval.types";
import { mapResumeToCandidate } from "../utils/candidateMapper";

export class SearchService {
  constructor(private readonly resumeRepository = new ResumeRepository()) {}

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
    _query: string,
    _filters: SearchFilters = {},
    _topK = 20
  ): Promise<SearchCandidate[]> {
    throw new Error("Vector search is not implemented yet");
  }
}
