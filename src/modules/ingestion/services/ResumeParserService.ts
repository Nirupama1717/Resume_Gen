import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";

export class ResumeParserService {
	async extractTextFromPdf(filePath: string): Promise<string> {
		const fileBuffer = await readFile(filePath);
		const parser = new PDFParse({ data: fileBuffer });

		try {
			const result = await parser.getText();
			return result.text.trim();
		} finally {
			await parser.destroy();
		}
	}
}
