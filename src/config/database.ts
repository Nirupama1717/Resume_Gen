import { Db, MongoClient } from "mongodb";
import { env } from "./env";

let client: MongoClient | undefined;
let databasePromise: Promise<Db> | undefined;

export function getDatabase(): Promise<Db> {
  if (!env.mongodbUri) {
    return Promise.reject(new Error("MONGODB_URI is not configured"));
  }

  if (!databasePromise) {
    client = new MongoClient(env.mongodbUri);
    databasePromise = client.connect().then(() => client!.db(env.mongodbDbName));
  }

  return databasePromise;
}

export async function checkDatabaseConnection(): Promise<number> {
  const startedAt = Date.now();
  const database = await getDatabase();

  await database.command({ ping: 1 });
  await database.collection("resumes").findOne({}, { projection: { _id: 1 } });

  return Date.now() - startedAt;
}
