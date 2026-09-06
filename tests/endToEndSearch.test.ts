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
    mockCreateEmbedding.mockRejectedValue(new Error("Mistral unavailable"));

    const response = await request(app)
      .post("/v1/search")
      .send({ query: "RAG" });

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      success: false,
      errorCode: "SEARCH_UNAVAILABLE",
      message: "No retrieval strategy is currently available"
    });
  });

  test("falls back to BM25 when vector retrieval fails", async () => {
    mockSearchBm25.mockResolvedValue([
      { _id: { toString: () => "resume-bm25" }, bm25Score: 8 }
    ]);
    mockCreateEmbedding.mockRejectedValue(new Error("Mistral unavailable"));
    mockRerankCandidates.mockResolvedValue([
      {
        resumeId: "resume-bm25",
        sources: ["bm25"],
        bm25Score: 8,
        rank: 1,
        relevanceScore: 0.5,
        reason: "Fallback candidate"
      }
    ]);

    const response = await request(app)
      .post("/v1/search")
      .send({ query: "RAG" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      degraded: true,
      warnings: ["VECTOR_SEARCH_FAILED"],
      results: [expect.objectContaining({ resumeId: "resume-bm25" })]
    });
  });

  test("falls back to vector search when BM25 fails", async () => {
    mockSearchBm25.mockRejectedValue(new Error("Atlas unavailable"));
    mockCreateEmbedding.mockResolvedValue([0.1, 0.2]);
    mockSearchVector.mockResolvedValue([
      { _id: { toString: () => "resume-vector" }, vectorScore: 0.9 }
    ]);
    mockRerankCandidates.mockResolvedValue([
      {
        resumeId: "resume-vector",
        sources: ["vector"],
        vectorScore: 0.9,
        rank: 1,
        relevanceScore: 0.5,
        reason: "Fallback candidate"
      }
    ]);

    const response = await request(app)
      .post("/v1/search")
      .send({ query: "RAG" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      degraded: true,
      warnings: ["BM25_SEARCH_FAILED"],
      results: [expect.objectContaining({ resumeId: "resume-vector" })]
    });
  });

  test("uses BM25-first ordering when reranking fails", async () => {
    mockSearchBm25.mockResolvedValue([
      { _id: { toString: () => "resume-bm25" }, bm25Score: 8 }
    ]);
    mockCreateEmbedding.mockResolvedValue([0.1, 0.2]);
    mockSearchVector.mockResolvedValue([
      { _id: { toString: () => "resume-vector" }, vectorScore: 0.9 }
    ]);
    mockRerankCandidates.mockRejectedValue(new Error("Groq unavailable"));

    const response = await request(app)
      .post("/v1/search")
      .send({ query: "RAG", options: { finalTopK: 2 } });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      degraded: true,
      warnings: ["LLM_RERANK_FAILED"],
      results: [
        expect.objectContaining({ resumeId: "resume-bm25", rank: 1 }),
        expect.objectContaining({ resumeId: "resume-vector", rank: 2 })
      ]
    });
  });

  test("keeps ranked results when summarization fails", async () => {
    mockSearchBm25.mockResolvedValue([
      { _id: { toString: () => "resume-1" }, bm25Score: 8 }
    ]);
    mockCreateEmbedding.mockResolvedValue([0.1, 0.2]);
    mockSearchVector.mockResolvedValue([]);
    mockRerankCandidates.mockResolvedValue([
      {
        resumeId: "resume-1",
        sources: ["bm25"],
        rank: 1,
        relevanceScore: 0.9,
        reason: "Good fit"
      }
    ]);
    mockSummarizeCandidateFit.mockRejectedValue(new Error("Groq unavailable"));

    const response = await request(app)
      .post("/v1/search")
      .send({ query: "RAG", options: { summarize: true } });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      degraded: true,
      warnings: ["SUMMARIZATION_FAILED"],
      results: [expect.objectContaining({ resumeId: "resume-1" })]
    });
    expect(response.body.results[0].summary).toBeUndefined();
  });
});
