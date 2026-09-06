const mockSearchVector = jest.fn();
const mockCreateEmbedding = jest.fn();

jest.mock("../src/modules/retrieval/repositories/ResumeRepository", () => ({
  ResumeRepository: jest.fn().mockImplementation(() => ({
    searchVector: mockSearchVector
  }))
}));

jest.mock("../src/modules/ingestion/services/EmbeddingService", () => ({
  EmbeddingService: jest.fn().mockImplementation(() => ({
    createEmbedding: mockCreateEmbedding
  }))
}));

import request from "supertest";
import { app } from "../src/app";

describe("vector search API", () => {
  beforeEach(() => {
    mockSearchVector.mockReset();
    mockCreateEmbedding.mockReset();
  });

  test("embeds the query and returns vector-ranked candidates", async () => {
    const queryVector = [0.1, 0.2, 0.3];
    mockCreateEmbedding.mockResolvedValue(queryVector);
    mockSearchVector.mockResolvedValue([
      {
        _id: { toString: () => "resume-1" },
        name: "Rajesh Mohan Kumar",
        role: "Test Architect",
        skills: ["RAG", "MCP"],
        vectorScore: 0.88
      }
    ]);

    const response = await request(app)
      .post("/v1/search/vector")
      .send({
        query: "senior engineer with semantic RAG experience",
        topK: 5,
        filters: { minYearsExperience: 10 }
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      mode: "vector",
      query: "senior engineer with semantic RAG experience",
      count: 1,
      results: [
        {
          resumeId: "resume-1",
          name: "Rajesh Mohan Kumar",
          role: "Test Architect",
          skills: ["RAG", "MCP"],
          vectorScore: 0.88,
          sources: ["vector"]
        }
      ]
    });
    expect(mockCreateEmbedding).toHaveBeenCalledWith(
      "senior engineer with semantic RAG experience"
    );
    expect(mockSearchVector).toHaveBeenCalledWith(
      queryVector,
      { minYearsExperience: 10 },
      5
    );
  });

  test("rejects an empty query before embedding", async () => {
    const response = await request(app)
      .post("/v1/search/vector")
      .send({ query: "   " });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_SEARCH_QUERY");
    expect(mockCreateEmbedding).not.toHaveBeenCalled();
    expect(mockSearchVector).not.toHaveBeenCalled();
  });

  test("returns a controlled failure when embedding or vector search fails", async () => {
    mockCreateEmbedding.mockRejectedValue(new Error("Mistral unavailable"));

    const response = await request(app)
      .post("/v1/search/vector")
      .send({ query: "RAG experience" });

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      success: false,
      errorCode: "VECTOR_SEARCH_FAILED",
      message: "Vector search failed"
    });
    expect(mockSearchVector).not.toHaveBeenCalled();
  });
});
