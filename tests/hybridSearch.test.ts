const mockSearchBm25 = jest.fn();
const mockSearchVector = jest.fn();
const mockCreateEmbedding = jest.fn();

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

import request from "supertest";
import { app } from "../src/app";
import { SearchService } from "../src/modules/retrieval/services/SearchService";

describe("hybrid search", () => {
  beforeEach(() => {
    mockSearchBm25.mockReset();
    mockSearchVector.mockReset();
    mockCreateEmbedding.mockReset();
  });

  test("runs BM25 and embedding independently and keeps result lists separate", async () => {
    let releaseBm25: () => void = () => undefined;
    let releaseEmbedding: () => void = () => undefined;
    const bm25Started = new Promise<void>((resolve) => {
      releaseBm25 = resolve;
    });
    const embeddingStarted = new Promise<void>((resolve) => {
      releaseEmbedding = resolve;
    });

    mockSearchBm25.mockImplementation(async () => {
      releaseBm25();
      await embeddingStarted;
      return [
        {
          _id: { toString: () => "resume-bm25" },
          bm25Score: 8.4
        }
      ];
    });
    mockCreateEmbedding.mockImplementation(async () => {
      releaseEmbedding();
      await bm25Started;
      return [0.1, 0.2];
    });
    mockSearchVector.mockResolvedValue([
      {
        _id: { toString: () => "resume-vector" },
        vectorScore: 0.88
      }
    ]);

    const result = await new SearchService().hybridSearch("RAG architect", {}, 5);

    expect(result.bm25[0]).toMatchObject({
      resumeId: "resume-bm25",
      bm25Score: 8.4,
      sources: ["bm25"]
    });
    expect(result.vector[0]).toMatchObject({
      resumeId: "resume-vector",
      vectorScore: 0.88,
      sources: ["vector"]
    });
    expect(result.timings).toEqual({
      bm25Ms: expect.any(Number),
      embeddingMs: expect.any(Number),
      vectorMs: expect.any(Number)
    });
    expect(mockSearchVector).toHaveBeenCalledWith([0.1, 0.2], {}, 5);
  });

  test("returns the hybrid debug response without merging scores", async () => {
    mockSearchBm25.mockResolvedValue([
      {
        _id: { toString: () => "resume-1" },
        name: "Rajesh",
        bm25Score: 8.4
      }
    ]);
    mockCreateEmbedding.mockResolvedValue([0.1, 0.2]);
    mockSearchVector.mockResolvedValue([
      {
        _id: { toString: () => "resume-1" },
        name: "Rajesh",
        vectorScore: 0.88
      }
    ]);

    const response = await request(app)
      .post("/v1/search/hybrid")
      .send({ query: "RAG architect", topK: 5 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      mode: "hybrid-debug",
      query: "RAG architect",
      bm25: [
        expect.objectContaining({ resumeId: "resume-1", bm25Score: 8.4 })
      ],
      vector: [
        expect.objectContaining({ resumeId: "resume-1", vectorScore: 0.88 })
      ],
      timings: {
        bm25Ms: expect.any(Number),
        embeddingMs: expect.any(Number),
        vectorMs: expect.any(Number)
      }
    });
    expect(response.body.bm25[0].vectorScore).toBeUndefined();
    expect(response.body.vector[0].bm25Score).toBeUndefined();
  });

  test("rejects an empty query before starting either search", async () => {
    const response = await request(app)
      .post("/v1/search/hybrid")
      .send({ query: "   " });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_SEARCH_QUERY");
    expect(mockSearchBm25).not.toHaveBeenCalled();
    expect(mockCreateEmbedding).not.toHaveBeenCalled();
  });
});
