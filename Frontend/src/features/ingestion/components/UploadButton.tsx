import type { ButtonHTMLAttributes } from "react";

interface UploadButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export function UploadButton({
  label = "Choose PDF",
  type = "button",
  ...props
}: UploadButtonProps) {
  return (
    <button type={type} {...props}>
      {label}
    </button>
  );
}
