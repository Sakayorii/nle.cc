import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export interface DbEnv {
  DATABASE_URL?: string;
  HYPERDRIVE?: { connectionString: string };
}

let cached: PostgresJsDatabase<typeof schema> | undefined;

export function getDb(env: DbEnv): PostgresJsDatabase<typeof schema> {
  if (cached) return cached;
  const connectionString = env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "No database connection string. Bind a Hyperdrive database as HYPERDRIVE or set DATABASE_URL.",
    );
  }
  cached = drizzle(postgres(connectionString, { prepare: false }), {
    schema,
  });
  return cached;
}

export * from "./schema";
