export type SearchSource = "bm25" | "vector";

export interface SearchFilters {
  minYearsExperience?: number;
}

export interface SearchCandidate {
  resumeId: string;
  name?: string;
  role?: string;
  company?: string;
  totalExperience?: number;
  skills?: string[];
  snippet?: string;
  bm25Score?: number;
  vectorScore?: number;
  sources: SearchSource[];
}

export interface RerankedCandidate extends SearchCandidate {
  rank: number;
  relevanceScore: number;
  reason: string;
}

export interface SummaryOptions {
  style: "short" | "detailed";
  maxTokens: number;
}

export interface SearchOptions {
  bm25TopK?: number;
  vectorTopK?: number;
  rerankTopN?: number;
  finalTopK?: number;
  summarize?: boolean;
  summaryStyle?: "short" | "detailed";
}

export interface HybridSearchResult {
  bm25: SearchCandidate[];
  vector: SearchCandidate[];
  timings: {
    bm25Ms: number;
    embeddingMs: number;
    vectorMs: number;
  };
}
