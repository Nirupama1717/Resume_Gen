import { Router } from "express";
import {
	createQueryEmbedding,
	getRetrievalReadiness
} from "../controllers/retrievalController";

export const retrievalRoutes = Router();

retrievalRoutes.get("/search/readiness", getRetrievalReadiness);
retrievalRoutes.post("/embeddings", createQueryEmbedding);
