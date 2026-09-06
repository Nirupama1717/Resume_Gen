import { ObjectId } from "mongodb";
import { env } from "../../../config/env";
import { getDatabase } from "../../../config/database";
import { ParsedResume } from "../types/ingestion.types";

export interface ResumeDocument extends ParsedResume {
	_id?: ObjectId;
	fileName: string;
	rawText: string;
	embedding: number[];
	embeddingModel: string;
	embeddingDimension: number;
	createdAt: Date;
	updatedAt: Date;
}

export class ResumeIngestionRepository {
	async insertResume(
		fileName: string,
		rawText: string,
		resume: ParsedResume,
		embedding: number[]
	): Promise<string> {
		const database = await getDatabase();
		const now = new Date();
		const document: ResumeDocument = {
			fileName,
			rawText,
			...resume,
			embedding,
			embeddingModel: env.mistralEmbedModel,
			embeddingDimension: embedding.length,
			createdAt: now,
			updatedAt: now
		};

		const result = await database.collection<ResumeDocument>("resumes").insertOne(document);
		return result.insertedId.toString();
	}
}
