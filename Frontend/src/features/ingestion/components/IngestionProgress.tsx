import type { IngestionStatus } from "../stores/ingestionStore";

export type IngestionStage =
  | "upload"
  | "processing"
  | "parsing"
  | "embedding"
  | "storing"
  | "completed";

interface IngestionProgressProps {
  progress: number;
  status?: IngestionStatus;
  stage?: IngestionStage;
  error?: string;
}

const stages: Array<{ id: IngestionStage; label: string }> = [
  { id: "upload", label: "Resume Upload" },
  { id: "processing", label: "PDF Processing" },
  { id: "parsing", label: "Resume Parsing" },
  { id: "embedding", label: "Embedding Generation" },
  { id: "storing", label: "MongoDB Ingestion" },
  { id: "completed", label: "Completed" }
];

function stageFromProgress(progress: number): IngestionStage {
  if (progress >= 100) return "completed";
  if (progress >= 80) return "storing";
  if (progress >= 60) return "embedding";
  if (progress >= 40) return "parsing";
  if (progress >= 20) return "processing";
  return "upload";
}

export function IngestionProgress({
  progress,
  status = "uploading",
  stage,
  error
}: IngestionProgressProps) {
  const boundedProgress = Math.min(100, Math.max(0, progress));
  const activeStage = stage ?? stageFromProgress(boundedProgress);
  const activeIndex = stages.findIndex(({ id }) => id === activeStage);

  return (
    <section aria-label="Resume ingestion progress" aria-live="polite">
      <div
        aria-label={`Ingestion progress: ${boundedProgress}%`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={boundedProgress}
        role="progressbar"
      >
        <div style={{ width: `${boundedProgress}%` }} />
      </div>

      <ol>
        {stages.map((item, index) => {
          const isComplete = status === "success" || index < activeIndex;
          const isActive = status === "uploading" && index === activeIndex;

          return (
            <li
              aria-current={isActive ? "step" : undefined}
              data-state={
                isComplete ? "complete" : isActive ? "active" : "pending"
              }
              key={item.id}
            >
              <span aria-hidden="true">{isComplete ? "✓" : index + 1}</span>
              <span>{item.label}</span>
            </li>
          );
        })}
      </ol>

      {error && <p role="alert">{error}</p>}
    </section>
  );
}
