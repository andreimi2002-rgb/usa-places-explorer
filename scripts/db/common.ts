import pg from "pg";

/** Load .env.local / .env for CLI scripts (Next.js loads these itself). */
export function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(f);
    } catch {
      /* optional */
    }
  }
}

export const LOCAL_OWNER_URL = "postgres://a360_owner:a360_local_dev@127.0.0.1:5433/america360";

export function ownerUrl(): string {
  loadEnv();
  return process.env.DATABASE_URL ?? LOCAL_OWNER_URL;
}

export async function withClient<T>(url: string, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}
