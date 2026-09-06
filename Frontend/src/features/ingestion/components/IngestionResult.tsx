import type { IngestionSuccessResponse } from "../types/ingestion.types";

interface IngestionResultProps {
  result: IngestionSuccessResponse;
  onUploadAnother?: () => void;
}

const successItems = [
  "Resume uploaded successfully",
  "Embedding generated successfully",
  "MongoDB ingestion completed",
  "Vector search ready"
] as const;

export function IngestionResult({
  result,
  onUploadAnother
}: IngestionResultProps) {
  return (
    <section aria-labelledby="ingestion-result-title" role="status">
      <div aria-hidden="true">✓</div>
      <span>Ingestion complete</span>
      <h2 id="ingestion-result-title">Resume is ready to search</h2>

      <ul>
        {successItems.map((item) => (
          <li key={item}>
            <span aria-hidden="true">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <dl>
        {result.data.name && (
          <div>
            <dt>Candidate</dt>
            <dd>{result.data.name}</dd>
          </div>
        )}
        {result.data.role && (
          <div>
            <dt>Role</dt>
            <dd>{result.data.role}</dd>
          </div>
        )}
        <div>
          <dt>Skills detected</dt>
          <dd>{result.data.skillsCount}</dd>
        </div>
        <div>
          <dt>Embedding</dt>
          <dd>
            {result.data.embeddingModel} · {result.data.embeddingDimension} dimensions
          </dd>
        </div>
      </dl>

      {onUploadAnother && (
        <button type="button" onClick={onUploadAnother}>
          Upload another resume
        </button>
      )}
    </section>
  );
}
