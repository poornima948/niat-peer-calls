import { NextResponse } from "next/server";
import { getMatch, updateMatch } from "@/lib/db";
import { dashboardKey } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Counsellor marks whether the parent finally paid. This is the experiment's main metric.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || b.key !== dashboardKey()) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  if (!["paid", "not_paid", "pending"].includes(b.outcome)) return NextResponse.json({ error: "Bad outcome" }, { status: 400 });
  const m = await getMatch(String(b.match_id));
  if (!m) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  await updateMatch(m.id, { outcome: b.outcome });
  return NextResponse.json({ ok: true });
}
