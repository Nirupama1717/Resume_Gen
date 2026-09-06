import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";

const uploadsDirectory = path.resolve(process.cwd(), "uploads");

mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadsDirectory);
  },
  filename: (_request, _file, callback) => {
    callback(null, `${randomUUID()}.pdf`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_request, file, callback) => {
    const isPdfExtension = path.extname(file.originalname).toLowerCase() === ".pdf";
    const isPdfMimeType = file.mimetype === "application/pdf";

    if (!isPdfExtension || !isPdfMimeType) {
      callback(
        Object.assign(new Error("Only PDF files are allowed"), {
          code: "INVALID_FILE_TYPE"
        })
      );
      return;
    }

    callback(null, true);
  }
});