import { useRef, useState, type DragEvent } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  error?: string;
}

function validatePdf(file: File): string | undefined {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "Only PDF files are allowed";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Maximum file size is 5MB";
  }

  return undefined;
}

export function UploadDropzone({
  onFileSelect,
  disabled = false,
  error
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string>();

  function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const nextError = validatePdf(file);
    setValidationError(nextError);
    if (!nextError) {
      onFileSelect(file);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFile(event.dataTransfer.files[0]);
    }
  }

  return (
    <div
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        accept="application/pdf,.pdf"
        aria-label="Choose a resume PDF"
        disabled={disabled}
        hidden
        onChange={(event) => handleFile(event.target.files?.[0])}
        type="file"
      />
      <strong>{isDragging ? "Drop your resume here" : "Upload resume PDF"}</strong>
      <span>Drag and drop a PDF, or choose a file</span>
      {(validationError || error) && (
        <p role="alert">{validationError ?? error}</p>
      )}
    </div>
  );
}
