import { cleanResumeText } from "../src/modules/ingestion/utils/textCleaner";

describe("cleanResumeText", () => {
  test("normalizes whitespace and removes blank lines", () => {
    expect(
      cleanResumeText(
        "Rajesh Mohan Kumar\n\n\nTest Architect & Senior Agentic Test Engineer   \n RAG"
      )
    ).toBe(
      "Rajesh Mohan Kumar\nTest Architect & Senior Agentic Test Engineer\nRAG"
    );
  });

  test("preserves meaningful technical symbols", () => {
    expect(cleanResumeText("C#   C++\n.NET\nname@example.com  13+ years")).toBe(
      "C# C++\n.NET\nname@example.com 13+ years"
    );
  });
});