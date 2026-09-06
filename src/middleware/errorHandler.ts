import { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next
): void => {
  const uploadError = error as { code?: string };

  if (uploadError.code === "LIMIT_FILE_SIZE") {
    response.status(413).json({
      success: false,
      requestId: response.getHeader("x-request-id"),
      errorCode: "FILE_TOO_LARGE",
      message: "Resume exceeds maximum upload size"
    });
    return;
  }

  if (uploadError.code === "INVALID_FILE_TYPE") {
    response.status(415).json({
      success: false,
      requestId: response.getHeader("x-request-id"),
      errorCode: "INVALID_FILE_TYPE",
      message: "Only PDF files are allowed"
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    success: false,
    requestId: response.getHeader("x-request-id"),
    errorCode: "INGESTION_FAILED",
    message: "Resume ingestion failed"
  });
};
