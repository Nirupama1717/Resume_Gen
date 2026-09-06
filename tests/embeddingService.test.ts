import { EmbeddingService } from "../src/modules/ingestion/services/EmbeddingService";

describe("EmbeddingService", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("accepts a numeric vector with the configured dimension", async () => {
    const vector = Array.from({ length: 1024 }, (_, index) => index / 1024);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: vector }] })
    }) as jest.Mock;

    await expect(new EmbeddingService().createEmbedding("resume text")).resolves.toHaveLength(1024);
  });

  test("rejects a vector with the wrong dimension", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: [0.1, 0.2] }] })
    }) as jest.Mock;

    await expect(new EmbeddingService().createEmbedding("resume text")).rejects.toThrow(
      "invalid embedding vector"
    );
  });
});