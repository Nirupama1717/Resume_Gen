import { getDatabase } from "../../../config/database";
import { env } from "../../../config/env";

export interface RetrievalReadiness {
  ready: boolean;
  collection: string;
  resumeCount: number;
  resumesWithEmbedding: number;
  embeddingModel: string;
  embeddingDimension: number;
  reason?: string;
}

export class RetrievalValidationService {
  async checkReadiness(): Promise<RetrievalReadiness> {
    const database = await getDatabase();
    const resumes = database.collection("resumes");
    const resumeCount = await resumes.countDocuments();
    const resumesWithEmbedding = await resumes.countDocuments({
      embedding: { $exists: true, $type: "array", $ne: [] }
    });
    const compatibleEmbeddingCount = await resumes.countDocuments({
      embedding: { $exists: true, $type: "array", $ne: [] },
      embeddingModel: env.mistralEmbedModel,
      embeddingDimension: env.embeddingDimension
    });

    if (compatibleEmbeddingCount === 0) {
      return {
        ready: false,
        collection: "resumes",
        resumeCount,
        resumesWithEmbedding,
        embeddingModel: env.mistralEmbedModel,
        embeddingDimension: env.embeddingDimension,
        reason:
          resumeCount === 0
            ? "No ingested resumes are available"
            : "No compatible resume embeddings are available"
      };
    }

    return {
      ready: true,
      collection: "resumes",
      resumeCount,
      resumesWithEmbedding,
      embeddingModel: env.mistralEmbedModel,
      embeddingDimension: env.embeddingDimension
    };
  }
}
