interface UploadProgressProps {
  progress: number;
  status?: "uploading" | "success" | "error";
  message?: string;
}

export function UploadProgress({
  progress,
  status = "uploading",
  message
}: UploadProgressProps) {
  const boundedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div aria-live="polite" aria-atomic="true">
      <div
        aria-label={`Upload progress: ${boundedProgress}%`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={boundedProgress}
        role="progressbar"
      >
        <div style={{ width: `${boundedProgress}%` }} />
      </div>
      <span>
        {message ??
          (status === "success"
            ? "Upload complete"
            : status === "error"
              ? "Upload failed"
              : `Uploading ${boundedProgress}%`)}
      </span>
    </div>
  );
}
