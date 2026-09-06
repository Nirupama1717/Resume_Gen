import { IngestionApiError } from "./ingestionApi";

const errorMessages: Record<string, string> = {
  RESUME_EXTRACTION_FAILED:
    "PDF extraction failed. Check that the file contains readable resume text.",
  RESUME_PARSE_FAILED: "Resume parsing failed. Please try another PDF.",
  EMBEDDING_FAILED:
    "Embedding generation failed. Please try again when the service is available.",
  INGESTION_FAILED:
    "Resume ingestion failed while saving the candidate. Please try again."
};

export function getIngestionErrorMessage(error: unknown): string {
  if (error instanceof IngestionApiError) {
    if (error.errorCode && errorMessages[error.errorCode]) {
      return errorMessages[error.errorCode];
    }

    if (error.status === 413) {
      return "The resume file is too large. Maximum file size is 5MB.";
    }

    if (error.status === 415) {
      return "Only PDF files are allowed.";
    }

    if (error.status === 0) {
      return error.message;
    }

    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Resume ingestion failed. Please try again.";
}
