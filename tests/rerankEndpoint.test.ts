const mockRerankCandidates = jest.fn();

jest.mock("../src/modules/retrieval/services/LLMService", () => ({
  LLMService: jest.fn().mockImplementation(() => ({
    rerankCandidates: mockRerankCandidates
  }))
}));

import request from "supertest";
import { app } from "../src/app";

describe("candidate rerank API", () => {
  beforeEach(() => {
    mockRerankCandidates.mockReset();
  });

  test("reranks supplied candidates and returns the configured model", async () => {
    mockRerankCandidates.mockResolvedValue([
      {
        resumeId: "resume-1",
        snippet: "RAG architect",
        sources: [],
        rank: 1,
        relevanceScore: 0.96,
        reason: "Strong match"
      }
    ]);

    const response = await request(app)
      .post("/v1/search/rerank")
      .send({
        query: "senior RAG architect",
        candidates: [
          {
            resumeId: "resume-1",
            snippet: "RAG architect",
            name: "Rajesh"
          }
        ],
        topK: 10
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      results: [
        {
          resumeId: "resume-1",
          rank: 1,
          relevanceScore: 0.96,
          reason: "Strong match"
        }
      ]
    });
    expect(mockRerankCandidates).toHaveBeenCalledWith(
      "senior RAG architect",
      [
        expect.objectContaining({
          resumeId: "resume-1",
          snippet: "RAG architect",
          name: "Rajesh",
          sources: []
        })
      ],
      10
    );
  });

  test("rejects malformed candidates before calling the LLM", async () => {
    const response = await request(app)
      .post("/v1/search/rerank")
      .send({
        query: "RAG",
        candidates: [{ resumeId: "resume-1" }]
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_RERANK_CANDIDATES");
    expect(mockRerankCandidates).not.toHaveBeenCalled();
  });

  test("rejects invalid topK and empty candidate lists", async () => {
    const topKResponse = await request(app)
      .post("/v1/search/rerank")
      .send({ query: "RAG", candidates: [{ resumeId: "1", snippet: "RAG" }], topK: 0 });
    const candidatesResponse = await request(app)
      .post("/v1/search/rerank")
      .send({ query: "RAG", candidates: [] });

    expect(topKResponse.status).toBe(400);
    expect(topKResponse.body.errorCode).toBe("INVALID_SEARCH_OPTIONS");
    expect(candidatesResponse.status).toBe(400);
    expect(candidatesResponse.body.errorCode).toBe("INVALID_RERANK_CANDIDATES");
    expect(mockRerankCandidates).not.toHaveBeenCalled();
  });

  test("returns a controlled failure when reranking fails", async () => {
    mockRerankCandidates.mockRejectedValue(new Error("Groq unavailable"));

    const response = await request(app)
      .post("/v1/search/rerank")
      .send({
        query: "RAG",
        candidates: [{ resumeId: "resume-1", snippet: "RAG" }]
      });

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      success: false,
      errorCode: "RERANK_FAILED",
      message: "Candidate re-ranking failed"
    });
  });
});
