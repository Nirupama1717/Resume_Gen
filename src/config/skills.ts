export const SKILLS = [
  "Java",
  "Selenium",
  "Playwright",
  "API Testing",
  "Postman",
  "SQL",
  "MongoDB",
  "Jenkins",
  "Python",
  "C#",
  "REST Assured",
  "Cucumber",
  "GenAI",
  "Langchain",
  "Langgraph",
  "RAG",
  "Azure DevOps",
  "AWS Lambda",
  "GitHub",
  "DeepEval",
  "MCP (Model Context Protocol)"
] as const;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function detectSkills(rawText: string): string[] {
  return SKILLS.filter((skill) => {
    const skillPattern = new RegExp(
      `(?<![A-Za-z0-9])${escapeRegex(skill)}(?![A-Za-z0-9])`,
      "i"
    );

    return skillPattern.test(rawText);
  });
}