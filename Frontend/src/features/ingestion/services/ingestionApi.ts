import type {
  IngestionErrorResponse,
  IngestionSuccessResponse,
  UploadResumeOptions
} from "../types/ingestion.types";

const DEFAULT_API_BASE_URL = "http://localhost:3000";

export class IngestionApiError extends Error {
  readonly errorCode?: string;
  readonly requestId?: string;
  readonly status: number;

  constructor(
    message: string,
    status: number,
    details?: Partial<IngestionErrorResponse>
  ) {
    super(message);
    this.name = "IngestionApiError";
    this.status = status;
    this.errorCode = details?.errorCode;
    this.requestId = details?.requestId;
  }
}

export function uploadResume(
  file: File,
  options: UploadResumeOptions = {}
): Promise<IngestionSuccessResponse> {
  const baseUrl = options.baseUrl ?? DEFAULT_API_BASE_URL;
  const formData = new FormData();
  formData.append("file", file);

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const endpoint = `${baseUrl.replace(/\/$/, "")}/v1/resume/ingest`;

    const abortRequest = () => request.abort();
    options.signal?.addEventListener("abort", abortRequest, { once: true });

    request.open("POST", endpoint);
    request.responseType = "json";

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        options.onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onerror = () => {
      cleanup();
      reject(new IngestionApiError("Network error while uploading resume", 0));
    };

    request.onabort = () => {
      cleanup();
      reject(new IngestionApiError("Resume upload was cancelled", 0));
    };

    request.onload = () => {
      cleanup();
      const payload = request.response as
        | IngestionSuccessResponse
        | IngestionErrorResponse
        | null;

      if (request.status >= 200 && request.status < 300 && payload?.success) {
        options.onProgress?.(100);
        resolve(payload);
        return;
      }

      const errorPayload = payload as IngestionErrorResponse | null;
      reject(
        new IngestionApiError(
          errorPayload?.message ?? "Resume ingestion failed",
          request.status,
          errorPayload ?? undefined
        )
      );
    };

    function cleanup() {
      options.signal?.removeEventListener("abort", abortRequest);
    }

    request.send(formData);
  });
}
