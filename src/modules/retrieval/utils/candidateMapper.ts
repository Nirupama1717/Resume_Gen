import { SearchCandidate } from "../types/retrieval.types";

export interface ResumeSearchDocument {
  _id: { toString(): string };
  name?: string;
  role?: string;
  company?: string;
  totalExperience?: number;
  skills?: string[];
  experienceSummary?: string;
}

export function mapResumeToCandidate(
  resume: ResumeSearchDocument,
  source: "bm25" | "vector",
  score?: number
): SearchCandidate {
  return {
    resumeId: resume._id.toString(),
    name: resume.name,
    role: resume.role,
    company: resume.company,
    totalExperience: resume.totalExperience,
    skills: resume.skills,
    snippet: resume.experienceSummary,
    ...(source === "bm25" ? { bm25Score: score } : { vectorScore: score }),
    sources: [source]
  };
}
