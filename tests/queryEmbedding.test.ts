const mockCreateEmbedding = jest.fn();

jest.mock("../src/modules/ingestion/services/EmbeddingService", () => ({
  EmbeddingService: jest.fn().mockImplementation(() => ({
    createEmbedding: mockCreateEmbedding
  }))
}));

import request from "supertest";
import { app } from "../src/app";

const vector = Array.from({ length: 1024 }, (_, index) => index / 1024);

describe("query embedding API", () => {
  beforeEach(() => {
    mockCreateEmbedding.mockReset();
  });

  test("returns a configured-dimension query embedding", async () => {
    mockCreateEmbedding.mockResolvedValue(vector);

    const response = await request(app)
      .post("/v1/embeddings")
      .send({
        model: "mistral-embed",
        input: "senior QA architect with RAG experience"
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      embedding: vector,
      model: "mistral-embed",
      dimension: 1024
    });
    expect(mockCreateEmbedding).toHaveBeenCalledWith(
      "senior QA architect with RAG experience"
    );
  });

  test("rejects an empty input before calling Mistral", async () => {
    const response = await request(app)
      .post("/v1/embeddings")
      .send({ model: "mistral-embed", input: "   " });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("EMBEDDING_INPUT_INVALID");
    expect(mockCreateEmbedding).not.toHaveBeenCalled();
  });

  test("rejects a model that differs from the configured model", async () => {
    const response = await request(app)
      .post("/v1/embeddings")
      .send({ model: "different-model", input: "RAG experience" });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("EMBEDDING_INPUT_INVALID");
    expect(mockCreateEmbedding).not.toHaveBeenCalled();
  });

  test("returns a controlled failure when embedding generation fails", async () => {
    mockCreateEmbedding.mockRejectedValue(new Error("Mistral unavailable"));

    const response = await request(app)
      .post("/v1/embeddings")
      .send({ input: "RAG experience" });

    expect(response.status).toBe(502);
    expect(response.body).toMatchObject({
      success: false,
      errorCode: "EMBEDDING_FAILED",
      message: "Mistral embedding failed"
    });
  });
});
