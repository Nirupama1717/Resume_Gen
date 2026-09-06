jest.mock("../src/config/database", () => ({
  getDatabase: jest.fn()
}));

import request from "supertest";
import { getDatabase } from "../src/config/database";
import { app } from "../src/app";

const mockedGetDatabase = jest.mocked(getDatabase);

function mockDatabase(options: {
  resumeCount: number;
  resumesWithEmbedding: number;
  compatibleEmbeddingCount: number;
}) {
  const countDocuments = jest
    .fn()
    .mockResolvedValueOnce(options.resumeCount)
    .mockResolvedValueOnce(options.resumesWithEmbedding)
    .mockResolvedValueOnce(options.compatibleEmbeddingCount);

  mockedGetDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue({ countDocuments })
  } as never);
}

describe("retrieval readiness API", () => {
  beforeEach(() => {
    mockedGetDatabase.mockReset();
  });

  test("reports readiness when compatible embeddings exist", async () => {
    mockDatabase({
      resumeCount: 1,
      resumesWithEmbedding: 1,
      compatibleEmbeddingCount: 1
    });

    const response = await request(app).get("/v1/search/readiness");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ready: true,
      collection: "resumes",
      resumeCount: 1,
      resumesWithEmbedding: 1,
      embeddingModel: "mistral-embed",
      embeddingDimension: 1024
    });
  });

  test("reports not ready when no resumes are stored", async () => {
    mockDatabase({
      resumeCount: 0,
      resumesWithEmbedding: 0,
      compatibleEmbeddingCount: 0
    });

    const response = await request(app).get("/v1/search/readiness");

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      ready: false,
      reason: "No ingested resumes are available"
    });
  });

  test("reports not ready when stored embeddings are incompatible", async () => {
    mockDatabase({
      resumeCount: 1,
      resumesWithEmbedding: 1,
      compatibleEmbeddingCount: 0
    });

    const response = await request(app).get("/v1/search/readiness");

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      ready: false,
      reason: "No compatible resume embeddings are available"
    });
  });
});
