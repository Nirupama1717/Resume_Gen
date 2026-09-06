jest.mock("../src/config/env", () => ({
  env: {
    groqApiKey: "test-groq-key",
    groqModel: "test-groq-model"
  }
}));

import { LLMService } from "../src/modules/retrieval/services/LLMService";
import { SearchCandidate } from "../src/modules/retrieval/types/retrieval.types";

describe("LLMService", () => {
  const originalFetch = global.fetch;
  const candidate: SearchCandidate = {
    resumeId: "resume-1",
    name: "Rajesh",
    role: "Test Architect",
    skills: ["RAG"],
    snippet: "Built RAG evaluation systems",
    sources: ["bm25", "vector"]
  };

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("reranks supplied candidates and preserves candidate data", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                items: [
                  {
                    resumeId: "resume-1",
                    relevanceScore: 0.96,
                    reason: "Direct RAG and architecture experience"
                  }
                ]
              })
            }
          }
        ]
      })
    }) as jest.Mock;

    const result = await new LLMService().rerankCandidates(
      "RAG architect",
      [candidate],
      10
    );

    expect(result).toEqual([
      {
        ...candidate,
        rank: 1,
        relevanceScore: 0.96,
        reason: "Direct RAG and architecture experience"
      }
    ]);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-groq-key"
        })
      })
    );
  });

  test("rejects an LLM candidate ID that was not supplied", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                items: [
                  {
                    resumeId: "invented-resume",
                    relevanceScore: 1,
                    reason: "Invented"
                  }
                ]
              })
            }
          }
        ]
      })
    }) as jest.Mock;

    await expect(
      new LLMService().rerankCandidates("RAG", [candidate], 5)
    ).rejects.toThrow("unknown or duplicate resumeId");
  });

  test("returns grounded summary text and extracted metadata", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"summary":"Strong RAG fit."}' } }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            { message: { content: '{"name":"Rajesh","skills":["RAG"]}' } }
          ]
        })
      }) as jest.Mock;

    const service = new LLMService();
    await expect(
      service.summarizeCandidateFit("RAG architect", candidate, {
        style: "short",
        maxTokens: 150
      })
    ).resolves.toBe("Strong RAG fit.");
    await expect(service.extractMetadata("Rajesh\nRAG")).resolves.toEqual({
      name: "Rajesh",
      skills: ["RAG"]
    });
  });

  test("rejects invalid JSON and Groq failures", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "not json" } }]
        })
      })
      .mockResolvedValueOnce({ ok: false, status: 500 }) as jest.Mock;

    const service = new LLMService();
    await expect(
      service.rerankCandidates("RAG", [candidate], 5)
    ).rejects.toThrow("invalid JSON");
    await expect(
      service.rerankCandidates("RAG", [candidate], 5)
    ).rejects.toThrow("Groq request failed: 500");
  });
});
