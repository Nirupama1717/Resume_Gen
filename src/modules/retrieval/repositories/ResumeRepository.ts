import { Collection, ObjectId } from "mongodb";
import { getDatabase } from "../../../config/database";
import { env } from "../../../config/env";
import { SearchFilters } from "../types/retrieval.types";

export interface ResumeSearchDocument {
  _id: ObjectId;
  rawText?: string;
  name?: string;
  role?: string;
  company?: string;
  totalExperience?: number;
  skills?: string[];
  jobTitles?: string[];
  experienceSummary?: string;
  embedding?: number[];
  bm25Score?: number;
  vectorScore?: number;
}

export class ResumeRepository {
  async getCollection(): Promise<Collection<ResumeSearchDocument>> {
    const database = await getDatabase();
    return database.collection<ResumeSearchDocument>("resumes");
  }

  async searchBm25(
    query: string,
    filters: SearchFilters = {},
    topK = 20
  ): Promise<ResumeSearchDocument[]> {
    const limit = this.normalizeLimit(topK);
    const searchFilter = this.buildExperienceFilter(filters);
    const pipeline = [
      {
        $search: {
          index: env.atlasSearchIndex,
          compound: {
            must: [
              {
                text: {
                  query,
                  path: [
                    "rawText",
                    "skills",
                    "jobTitles",
                    "experienceSummary",
                    "role",
                    "company"
                  ]
                }
              }
            ],
            ...(searchFilter ? { filter: [searchFilter] } : {})
          }
        }
      },
      { $limit: limit },
      {
        $project: {
          rawText: 1,
          name: 1,
          role: 1,
          company: 1,
          totalExperience: 1,
          skills: 1,
          jobTitles: 1,
          experienceSummary: 1,
          bm25Score: { $meta: "searchScore" }
        }
      }
    ];

    return this.aggregate(pipeline);
  }

  async searchVector(
    queryVector: number[],
    filters: SearchFilters = {},
    topK = 20
  ): Promise<ResumeSearchDocument[]> {
    const limit = this.normalizeLimit(topK);
    const pipeline = [
      {
        $vectorSearch: {
          index: env.atlasVectorIndex,
          path: "embedding",
          queryVector,
          numCandidates: Math.max(limit * 10, 100),
          limit,
          ...(this.buildExperienceFilter(filters)
            ? { filter: this.buildExperienceFilter(filters) }
            : {})
        }
      },
      {
        $project: {
          rawText: 1,
          name: 1,
          role: 1,
          company: 1,
          totalExperience: 1,
          skills: 1,
          jobTitles: 1,
          experienceSummary: 1,
          vectorScore: { $meta: "vectorSearchScore" }
        }
      }
    ];

    return this.aggregate(pipeline);
  }

  async findById(resumeId: string): Promise<ResumeSearchDocument | null> {
    if (!ObjectId.isValid(resumeId)) {
      return null;
    }

    const collection = await this.getCollection();
    return collection.findOne(
      { _id: new ObjectId(resumeId) },
      {
        projection: {
          rawText: 1,
          name: 1,
          role: 1,
          company: 1,
          totalExperience: 1,
          skills: 1,
          jobTitles: 1,
          experienceSummary: 1,
          embedding: 1
        }
      }
    );
  }

  private async aggregate(pipeline: object[]): Promise<ResumeSearchDocument[]> {
    const collection = await this.getCollection();
    return collection.aggregate<ResumeSearchDocument>(pipeline).toArray();
  }

  private buildExperienceFilter(filters: SearchFilters): object | undefined {
    if (
      filters.minYearsExperience === undefined ||
      !Number.isFinite(filters.minYearsExperience)
    ) {
      return undefined;
    }

    return {
      range: {
        path: "totalExperience",
        gte: filters.minYearsExperience
      }
    };
  }

  private normalizeLimit(topK: number): number {
    return Math.min(Math.max(Math.floor(topK) || 1, 1), 100);
  }
}
