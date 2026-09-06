import { Router } from "express";
import {
	createQueryEmbedding,
	getRetrievalReadiness,
		searchBm25,
		searchVector,
		searchHybrid,
		rerankSearchCandidates,
		summarizeSearchCandidate
} from "../controllers/retrievalController";

export const retrievalRoutes = Router();

retrievalRoutes.get("/search/readiness", getRetrievalReadiness);
retrievalRoutes.post("/embeddings", createQueryEmbedding);
retrievalRoutes.post("/search/bm25", searchBm25);
retrievalRoutes.post("/search/vector", searchVector);
retrievalRoutes.post("/search/hybrid", searchHybrid);
retrievalRoutes.post("/search/rerank", rerankSearchCandidates);
retrievalRoutes.post("/search/summarize", summarizeSearchCandidate);
