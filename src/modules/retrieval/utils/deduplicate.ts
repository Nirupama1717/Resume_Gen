import { SearchCandidate } from "../types/retrieval.types";

export function deduplicateCandidates(
  candidates: SearchCandidate[]
): SearchCandidate[] {
  const candidatesByResumeId = new Map<string, SearchCandidate>();

  for (const candidate of candidates) {
    const existingCandidate = candidatesByResumeId.get(candidate.resumeId);

    if (!existingCandidate) {
      candidatesByResumeId.set(candidate.resumeId, {
        ...candidate,
        sources: [...candidate.sources]
      });
      continue;
    }

    candidatesByResumeId.set(candidate.resumeId, {
      ...existingCandidate,
      ...candidate,
      sources: [...new Set([...existingCandidate.sources, ...candidate.sources])]
    });
  }

  return [...candidatesByResumeId.values()];
}
