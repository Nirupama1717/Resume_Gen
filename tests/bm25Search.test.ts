const mockSearchBm25 = jest.fn();

jest.mock("../src/modules/retrieval/repositories/ResumeRepository", () => ({
  ResumeRepository: jest.fn().mockImplementation(() => ({
    searchBm25: mockSearchBm25
  }))
}));

import request from "supertest";
import { app } from "../src/app";

describe("BM25 search API", () => {
  beforeEach(() => {
    mockSearchBm25.mockReset();
  });

  test("returns normalized BM25 candidates", async () => {
    mockSearchBm25.mockResolvedValue([
      {
        _id: { toString: () => "resume-1" },
        name: "Rajesh Mohan Kumar",
        role: "Test Architect",
        company: "Testleaf",
        totalExperience: 13,
        skills: ["RAG", "DeepEval"],
        experienceSummary: "Built enterprise QA systems",
        bm25Score: 8.41
      }
    ]);

    const response = await request(app)
      .post("/v1/search/bm25")
      .send({
        query: "agentic QA architect",
        topK: 10,
        filters: { minYearsExperience: 10 }
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      mode: "bm25",
      query: "agentic QA architect",
      count: 1,
      results: [
        {
          resumeId: "resume-1",
          name: "Rajesh Mohan Kumar",
          role: "Test Architect",
          company: "Testleaf",
          totalExperience: 13,
          skills: ["RAG", "DeepEval"],
          snippet: "Built enterprise QA systems",
          sources: ["bm25"],
          score: 8.41
        }
      ]
    });
    expect(mockSearchBm25).toHaveBeenCalledWith(
      "agentic QA architect",
      { minYearsExperience: 10 },
      10
    );
  });

  test("rejects an empty query before repository access", async () => {
    const response = await request(app)
      .post("/v1/search/bm25")
      .send({ query: "   " });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_SEARCH_QUERY");
    expect(mockSearchBm25).not.toHaveBeenCalled();
  });

  test("rejects invalid topK and filters", async () => {
    const topKResponse = await request(app)
      .post("/v1/search/bm25")
      .send({ query: "RAG", topK: 101 });
    const filtersResponse = await request(app)
      .post("/v1/search/bm25")
      .send({ query: "RAG", filters: { minYearsExperience: -1 } });

    expect(topKResponse.status).toBe(400);
    expect(topKResponse.body.errorCode).toBe("INVALID_SEARCH_OPTIONS");
    expect(filtersResponse.status).toBe(400);
    expect(filtersResponse.body.errorCode).toBe("INVALID_SEARCH_FILTERS");
    expect(mockSearchBm25).not.toHaveBeenCalled();
  });

  test("returns a controlled failure when BM25 search fails", async () => {
    mockSearchBm25.mockRejectedValue(new Error("Atlas Search unavailable"));

    const response = await request(app)
      .post("/v1/search/bm25")
      .send({ query: "RAG" });

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      success: false,
      errorCode: "BM25_SEARCH_FAILED",
      message: "BM25 search failed"
    });
  });
});
