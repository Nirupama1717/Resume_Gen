export interface IngestionTimings {
  extractMs?: number;
  cleanMs?: number;
  parseMs?: number;
  embeddingMs?: number;
  mongoInsertMs?: number;
  totalMs?: number;
}

export interface IngestionResultData {
  name?: string;
  role?: string;
  company?: string;
  totalExperience?: number;
  skillsCount: number;
  embeddingModel: string;
  embeddingDimension: number;
}

export interface IngestionSuccessResponse {
  success: true;
  message: string;
  resumeId: string;
  data: IngestionResultData;
  timings: IngestionTimings;
}

export interface IngestionErrorResponse {
  success: false;
  requestId?: string;
  errorCode: string;
  message: string;
}

export type UploadProgressHandler = (progress: number) => void;

export interface UploadResumeOptions {
  baseUrl?: string;
  onProgress?: UploadProgressHandler;
  signal?: AbortSignal;
}
