/**
 * Apply versioned SQL migrations from supabase/migrations in order, each in its
 * own transaction, recording filename + checksum. Re-running is a no-op; an
 * edited, already-applied migration is refused. Then ensures the least-privilege
 * login role used by the website (a360_reader).
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { ownerUrl, withClient } from "./common";

const DIR = path.resolve(import.meta.dirname, "..", "..", "supabase", "migrations");

export async function migrate(url = ownerUrl(), log = console.log) {
  return withClient(url, async (c) => {
    await c.query(`create table if not exists public.a360_schema_migrations (
      filename text primary key, checksum text not null, applied_at timestamptz not null default now())`);
    const applied = new Map((await c.query<{ filename: string; checksum: string }>("select filename, checksum from public.a360_schema_migrations")).rows.map((r) => [r.filename, r.checksum]));
    const files = readdirSync(DIR).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
    let ran = 0;
    for (const f of files) {
      const sql = readFileSync(path.join(DIR, f), "utf8");
      const sum = createHash("sha256").update(sql).digest("hex");
      const prev = applied.get(f);
      if (prev) {
        if (prev !== sum) throw new Error(`Migration ${f} was modified after being applied. Create a new migration instead.`);
        continue;
      }
      log(`applying ${f}`);
      await c.query("begin");
      try {
        await c.query(sql);
        await c.query("insert into public.a360_schema_migrations (filename, checksum) values ($1, $2)", [f, sum]);
        await c.query("commit");
        ran++;
      } catch (e) {
        await c.query("rollback");
        throw new Error(`Migration ${f} failed: ${(e as Error).message}`);
      }
    }
    // Login role for the website: read-only via a360_read.
    const pw = process.env.A360_READER_PASSWORD && process.env.A360_READER_PASSWORD !== "CHANGE_ME" ? process.env.A360_READER_PASSWORD : "a360_reader_local_dev";
    const exists = (await c.query("select 1 from pg_roles where rolname = 'a360_reader'")).rowCount;
    const escaped = pw.replace(/'/g, "''");
    await c.query(exists ? `alter role a360_reader with login password '${escaped}'` : `create role a360_reader with login password '${escaped}'`);
    await c.query("grant a360_read to a360_reader");
    await c.query("alter role a360_reader set search_path = a360, public");
    const db = (await c.query<{ db: string }>("select current_database() as db")).rows[0]!.db;
    await c.query(`grant connect on database "${db}" to a360_reader`);
    log(`${ran} migration(s) applied, ${files.length - ran} already up to date; role a360_reader ready`);
    return { applied: ran, total: files.length };
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  migrate().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
