import { detectSkills } from "../../../config/skills";
import {
	EMAIL_REGEX,
	EXPERIENCE_REGEX,
	PHONE_REGEX
} from "../utils/regex";
import { ParsedResume } from "../types/ingestion.types";

const ROLE_PATTERN =
	/\b(test|qa|quality|software|automation|data|product|project|engineering|senior|lead|principal|architect|developer|engineer|analyst|manager|consultant|sdet)\b/i;
const EDUCATION_PATTERN =
	/\b(b\.?\s*tech|b\.?\s*e\.?|m\.?\s*tech|m\.?\s*e\.?|bachelor|master|ph\.?d|university|college|\bgraduat(?:e|ion))\b/i;
const COMPANY_PATTERN =
	/\b(private limited|pvt\.?\s*ltd\.?|limited|ltd\.?|inc\.?|corporation|technologies|solutions|company| llc)\b/i;

const SKILL_ALIASES = [
	"Selenium WebDriver",
	"Core Java",
	"REST Assured"
] as const;

function getLines(rawText: string): string[] {
	return rawText
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
}

function firstMatchingLine(lines: string[], pattern: RegExp): string | undefined {
	return lines.find((line) => pattern.test(line));
}

function extractName(lines: string[]): string | undefined {
	return lines.find(
		(line) =>
			!EMAIL_REGEX.test(line) &&
			!PHONE_REGEX.test(line) &&
			!ROLE_PATTERN.test(line) &&
			!COMPANY_PATTERN.test(line) &&
			!EDUCATION_PATTERN.test(line) &&
			/^[A-Z][A-Za-z.'-]*(\s+[A-Z][A-Za-z.'-]*){1,4}$/.test(line)
	);
}

function extractSkills(rawText: string): string[] {
	const detectedSkills = detectSkills(rawText);
	const aliasSkills = SKILL_ALIASES.filter((skill) => {
		const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		return new RegExp(
			`(?<![A-Za-z0-9])${escapedSkill}(?![A-Za-z0-9])`,
			"i"
		).test(rawText);
	});
	const preferredSkillNames = new Map<string, string>([
		["Java", "Core Java"],
		["Selenium", "Selenium WebDriver"]
	]);

	return [
		...new Set(
			detectedSkills.map((skill) =>
				(skill === "Java" && aliasSkills.includes("Core Java")) ||
				(skill === "Selenium" && aliasSkills.includes("Selenium WebDriver"))
					? preferredSkillNames.get(skill) ?? skill
					: skill
			)
		)
	];
}

export class AlgorithmResumeParser {
	parseResume(rawText: string): ParsedResume {
		const lines = getLines(rawText);
		const result: ParsedResume = {
			skills: extractSkills(rawText)
		};

		const email = rawText.match(EMAIL_REGEX)?.[0];
		const phone = rawText.match(PHONE_REGEX)?.[0];
		const experience = rawText.match(EXPERIENCE_REGEX)?.[1];
		const role = firstMatchingLine(lines, ROLE_PATTERN);
		const company = firstMatchingLine(lines, COMPANY_PATTERN);
		const education = firstMatchingLine(lines, EDUCATION_PATTERN);

		if (email) result.email = email;
		if (phone) result.phone = phone;
		if (experience) result.totalExperience = Number(experience);
		if (role) result.role = role;
		if (company) result.company = company;
		if (education) result.education = education;

		const name = extractName(lines);
		if (name) result.name = name;

		const jobTitles = lines.filter(
			(line) => ROLE_PATTERN.test(line) && !COMPANY_PATTERN.test(line)
		);
		if (jobTitles.length > 0) result.jobTitles = jobTitles;

		return result;
	}
}
