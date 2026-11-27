import { createHash } from "node:crypto";

/**
 * Deterministic UUID v5 (RFC 9562) so that fixture mode and database mode
 * share the same stable identifiers and repeated seeds are idempotent.
 */
const NAMESPACE = "6f1d6a3e-8a7b-5c1e-9d2f-a360a360a360";

function uuidToBytes(uuid: string): Buffer {
  return Buffer.from(uuid.replace(/-/g, ""), "hex");
}

export function uuidV5(name: string, namespace: string = NAMESPACE): string {
  const hash = createHash("sha1").update(uuidToBytes(namespace)).update(name, "utf8").digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type IdKind = "area" | "entity" | "category" | "fact" | "media" | "relation";

export function stableId(kind: IdKind, key: string): string {
  return uuidV5(`${kind}:${key}`);
}
