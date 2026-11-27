/**
 * Drop and recreate the America 360 schema in the LOCAL database, then migrate
 * and seed. Refuses to run against a non-local host.
 */
import { migrate } from "./migrate";
import { seed } from "./seed";
import { ownerUrl, withClient } from "./common";

const url = ownerUrl();
const host = new URL(url).hostname;
if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
  console.error(`Refusing to reset non-local database host ${host}`);
  process.exit(1);
}

await withClient(url, async (c) => {
  await c.query("drop schema if exists a360 cascade");
  await c.query("drop table if exists public.a360_schema_migrations");
});
console.log("schema a360 dropped (local)");
await migrate(url);
await seed(url);
