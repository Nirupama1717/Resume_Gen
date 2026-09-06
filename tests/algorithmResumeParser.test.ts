import { AlgorithmResumeParser } from "../src/modules/ingestion/services/AlgorithmResumeParser";

describe("AlgorithmResumeParser", () => {
  test("extracts supported resume metadata", () => {
    const resume = new AlgorithmResumeParser().parseResume(
      "Rajesh Mohan Kumar\nTest Architect & Senior Agentic Test Engineer\nTestleaf Software Solutions Private Limited\nrajesh@example.com\n+91-9876543210\n13+ years of experience\nB.Tech - Information Technology\nSelenium WebDriver\nCore Java\nPython\nRAG"
    );

    expect(resume.name).toBe("Rajesh Mohan Kumar");
    expect(resume.role).toBe("Test Architect & Senior Agentic Test Engineer");
    expect(resume.company).toBe("Testleaf Software Solutions Private Limited");
    expect(resume.totalExperience).toBe(13);
    expect(resume.skills).toEqual([
      "Core Java",
      "Selenium WebDriver",
      "Python",
      "RAG"
    ]);
  });

  test("does not invent fields from generic text", () => {
    expect(new AlgorithmResumeParser().parseResume("A short note")).toEqual({
      skills: []
    });
  });
});