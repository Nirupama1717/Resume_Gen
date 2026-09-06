import { useState } from "react";
import { UploadButton } from "./UploadButton";
import { UploadDropzone } from "./UploadDropzone";
import { UploadProgress } from "./UploadProgress";

interface ResumeUploadCardProps {
  onFileSelect?: (file: File) => void;
  isUploading?: boolean;
  progress?: number;
  error?: string;
  successMessage?: string;
}

export function ResumeUploadCard({
  onFileSelect,
  isUploading = false,
  progress = 0,
  error,
  successMessage
}: ResumeUploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File>();

  function handleFileSelect(file: File) {
    setSelectedFile(file);
    onFileSelect?.(file);
  }

  return (
    <section aria-labelledby="resume-upload-title">
      <div>
        <span>Resume ingestion</span>
        <h2 id="resume-upload-title">Add a candidate resume</h2>
        <p>Upload a PDF resume up to 5MB to begin processing.</p>
      </div>

      <UploadDropzone
        disabled={isUploading}
        error={error}
        onFileSelect={handleFileSelect}
      />

      {selectedFile && !isUploading && !successMessage && (
        <div aria-live="polite">
          <span>{selectedFile.name}</span>
          <UploadButton disabled={!selectedFile} label="Ready to process" />
        </div>
      )}

      {isUploading && <UploadProgress progress={progress} />}

      {successMessage && (
        <p aria-live="polite" role="status">
          {successMessage}
        </p>
      )}

      {error && !isUploading && <p role="alert">{error}</p>}
    </section>
  );
}
