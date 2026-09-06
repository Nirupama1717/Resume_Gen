import { Collection } from "mongodb";
import { getDatabase } from "../../../config/database";

export class ResumeRepository {
  async getCollection(): Promise<Collection> {
    const database = await getDatabase();
    return database.collection("resumes");
  }
}
