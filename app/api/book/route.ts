import { NextResponse } from "next/server";
import { getLead, getMatch, listVolunteers, updateMatch } from "@/lib/db";
import { notifyN8n, baseUrl } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const m = b?.match_id ? await getMatch(String(b.match_id)) : null;
  if (!m) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  const slot = String(b.slot || "");
  if (!m.slot_options.includes(slot)) return NextResponse.json({ error: "Invalid slot" }, { status: 400 });

  await updateMatch(m.id, { slot_chosen: slot, status: "booked" });
  const lead = await getLead(m.lead_id);
  const vol = (await listVolunteers()).find((v) => v.id === m.volunteer_id);

  const whatsapp = await notifyN8n({
    event: "booked",
    match_id: m.id,
    slot,
    parent: lead ? { name: lead.parent_name, phone: lead.phone, language: lead.language } : null,
    volunteer: vol ? { name: vol.name, phone: vol.phone } : null,
    feedback_url: `${baseUrl()}/feedback/${m.id}`,
  });
  return NextResponse.json({ ok: true, whatsapp });
}
