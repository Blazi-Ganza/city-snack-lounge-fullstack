import { MongoClient, type Db } from "mongodb";
import { env } from "../config/env";
import { ensureEventIndexes } from "./events.repo";


let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo() {
  if (db) {
    return db;
  }

  client = new MongoClient(env.DATABASE_URL);
  await client.connect();
  db = client.db();
  await ensureEventIndexes();

  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("MongoDB is not connected. Call connectMongo() first.");
  }

  return db;
}

export async function closeMongo() {
  if (!client) {
    return;
  }

  await client.close();
  client = null;
  db = null;
}
