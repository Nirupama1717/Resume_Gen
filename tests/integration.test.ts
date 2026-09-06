jest.mock("../src/config/database", () => ({
  checkDatabaseConnection: jest.fn().mockResolvedValue(3),
  getDatabase: jest.fn()
}));

import request from "supertest";
import { app } from "../src/app";

describe("ingestion API", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("returns health status", async () => {
    const response = await request(app).get("/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      app: "resume-rag-backend",
      version: "1.0.0"
    });
    expect(response.headers["x-request-id"]).toBeDefined();
  });

  test("parses resume text through the API", async () => {
    const response = await request(app)
      .post("/v1/resume/parse")
      .send({ rawText: "Rajesh Mohan Kumar\nPython\n13+ years" });

    expect(response.status).toBe(200);
    expect(response.body.resume).toMatchObject({
      name: "Rajesh Mohan Kumar",
      totalExperience: 13,
      skills: ["Python"]
    });
  });

  test("returns database health status", async () => {
    const response = await request(app).get("/v1/health/db");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      database: "mongodb",
      connected: true,
      latencyMs: 3
    });
  });

  test("cleans text and detects skills through the API", async () => {
    const cleanResponse = await request(app)
      .post("/v1/resume/clean")
      .send({ rawText: "Python\n\n\nRAG   " });
    const skillsResponse = await request(app)
      .post("/v1/resume/skills")
      .send({ rawText: "Python, RAG and DeepEval" });

    expect(cleanResponse.body.cleanText).toBe("Python\nRAG");
    expect(skillsResponse.body.skills).toEqual(["Python", "RAG", "DeepEval"]);
  });

  test("rejects invalid uploaded files", async () => {
    const response = await request(app)
      .post("/v1/resume/upload")
      .attach("file", Buffer.from("not a pdf"), {
        filename: "resume.txt",
        contentType: "text/plain"
      });

    expect(response.status).toBe(415);
    expect(response.body.errorCode).toBe("INVALID_FILE_TYPE");
  });

  test("returns a controlled extraction failure for malformed PDFs", async () => {
    const response = await request(app)
      .post("/v1/resume/extract")
      .attach("file", Buffer.from("not a pdf"), {
        filename: "resume.pdf",
        contentType: "application/pdf"
      });

    expect(response.status).toBe(422);
    expect(response.body.errorCode).toBe("RESUME_EXTRACTION_FAILED");
  });

  test("validates embedding and storage requests before external calls", async () => {
    const embeddingResponse = await request(app)
      .post("/v1/resume/embed")
      .send({ rawText: "resume", skills: "Python" });
    const storeResponse = await request(app)
      .post("/v1/resume/store")
      .send({ fileName: "resume.pdf", rawText: "resume" });

    expect(embeddingResponse.status).toBe(400);
    expect(embeddingResponse.body.errorCode).toBe("EMBEDDING_INPUT_INVALID");
    expect(storeResponse.status).toBe(400);
    expect(storeResponse.body.errorCode).toBe("RESUME_STORAGE_INPUT_INVALID");
  });

  test("returns a controlled full-ingestion failure for malformed PDFs", async () => {
    const response = await request(app)
      .post("/v1/resume/ingest")
      .attach("file", Buffer.from("not a pdf"), {
        filename: "resume.pdf",
        contentType: "application/pdf"
      });

    expect(response.status).toBe(422);
    expect(response.body.errorCode).toBe("RESUME_EXTRACTION_FAILED");
  });

  test("returns a stable error for missing upload files", async () => {
    const response = await request(app).post("/v1/resume/ingest");

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      errorCode: "FILE_REQUIRED",
      message: "Resume PDF is required"
    });
    expect(response.body.requestId).toBeDefined();
  });
});