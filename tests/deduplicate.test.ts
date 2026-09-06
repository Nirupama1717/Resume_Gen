import {
  deduplicateCandidates,
  mergeCandidates
} from "../src/modules/retrieval/utils/deduplicate";
import { SearchCandidate } from "../src/modules/retrieval/types/retrieval.types";

function candidate(
  values: Partial<SearchCandidate> & Pick<SearchCandidate, "resumeId" | "sources">
): SearchCandidate {
  return values;
}

describe("candidate deduplication", () => {
  test("merges BM25 and vector candidates by resumeId", () => {
    const merged = mergeCandidates(
      [
        candidate({
          resumeId: "resume-a",
          name: "Rajesh",
          role: "Test Architect",
          skills: ["RAG"],
          bm25Score: 8.4,
          sources: ["bm25"]
        }),
        candidate({ resumeId: "resume-b", sources: ["bm25"] })
      ],
      [
        candidate({
          resumeId: "resume-a",
          skills: ["MCP"],
          vectorScore: 0.88,
          sources: ["vector"]
        }),
        candidate({ resumeId: "resume-c", sources: ["vector"] })
      ]
    );

    expect(merged).toEqual([
      expect.objectContaining({
        resumeId: "resume-a",
        name: "Rajesh",
        role: "Test Architect",
        skills: ["RAG", "MCP"],
        bm25Score: 8.4,
        vectorScore: 0.88,
        sources: ["bm25", "vector"]
      }),
      expect.objectContaining({ resumeId: "resume-b", sources: ["bm25"] }),
      expect.objectContaining({ resumeId: "resume-c", sources: ["vector"] })
    ]);
    expect(merged).toHaveLength(3);
  });

  test("does not let undefined incoming metadata erase existing data", () => {
    const deduplicated = deduplicateCandidates([
      candidate({
        resumeId: "resume-a",
        name: "Rajesh",
        company: "Testleaf",
        snippet: "Experienced QA architect",
        sources: ["bm25"]
      }),
      candidate({ resumeId: "resume-a", sources: ["vector"] })
    ]);

    expect(deduplicated).toEqual([
      expect.objectContaining({
        resumeId: "resume-a",
        name: "Rajesh",
        company: "Testleaf",
        snippet: "Experienced QA architect",
        sources: ["bm25", "vector"]
      })
    ]);
  });
});
