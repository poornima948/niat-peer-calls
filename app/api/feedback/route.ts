import { NextResponse } from "next/server";
import { getMatch, updateMatch } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const m = b?.match_id ? await getMatch(String(b.match_id)) : null;
  if (!m) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  const trust = Number(b.trust_after);
  if (!(trust >= 1 && trust <= 10)) return NextResponse.json({ error: "Trust score must be 1-10" }, { status: 400 });

  await updateMatch(m.id, {
    trust_after: trust,
    resolved: !!b.resolved,
    feedback_note: String(b.note || "").slice(0, 500) || null,
    status: "completed",
  });
  return NextResponse.json({ ok: true });
}
