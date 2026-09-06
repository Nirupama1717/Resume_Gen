import request from "supertest";
import { app } from "../src/app";

describe("retrieval payload controls", () => {
  test("rejects an oversized JSON body with HTTP 413", async () => {
    const response = await request(app)
      .post("/v1/search")
      .send({ query: "RAG", padding: "x".repeat(1024 * 1024) });

    expect(response.status).toBe(413);
    expect(response.body).toMatchObject({
      success: false,
      errorCode: "REQUEST_BODY_TOO_LARGE"
    });
    expect(response.headers["x-request-id"]).toBeDefined();
  });

  test("rejects a search query over the configured maximum", async () => {
    const response = await request(app)
      .post("/v1/search")
      .send({ query: "RAG ".repeat(501) });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_SEARCH_QUERY");
  });

  test("rejects an oversized rerank snippet", async () => {
    const response = await request(app)
      .post("/v1/search/rerank")
      .send({
        query: "RAG",
        candidates: [
          { resumeId: "resume-1", snippet: "x".repeat(10001) }
        ]
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_RERANK_CANDIDATES");
  });
});