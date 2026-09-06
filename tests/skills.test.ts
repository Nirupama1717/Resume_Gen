import { detectSkills } from "../src/config/skills";

describe("detectSkills", () => {
  test("detects known skills case-insensitively", () => {
    expect(detectSkills("Python, RAG, DeepEval and MongoDB")).toEqual([
      "MongoDB",
      "Python",
      "RAG",
      "DeepEval"
    ]);
  });

  test("does not match skills inside larger words", () => {
    expect(detectSkills("JavaScript is not Java" )).toEqual(["Java"]);
  });
});