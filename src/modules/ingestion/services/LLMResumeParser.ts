import { ParsedResume } from "../types/ingestion.types";

export class LLMResumeParser {
	parseResume(_rawText: string): ParsedResume {
		throw new Error("LLM resume parser is not configured");
	}
}
