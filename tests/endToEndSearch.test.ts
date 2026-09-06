const mockSearchBm25 = jest.fn();
const mockSearchVector = jest.fn();
const mockCreateEmbedding = jest.fn();
const mockRerankCandidates = jest.fn();
const mockSummarizeCandidateFit = jest.fn();

jest.mock("../src/modules/retrieval/repositories/ResumeRepository", () => ({
  ResumeRepository: jest.fn().mockImplementation(() => ({
    searchBm25: mockSearchBm25,
    searchVector: mockSearchVector
  }))
}));

jest.mock("../src/modules/ingestion/services/EmbeddingService", () => ({
  EmbeddingService: jest.fn().mockImplementation(() => ({
    createEmbedding: mockCreateEmbedding
  }))
}));

jest.mock("../src/modules/retrieval/services/LLMService", () => ({
  LLMService: jest.fn().mockImplementation(() => ({
    rerankCandidates: mockRerankCandidates,
    summarizeCandidateFit: mockSummarizeCandidateFit
  }))
}));

import request from "supertest";
import { app } from "../src/app";

describe("end-to-end search API", () => {
  beforeEach(() => {
    mockSearchBm25.mockReset();
    mockSearchVector.mockReset();
    mockCreateEmbedding.mockReset();
    mockRerankCandidates.mockReset();
    mockSummarizeCandidateFit.mockReset();
  });

  test("retrieves, merges, reranks, and optionally summarizes candidates", async () => {
    mockSearchBm25.mockResolvedValue([
      {
        _id: { toString: () => "resume-1" },
        name: "Rajesh",
        role: "Test Architect",
        skills: ["RAG"],
        experienceSummary: "RAG architect",
        bm25Score: 8.4
      }
    ]);
    mockCreateEmbedding.mockResolvedValue([0.1, 0.2]);
    mockSearchVector.mockResolvedValue([
      {
        _id: { toString: () => "resume-1" },
        name: "Rajesh",
        skills: ["MCP"],
        vectorScore: 0.88
      }
    ]);
    mockRerankCandidates.mockImplementation(async (_query, candidates) => [
      {
        ...candidates[0],
        rank: 1,
        relevanceScore: 0.96,
        reason: "Strong fit"
      }
    ]);
    mockSummarizeCandidateFit.mockResolvedValue("Strong RAG architecture fit.");

    const response = await request(app)
      .post("/v1/search")
      .send({
        query: "senior RAG architect",
        filters: { minYearsExperience: 10 },
        options: {
          bm25TopK: 20,
          vectorTopK: 20,
          rerankTopN: 10,
          finalTopK: 5,
          summarize: true,
          summaryStyle: "short"
        }
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      query: "senior RAG architect",
      degraded: false,
      warnings: [],
      results: [
        expect.objectContaining({
          rank: 1,
          resumeId: "resume-1",
          bm25Score: 8.4,
          vectorScore: 0.88,
          skills: ["RAG", "MCP"],
          summary: "Strong RAG architecture fit."
        })
      ],
      timings: {
        embeddingMs: expect.any(Number),
        bm25Ms: expect.any(Number),
        vectorMs: expect.any(Number),
        rerankMs: expect.any(Number),
        summarizeMs: expect.any(Number),
        totalMs: expect.any(Number)
      }
    });
    expect(mockRerankCandidates).toHaveBeenCalledWith(
      "senior RAG architect",
      [expect.objectContaining({ resumeId: "resume-1", sources: ["bm25", "vector"] })],
      10
    );
  });

  test("rejects invalid end-to-end options before retrieval", async () => {
    const response = await request(app)
      .post("/v1/search")
      .send({ query: "RAG", options: { finalTopK: 101 } });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_SEARCH_OPTIONS");
    expect(mockSearchBm25).not.toHaveBeenCalled();
    expect(mockCreateEmbedding).not.toHaveBeenCalled();
  });

  test("returns a controlled failure when the pipeline fails", async () => {
    mockSearchBm25.mockRejectedValue(new Error("Atlas unavailable"));
    mockCreateEmbedding.mockResolvedValue([0.1, 0.2]);

    const response = await request(app)
      .post("/v1/search")
      .send({ query: "RAG" });

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      success: false,
      errorCode: "SEARCH_FAILED",
      message: "End-to-end search failed"
    });
  });
});
