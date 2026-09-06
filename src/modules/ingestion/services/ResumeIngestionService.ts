import { unlink } from "node:fs/promises";
import { env } from "../../../config/env";
import { ParsedResume } from "../types/ingestion.types";
import { ResumeIngestionRepository } from "../repositories/ResumeIngestionRepository";
import { AlgorithmResumeParser } from "./AlgorithmResumeParser";
import { EmbeddingService } from "./EmbeddingService";
import { LLMResumeParser } from "./LLMResumeParser";
import { ResumeParserService } from "./ResumeParserService";
import { cleanResumeText } from "../utils/textCleaner";

export interface ResumeIngestionResult {
	resumeId: string;
	resume: ParsedResume;
	embeddingModel: string;
	embeddingDimension: number;
	timings: {
		extractMs: number;
		cleanMs: number;
		parseMs: number;
		embeddingMs: number;
		mongoInsertMs: number;
		totalMs: number;
	};
}

export class ResumeIngestionError extends Error {
	constructor(
		public readonly errorCode: string,
		public readonly statusCode: number,
		message: string
	) {
		super(message);
	}
}

export class ResumeIngestionService {
	private readonly resumeParserService = new ResumeParserService();
	private readonly algorithmResumeParser = new AlgorithmResumeParser();
	private readonly llmResumeParser = new LLMResumeParser();
	private readonly embeddingService = new EmbeddingService();
	private readonly resumeIngestionRepository = new ResumeIngestionRepository();

	async ingestResume(file: Express.Multer.File): Promise<ResumeIngestionResult> {
		const startedAt = Date.now();

		try {
			const extractStartedAt = Date.now();
			let rawText: string;

			try {
				rawText = await this.resumeParserService.extractTextFromPdf(file.path);
			} catch (error) {
				throw new ResumeIngestionError(
					"RESUME_EXTRACTION_FAILED",
					422,
					"Resume extraction failed"
				);
			}
			const extractMs = Date.now() - extractStartedAt;

			if (!rawText) {
				throw new ResumeIngestionError(
					"RESUME_EXTRACTION_FAILED",
					422,
					"Resume extraction failed"
				);
			}

			const cleanStartedAt = Date.now();
			const cleanText = cleanResumeText(rawText);
			const cleanMs = Date.now() - cleanStartedAt;

			if (!cleanText) {
				throw new ResumeIngestionError(
					"RESUME_EXTRACTION_FAILED",
					422,
					"Resume extraction failed"
				);
			}

			const parseStartedAt = Date.now();
			const parser = env.useLlmParser
				? this.llmResumeParser
				: this.algorithmResumeParser;
			let resume: ParsedResume;

			try {
				resume = parser.parseResume(cleanText);
			} catch (error) {
				throw new ResumeIngestionError(
					"RESUME_PARSE_FAILED",
					422,
					"Resume parsing failed"
				);
			}
			const parseMs = Date.now() - parseStartedAt;

			const embeddingText = [
				resume.name ?? "",
				resume.role ?? "",
				resume.skills.join(", "),
				resume.company ?? "",
				resume.experienceSummary ?? "",
				cleanText
			]
				.filter(Boolean)
				.join("\n");

			const embeddingStartedAt = Date.now();
			let embedding: number[];

			try {
				embedding = await this.embeddingService.createEmbedding(embeddingText);
			} catch (error) {
				throw new ResumeIngestionError(
					"EMBEDDING_FAILED",
					502,
					"Mistral embedding failed"
				);
			}
			const embeddingMs = Date.now() - embeddingStartedAt;

			const mongoStartedAt = Date.now();
			let resumeId: string;

			try {
				resumeId = await this.resumeIngestionRepository.insertResume(
					file.originalname,
					cleanText,
					resume,
					embedding
				);
			} catch (error) {
				throw new ResumeIngestionError(
					"INGESTION_FAILED",
					503,
					"Resume ingestion failed"
				);
			}
			const mongoInsertMs = Date.now() - mongoStartedAt;

			return {
				resumeId,
				resume,
				embeddingModel: env.mistralEmbedModel,
				embeddingDimension: embedding.length,
				timings: {
					extractMs,
					cleanMs,
					parseMs,
					embeddingMs,
					mongoInsertMs,
					totalMs: Date.now() - startedAt
				}
			};
		} finally {
			await unlink(file.path).catch(() => undefined);
		}
	}
}
