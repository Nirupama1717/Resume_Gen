import { env } from "../../../config/env";

interface MistralEmbeddingResponse {
	data?: Array<{ embedding?: unknown }>;
}

export class EmbeddingService {
	async createEmbedding(input: string): Promise<number[]> {
		if (!env.mistralApiKey || env.mistralApiKey === "YOUR_KEY") {
			throw new Error("MISTRAL_API_KEY is not configured");
		}

		const response = await fetch("https://api.mistral.ai/v1/embeddings", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${env.mistralApiKey}`
			},
			body: JSON.stringify({
				model: env.mistralEmbedModel,
				input: [input]
			})
		});

		if (!response.ok) {
			throw new Error(`Mistral embedding request failed: ${response.status}`);
		}

		const payload = (await response.json()) as MistralEmbeddingResponse;
		const embedding = payload.data?.[0]?.embedding;

		if (
			!Array.isArray(embedding) ||
			embedding.length !== env.embeddingDimension ||
			embedding.some((value) => typeof value !== "number" || !Number.isFinite(value))
		) {
			throw new Error("Mistral returned an invalid embedding vector");
		}

		return embedding;
	}
}
