import { SearchCandidate, SearchFilters } from "../types/retrieval.types";

export class SearchService {
  async bm25Search(
    _query: string,
    _filters: SearchFilters = {},
    _topK = 20
  ): Promise<SearchCandidate[]> {
    throw new Error("BM25 search is not implemented yet");
  }

  async vectorSearch(
    _query: string,
    _filters: SearchFilters = {},
    _topK = 20
  ): Promise<SearchCandidate[]> {
    throw new Error("Vector search is not implemented yet");
  }
}
