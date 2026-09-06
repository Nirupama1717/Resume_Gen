import { env } from "../../../config/env";
import {
  RerankedCandidate,
  SearchCandidate,
  SummaryOptions
} from "../types/retrieval.types";

interface GroqResponse {
  choices?: Array<{ message?: { content?: unknown } }>;
}

interface RerankItem {
  resumeId?: unknown;
  relevanceScore?: unknown;
  reason?: unknown;
}

export class LLMService {
  async rerankCandidates(
    query: string,
    candidates: SearchCandidate[],
    topK: number
  ): Promise<RerankedCandidate[]> {
    const limitedCandidates = candidates.slice(0, this.normalizeLimit(topK));
    const payload = await this.completeJson(
      this.buildRerankPrompt(query, limitedCandidates),
      600
    );
    const items = this.parseJsonArray(payload, "rerank");
    const candidatesById = new Map(
      limitedCandidates.map((candidate) => [candidate.resumeId, candidate])
    );
    const seenIds = new Set<string>();

    return items.map((item, index) => {
      const resumeId = this.requireString(item.resumeId, "resumeId");
      const candidate = candidatesById.get(resumeId);
      if (!candidate || seenIds.has(resumeId)) {
        throw new Error("Groq returned an unknown or duplicate resumeId");
      }

      const relevanceScore = this.requireNumber(
        item.relevanceScore,
        "relevanceScore"
      );
      const reason = this.requireString(item.reason, "reason");
      seenIds.add(resumeId);

      return {
        ...candidate,
        rank: index + 1,
        relevanceScore,
        reason
      };
    });
  }

  async summarizeCandidateFit(
    query: string,
    candidate: SearchCandidate,
    options: SummaryOptions = { style: "short", maxTokens: 150 }
  ): Promise<string> {
    if (!Number.isInteger(options.maxTokens) || options.maxTokens < 1) {
      throw new Error("maxTokens must be a positive integer");
    }

    const payload = await this.completeJson(
      this.buildSummaryPrompt(query, candidate, options.style),
      options.maxTokens
    );
    const parsed = this.parseJsonObject(payload, "summary");
    return this.requireString(parsed.summary, "summary");
  }

  async extractMetadata(rawText: string): Promise<Record<string, unknown>> {
    const payload = await this.completeJson(
      `Extract factual resume metadata from the text below. Return JSON only with optional keys: name, email, phone, location, company, role, education, totalExperience, relevantExperience, skills, jobTitles, experienceSummary. Do not invent values.\n\n${rawText}`,
      500
    );
    return this.parseJsonObject(payload, "metadata");
  }

  private async completeJson(prompt: string, maxTokens: number): Promise<string> {
    if (!env.groqApiKey || env.groqApiKey === "YOUR_KEY") {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.groqApiKey}`
      },
      body: JSON.stringify({
        model: env.groqModel,
        temperature: 0,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Return valid JSON only. Use only facts supplied by the user."
          },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Groq request failed: ${response.status}`);
    }

    const result = (await response.json()) as GroqResponse;
    const content = result.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new Error("Groq returned an empty response");
    }

    return content;
  }

  private buildRerankPrompt(query: string, candidates: SearchCandidate[]): string {
    return `Rank these supplied candidates for the search query. Return a JSON object with an "items" array. Each item must contain only resumeId, relevanceScore from 0 to 1, and a concise reason. Return only supplied resume IDs.\n\nQuery: ${query}\nCandidates: ${JSON.stringify(candidates)}`;
  }

  private buildSummaryPrompt(
    query: string,
    candidate: SearchCandidate,
    style: SummaryOptions["style"]
  ): string {
    return `Summarize this candidate's fit for the query using only the supplied data. Return a JSON object with one string key named "summary". Style: ${style}. Query: ${query}. Candidate: ${JSON.stringify(candidate)}`;
  }

  private parseJsonArray(payload: string, operation: string): RerankItem[] {
    const object = this.parseJsonObject(payload, operation);
    if (!Array.isArray(object.items)) {
      throw new Error(`Groq ${operation} response must contain an items array`);
    }
    return object.items as RerankItem[];
  }

  private parseJsonObject(
    payload: string,
    operation: string
  ): Record<string, any> {
    const normalized = payload.trim().replace(/^```json\s*|```$/g, "");
    try {
      const parsed: unknown = JSON.parse(normalized);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error();
      }
      return parsed as Record<string, any>;
    } catch {
      throw new Error(`Groq returned invalid JSON for ${operation}`);
    }
  }

  private requireString(value: unknown, field: string): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`Groq response field ${field} is invalid`);
    }
    return value.trim();
  }

  private requireNumber(value: unknown, field: string): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`Groq response field ${field} is invalid`);
    }
    return value;
  }

  private normalizeLimit(value: number): number {
    return Math.min(Math.max(Math.floor(value) || 1, 1), 100);
  }
}
