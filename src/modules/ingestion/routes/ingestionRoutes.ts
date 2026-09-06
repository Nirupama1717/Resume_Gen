import { Router } from "express";
import { upload } from "../../../config/multerConfig";
import {
	cleanResume,
	detectResumeSkills,
	embedResume,
	extractResume,
	getIngestionHealth,
	ingestResume,
	llmParseResume,
	parseResume,
	storeResume,
	uploadResume
} from "../controllers/ingestionController";

export const ingestionRoutes = Router();

ingestionRoutes.get("/resume/health", getIngestionHealth);
ingestionRoutes.post("/resume/upload", upload.single("file"), uploadResume);
ingestionRoutes.post("/resume/extract", upload.single("file"), extractResume);
ingestionRoutes.post("/resume/clean", cleanResume);
ingestionRoutes.post("/resume/skills", detectResumeSkills);
ingestionRoutes.post("/resume/parse", parseResume);
ingestionRoutes.post("/resume/llm-parse", llmParseResume);
ingestionRoutes.post("/resume/embed", embedResume);
ingestionRoutes.post("/resume/store", storeResume);
ingestionRoutes.post("/resume/ingest", upload.single("file"), ingestResume);
