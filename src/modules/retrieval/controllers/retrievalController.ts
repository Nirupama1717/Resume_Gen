import { RequestHandler } from "express";
import { RetrievalValidationService } from "../services/RetrievalValidationService";

const retrievalValidationService = new RetrievalValidationService();

export const getRetrievalReadiness: RequestHandler = async (_request, response) => {
  try {
    const readiness = await retrievalValidationService.checkReadiness();
    response.status(readiness.ready ? 200 : 503).json(readiness);
  } catch (error) {
    console.error(error);

    response.status(503).json({
      success: false,
      requestId: response.getHeader("x-request-id"),
      ready: false,
      errorCode: "READINESS_CHECK_FAILED",
      message: "Retrieval readiness check failed"
    });
  }
};
