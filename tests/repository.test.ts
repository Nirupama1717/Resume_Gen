jest.mock("../src/config/database", () => ({
  getDatabase: jest.fn()
}));

import { getDatabase } from "../src/config/database";
import { ResumeIngestionRepository } from "../src/modules/ingestion/repositories/ResumeIngestionRepository";

describe("ResumeIngestionRepository", () => {
  test("inserts a resume document and returns its id", async () => {
    const insertOne = jest.fn().mockResolvedValue({
      insertedId: { toString: () => "resume-id-1" }
    });
    const database = {
      collection: jest.fn().mockReturnValue({ insertOne })
    };
    (getDatabase as jest.Mock).mockResolvedValue(database);

    const resumeId = await new ResumeIngestionRepository().insertResume(
      "resume.pdf",
      "resume text",
      { name: "Rajesh", skills: ["Python"] },
      [0.1]
    );

    expect(resumeId).toBe("resume-id-1");
    expect(insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "resume.pdf",
        rawText: "resume text",
        skills: ["Python"],
        embedding: [0.1],
        embeddingModel: "mistral-embed",
        embeddingDimension: 1,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      })
    );
  });
});