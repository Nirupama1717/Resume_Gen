const mockSummarizeCandidateFit = jest.fn();

jest.mock("../src/modules/retrieval/services/LLMService", () => ({
  LLMService: jest.fn().mockImplementation(() => ({
    summarizeCandidateFit: mockSummarizeCandidateFit
  }))
}));

import request from "supertest";
import { app } from "../src/app";

describe("candidate summarize API", () => {
  beforeEach(() => {
    mockSummarizeCandidateFit.mockReset();
  });

  test("summarizes a candidate with default options", async () => {
    mockSummarizeCandidateFit.mockResolvedValue("Strong fit for the role.");

    const response = await request(app)
      .post("/v1/search/summarize")
      .send({
        query: "senior RAG architect",
        candidate: {
          resumeId: "resume-1",
          snippet: "RAG architect with evaluation experience"
        }
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      resumeId: "resume-1",
      summary: "Strong fit for the role."
    });
    expect(mockSummarizeCandidateFit).toHaveBeenCalledWith(
      "senior RAG architect",
      expect.objectContaining({
        resumeId: "resume-1",
        snippet: "RAG architect with evaluation experience",
        sources: []
      }),
      { style: "short", maxTokens: 150 }
    );
  });

  test("forwards detailed style and token limit", async () => {
    mockSummarizeCandidateFit.mockResolvedValue("Detailed fit summary.");

    const response = await request(app)
      .post("/v1/search/summarize")
      .send({
        query: "QA architect",
        candidate: { resumeId: "resume-2", snippet: "QA architect" },
        style: "detailed",
        maxTokens: 300
      });

    expect(response.status).toBe(200);
    expect(response.body.summary).toBe("Detailed fit summary.");
    expect(mockSummarizeCandidateFit).toHaveBeenCalledWith(
      "QA architect",
      expect.any(Object),
      { style: "detailed", maxTokens: 300 }
    );
  });

  test("rejects invalid candidate and summary options", async () => {
    const candidateResponse = await request(app)
      .post("/v1/search/summarize")
      .send({ query: "RAG", candidate: { resumeId: "resume-1" } });
    const styleResponse = await request(app)
      .post("/v1/search/summarize")
      .send({
        query: "RAG",
        candidate: { resumeId: "resume-1", snippet: "RAG" },
        style: "unsupported"
      });
    const tokenResponse = await request(app)
      .post("/v1/search/summarize")
      .send({
        query: "RAG",
        candidate: { resumeId: "resume-1", snippet: "RAG" },
        maxTokens: 1001
      });

    expect(candidateResponse.status).toBe(400);
    expect(candidateResponse.body.errorCode).toBe("INVALID_SUMMARY_CANDIDATE");
    expect(styleResponse.status).toBe(400);
    expect(styleResponse.body.errorCode).toBe("INVALID_SUMMARY_OPTIONS");
    expect(tokenResponse.status).toBe(400);
    expect(tokenResponse.body.errorCode).toBe("INVALID_SUMMARY_OPTIONS");
    expect(mockSummarizeCandidateFit).not.toHaveBeenCalled();
  });

  test("returns a controlled failure when summarization fails", async () => {
    mockSummarizeCandidateFit.mockRejectedValue(new Error("Groq unavailable"));

    const response = await request(app)
      .post("/v1/search/summarize")
      .send({
        query: "RAG",
        candidate: { resumeId: "resume-1", snippet: "RAG" }
      });

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      success: false,
      errorCode: "SUMMARIZATION_FAILED",
      message: "Candidate summarization failed"
    });
  });
});
