const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

export const ingestionValidationMessages = {
  empty: "Please select a file",
  invalidType: "Only PDF files are allowed",
  tooLarge: "Maximum file size is 5MB"
} as const;

export function validateResumeFile(file?: File): string | undefined {
  if (!file) {
    return ingestionValidationMessages.empty;
  }

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return ingestionValidationMessages.invalidType;
  }

  if (file.size > MAX_RESUME_SIZE_BYTES) {
    return ingestionValidationMessages.tooLarge;
  }

  return undefined;
}
