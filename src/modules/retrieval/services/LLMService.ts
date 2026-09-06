import { SearchCandidate } from "../types/retrieval.types";

export class LLMService {
  async rerankCandidates(
    _query: string,
    _candidates: SearchCandidate[],
    _topK: number
  ): Promise<SearchCandidate[]> {
    throw new Error("LLM re-ranking is not implemented yet");
  }
}
