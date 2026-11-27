import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/data";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(20).default(8),
  place: z.string().regex(/^[a-z0-9-]{1,120}$/).optional(),
});

/** Read-only, bounded autocomplete endpoint. */
export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ hits: [], error: "invalid query" }, { status: 400 });
  const hits = await getProvider().search(parsed.data.q, { limit: parsed.data.limit, areaSlug: parsed.data.place });
  return NextResponse.json({ hits }, { headers: { "cache-control": "no-store" } });
}
