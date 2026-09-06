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

    candidatesByResumeId.set(candidate.resumeId, mergeCandidate(existingCandidate, candidate));
  }

  return [...candidatesByResumeId.values()];
}

export function mergeCandidates(
  bm25Candidates: SearchCandidate[],
  vectorCandidates: SearchCandidate[]
): SearchCandidate[] {
  return deduplicateCandidates([...bm25Candidates, ...vectorCandidates]);
}

function mergeCandidate(
  existingCandidate: SearchCandidate,
  incomingCandidate: SearchCandidate
): SearchCandidate {
  return {
    ...existingCandidate,
    ...incomingCandidate,
    name: incomingCandidate.name ?? existingCandidate.name,
    role: incomingCandidate.role ?? existingCandidate.role,
    company: incomingCandidate.company ?? existingCandidate.company,
    totalExperience:
      incomingCandidate.totalExperience ?? existingCandidate.totalExperience,
    skills: mergeSkills(existingCandidate.skills, incomingCandidate.skills),
    snippet: incomingCandidate.snippet ?? existingCandidate.snippet,
    bm25Score: incomingCandidate.bm25Score ?? existingCandidate.bm25Score,
    vectorScore: incomingCandidate.vectorScore ?? existingCandidate.vectorScore,
    sources: [...new Set([...existingCandidate.sources, ...incomingCandidate.sources])]
  };
}

function mergeSkills(
  existingSkills: string[] | undefined,
  incomingSkills: string[] | undefined
): string[] | undefined {
  if (!existingSkills && !incomingSkills) {
    return undefined;
  }

  return [...new Set([...(existingSkills ?? []), ...(incomingSkills ?? [])])];
}
