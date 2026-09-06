jest.mock("../src/config/database", () => ({
  getDatabase: jest.fn()
}));

import { getDatabase } from "../src/config/database";
import { ResumeRepository } from "../src/modules/retrieval/repositories/ResumeRepository";

const mockedGetDatabase = jest.mocked(getDatabase);

function mockCollection() {
  const toArray = jest.fn().mockResolvedValue([]);
  const aggregate = jest.fn().mockReturnValue({ toArray });
  const findOne = jest.fn().mockResolvedValue(null);
  const collection = { aggregate, findOne };

  mockedGetDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue(collection)
  } as never);

  return { aggregate, findOne, toArray };
}

describe("ResumeRepository", () => {
  beforeEach(() => {
    mockedGetDatabase.mockReset();
  });

  test("builds a BM25 pipeline across resume text and metadata", async () => {
    const { aggregate } = mockCollection();

    await new ResumeRepository().searchBm25(
      "agentic QA architect",
      { minYearsExperience: 10 },
      20
    );

    const pipeline = aggregate.mock.calls[0][0];
    expect(pipeline).toEqual([
      expect.objectContaining({
        $search: {
          index: "resume_bm25",
          compound: {
            must: [
              {
                text: {
                  query: "agentic QA architect",
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
            filter: [
              {
                range: {
                  path: "totalExperience",
                  gte: 10
                }
              }
            ]
          }
        }
      }),
      { $limit: 20 },
      expect.objectContaining({
        $project: expect.objectContaining({
          bm25Score: { $meta: "searchScore" }
        })
      })
    ]);
  });

  test("builds a vector pipeline with bounded candidates", async () => {
    const { aggregate } = mockCollection();
    const vector = [0.1, 0.2];

    await new ResumeRepository().searchVector(vector, {}, 5);

    const pipeline = aggregate.mock.calls[0][0];
    expect(pipeline).toEqual([
      {
        $vectorSearch: {
          index: "resume_vector",
          path: "embedding",
          queryVector: vector,
          numCandidates: 100,
          limit: 5
        }
      },
      expect.objectContaining({
        $project: expect.objectContaining({
          vectorScore: { $meta: "vectorSearchScore" }
        })
      })
    ]);
  });

  test("looks up valid resume IDs and ignores invalid IDs", async () => {
    const { findOne } = mockCollection();
    const resumeId = "507f1f77bcf86cd799439011";

    await new ResumeRepository().findById(resumeId);
    await new ResumeRepository().findById("invalid-id");

    expect(findOne).toHaveBeenCalledTimes(1);
    expect(findOne.mock.calls[0][0]).toMatchObject({
      _id: expect.objectContaining({
        toHexString: expect.any(Function)
      })
    });
  });
});
