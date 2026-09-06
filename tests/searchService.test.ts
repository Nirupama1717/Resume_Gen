import { SearchService } from "../src/modules/retrieval/services/SearchService";

describe("SearchService", () => {
  test("normalizes BM25 repository documents without embedding the query", async () => {
    const resumeRepository = {
      searchBm25: jest.fn().mockResolvedValue([
        {
          _id: { toString: () => "resume-1" },
          name: "Rajesh",
          role: "Test Architect",
          bm25Score: 8.41
        }
      ]),
      searchVector: jest.fn()
    };
    const embeddingService = { createEmbedding: jest.fn() };
    const service = new SearchService(
      resumeRepository as never,
      embeddingService as never
    );

    const results = await service.bm25Search(
      "agentic QA",
      { minYearsExperience: 10 },
      5
    );

    expect(results).toEqual([
      {
        resumeId: "resume-1",
        name: "Rajesh",
        role: "Test Architect",
        bm25Score: 8.41,
        sources: ["bm25"]
      }
    ]);
    expect(resumeRepository.searchBm25).toHaveBeenCalledWith(
      "agentic QA",
      { minYearsExperience: 10 },
      5
    );
    expect(embeddingService.createEmbedding).not.toHaveBeenCalled();
  });

  test("embeds the query before normalizing vector repository documents", async () => {
    const queryVector = [0.1, 0.2];
    const resumeRepository = {
      searchBm25: jest.fn(),
      searchVector: jest.fn().mockResolvedValue([
        {
          _id: { toString: () => "resume-2" },
          name: "Priya",
          vectorScore: 0.91
        }
      ])
    };
    const embeddingService = {
      createEmbedding: jest.fn().mockResolvedValue(queryVector)
    };
    const service = new SearchService(
      resumeRepository as never,
      embeddingService as never
    );

    const results = await service.vectorSearch("semantic QA", {}, 7);

    expect(results).toEqual([
      {
        resumeId: "resume-2",
        name: "Priya",
        vectorScore: 0.91,
        sources: ["vector"]
      }
    ]);
    expect(embeddingService.createEmbedding).toHaveBeenCalledWith("semantic QA");
    expect(resumeRepository.searchVector).toHaveBeenCalledWith(
      queryVector,
      {},
      7
    );
  });
});
