import { unlink } from "node:fs/promises";
import { Request, Response } from "express";
import { env } from "../../../config/env";
import { detectSkills } from "../../../config/skills";
import { AlgorithmResumeParser } from "../services/AlgorithmResumeParser";
import { LLMResumeParser } from "../services/LLMResumeParser";
import { EmbeddingService } from "../services/EmbeddingService";
import { ResumeParserService } from "../services/ResumeParserService";
import { ResumeIngestionRepository } from "../repositories/ResumeIngestionRepository";
import {
  ResumeIngestionError,
  ResumeIngestionService
} from "../services/ResumeIngestionService";
import { cleanResumeText } from "../utils/textCleaner";

const resumeParserService = new ResumeParserService();
const algorithmResumeParser = new AlgorithmResumeParser();
const llmResumeParser = new LLMResumeParser();
const embeddingService = new EmbeddingService();
const resumeIngestionRepository = new ResumeIngestionRepository();
const resumeIngestionService = new ResumeIngestionService();

function sendError(
  response: Response,
  statusCode: number,
  errorCode: string,
  message: string
): void {
  response.status(statusCode).json({
    success: false,
    requestId: response.getHeader("x-request-id"),
    errorCode,
    message
  });
}

export function getIngestionHealth(
  _request: Request,
  response: Response
): void {
  response.status(200).json({
    status: "ok",
    module: "resume-ingestion"
  });
}

export function uploadResume(request: Request, response: Response): void {
  if (!request.file) {
    sendError(response, 400, "FILE_REQUIRED", "Resume PDF is required");
    return;
  }

  response.status(200).json({
    success: true,
    message: "Resume uploaded successfully",
    file: {
      originalName: request.file.originalname,
      mimeType: request.file.mimetype,
      size: request.file.size
    }
  });
}

export async function extractResume(
  request: Request,
  response: Response
): Promise<void> {
  if (!request.file) {
    sendError(response, 400, "FILE_REQUIRED", "Resume PDF is required");
    return;
  }

  try {
    const rawText = await resumeParserService.extractTextFromPdf(
      request.file.path
    );

    if (!rawText) {
      sendError(
				response,
				422,
				"RESUME_EXTRACTION_FAILED",
				"Resume extraction failed"
			);
      return;
    }

    response.status(200).json({
      success: true,
      rawText,
      characters: rawText.length
    });
  } catch (error) {
    console.error(error);
    sendError(
			response,
			422,
			"RESUME_EXTRACTION_FAILED",
			"Resume extraction failed"
		);
  } finally {
    await unlink(request.file.path).catch(() => undefined);
  }
}

export function cleanResume(request: Request, response: Response): void {
  const { rawText } = request.body as { rawText?: unknown };

  if (typeof rawText !== "string") {
    sendError(response, 400, "RAW_TEXT_REQUIRED", "rawText is required");
    return;
  }

  response.status(200).json({
    success: true,
    cleanText: cleanResumeText(rawText)
  });
}

export function detectResumeSkills(
  request: Request,
  response: Response
): void {
  const { rawText } = request.body as { rawText?: unknown };

  if (typeof rawText !== "string") {
    sendError(response, 400, "RAW_TEXT_REQUIRED", "rawText is required");
    return;
  }

  response.status(200).json({
    success: true,
    skills: detectSkills(rawText)
  });
}

export function parseResume(request: Request, response: Response): void {
  const { rawText } = request.body as { rawText?: unknown };

  if (typeof rawText !== "string") {
    sendError(response, 400, "RAW_TEXT_REQUIRED", "rawText is required");
    return;
  }

  try {
    const parser = env.useLlmParser ? llmResumeParser : algorithmResumeParser;

    response.status(200).json({
      success: true,
      resume: parser.parseResume(rawText)
    });
  } catch (error) {
    console.error(error);
    sendError(
			response,
			503,
			"LLM_PARSER_NOT_CONFIGURED",
			"LLM resume parser is not configured"
		);
  }
}

export function llmParseResume(
  request: Request,
  response: Response
): void {
  const { rawText } = request.body as { rawText?: unknown };

  if (typeof rawText !== "string") {
    sendError(response, 400, "RAW_TEXT_REQUIRED", "rawText is required");
    return;
  }

  if (!env.useLlmParser) {
    sendError(
			response,
			503,
			"LLM_PARSER_DISABLED",
			"LLM resume parser is disabled"
		);
    return;
  }

  try {
    response.status(200).json({
      success: true,
      resume: llmResumeParser.parseResume(rawText)
    });
  } catch (error) {
    console.error(error);
    sendError(
			response,
			503,
			"LLM_PARSER_NOT_CONFIGURED",
			"LLM resume parser is not configured"
		);
  }
}

export async function embedResume(
  request: Request,
  response: Response
): Promise<void> {
  const {
    name,
    role,
    skills,
    company,
    experienceSummary,
    rawText
  } = request.body as {
    name?: unknown;
    role?: unknown;
    skills?: unknown;
    company?: unknown;
    experienceSummary?: unknown;
    rawText?: unknown;
  };

  if (
    typeof rawText !== "string" ||
    !Array.isArray(skills) ||
    skills.some((skill) => typeof skill !== "string")
  ) {
    sendError(
			response,
			400,
			"EMBEDDING_INPUT_INVALID",
			"rawText and skills are required for embedding"
		);
    return;
  }

  const embeddingText = [
    typeof name === "string" ? name : "",
    typeof role === "string" ? role : "",
    skills.join(", "),
    typeof company === "string" ? company : "",
    typeof experienceSummary === "string" ? experienceSummary : "",
    rawText
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const embedding = await embeddingService.createEmbedding(embeddingText);

    response.status(200).json({
      success: true,
      model: env.mistralEmbedModel,
      dimension: embedding.length,
      embedding
    });
  } catch (error) {
    console.error(error);
    sendError(response, 502, "EMBEDDING_FAILED", "Mistral embedding failed");
  }
}

export async function storeResume(
  request: Request,
  response: Response
): Promise<void> {
  const { fileName, resume, rawText, embedding } = request.body as {
    fileName?: unknown;
    resume?: unknown;
    rawText?: unknown;
    embedding?: unknown;
  };
  const resumeData = resume as Record<string, unknown> | undefined;

  if (
    typeof fileName !== "string" ||
    fileName.trim().length === 0 ||
    typeof rawText !== "string" ||
    rawText.trim().length === 0 ||
    !resumeData ||
    !Array.isArray(resumeData.skills) ||
    resumeData.skills.some((skill) => typeof skill !== "string") ||
    !Array.isArray(embedding) ||
    embedding.length !== env.embeddingDimension ||
    embedding.some(
      (value) => typeof value !== "number" || !Number.isFinite(value)
    )
  ) {
    sendError(
			response,
			400,
			"RESUME_STORAGE_INPUT_INVALID",
			"fileName, resume metadata, rawText and a valid embedding are required"
		);
    return;
  }

  try {
    const resumeId = await resumeIngestionRepository.insertResume(
      fileName,
      rawText,
      resumeData as never,
      embedding
    );

    response.status(200).json({
      success: true,
      message: "Resume stored successfully",
      resumeId
    });
  } catch (error) {
    console.error(error);
    sendError(response, 503, "INGESTION_FAILED", "Resume ingestion failed");
  }
}

export async function ingestResume(
  request: Request,
  response: Response
): Promise<void> {
  if (!request.file) {
    sendError(response, 400, "FILE_REQUIRED", "Resume PDF is required");
    return;
  }

  try {
    const result = await resumeIngestionService.ingestResume(request.file);

    response.locals.fileName = request.file.originalname;
    response.locals.ingestionTimings = result.timings;

    response.status(200).json({
      success: true,
      message: "Resume ingestion completed",
      resumeId: result.resumeId,
      data: {
        name: result.resume.name,
        role: result.resume.role,
        company: result.resume.company,
        totalExperience: result.resume.totalExperience,
        skillsCount: result.resume.skills.length,
        embeddingModel: result.embeddingModel,
        embeddingDimension: result.embeddingDimension
      },
      timings: result.timings
    });
  } catch (error) {
    if (error instanceof ResumeIngestionError) {
      sendError(response, error.statusCode, error.errorCode, error.message);
      return;
    }

    console.error(error);
    sendError(response, 503, "INGESTION_FAILED", "Resume ingestion failed");
  }
}
