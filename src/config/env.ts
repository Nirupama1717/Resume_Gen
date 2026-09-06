import dotenv from "dotenv";

dotenv.config();

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const useLlmParser = process.env.USE_LLM_PARSER === "true";
const embeddingDimension = Number.parseInt(
  process.env.EMBEDDING_DIMENSION ?? "1024",
  10
);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

if (!Number.isInteger(embeddingDimension) || embeddingDimension <= 0) {
  throw new Error("EMBEDDING_DIMENSION must be a positive integer");
}

export const env = {
  port,
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongodbUri: process.env.MONGODB_URI,
  mongodbDbName: process.env.MONGODB_DB_NAME ?? "resume_rag",
  useLlmParser,
  mistralApiKey: process.env.MISTRAL_API_KEY,
  mistralEmbedModel: process.env.MISTRAL_EMBED_MODEL ?? "mistral-embed",
  embeddingDimension,
  atlasSearchIndex: process.env.ATLAS_SEARCH_INDEX ?? "resume_bm25",
  atlasVectorIndex: process.env.ATLAS_VECTOR_INDEX ?? "resume_vector"
} as const;
