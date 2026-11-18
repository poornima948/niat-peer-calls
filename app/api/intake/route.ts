import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { insertLead, insertMatch, listVolunteers } from "@/lib/db";
import { matchLead } from "@/lib/agent";
import { FEE_SHEET } from "@/lib/data";
import { notifyN8n, baseUrl } from "@/lib/notify";
import { Lead, Lang, Match } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  if (!b.consent) return NextResponse.json({ error: "Consent is required" }, { status: 400 });

  const phone = String(b.phone || "").replace(/[^\d+]/g, "");
  if (phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Enter a valid WhatsApp number" }, { status: 400 });
  const lang: Lang = ["en", "te", "hi"].includes(b.language) ? b.language : "en";
  const worry = String(b.worry_text || "").trim();
  if (worry.length < 8) return NextResponse.json({ error: "Please tell us your worry in a sentence" }, { status: 400 });

  const lead: Lead = {
    id: randomUUID(),
    parent_name: String(b.parent_name || "").slice(0, 80),
    phone,
    city: String(b.city || "").slice(0, 60),
    university_pref: String(b.university_pref || ""),
    fee_band: b.fee_band === "12-18" ? "12-18" : "8-12",
    language: lang,
    worry_text: worry.slice(0, 1000),
    trust_before: Math.min(10, Math.max(1, Number(b.trust_before) || 5)),
    created_at: new Date().toISOString(),
  };
  await insertLead(lead);

  const vols = await listVolunteers();
  const draft = await matchLead(lead, vols);
  const vol = vols.find((v) => v.id === draft.volunteer_id) ?? vols[0];

  const match: Match = {
    id: randomUUID(),
    lead_id: lead.id,
    ...draft,
    volunteer_id: vol.id,
    slot_chosen: null,
    status: "matched",
    trust_after: null,
    resolved: null,
    feedback_note: null,
    outcome: "pending",
    created_at: new Date().toISOString(),
  };
  await insertMatch(match);

  const whatsapp = await notifyN8n({
    event: "matched",
    match_id: match.id,
    parent: { name: lead.parent_name, phone: lead.phone, language: lead.language },
    volunteer: { name: vol.name, phone: vol.phone },
    parent_message: match.parent_message,
    brief_volunteer: match.brief_volunteer,
    slot_options: match.slot_options,
    feedback_url: `${baseUrl()}/feedback/${match.id}`,
  });

  return NextResponse.json({
    match_id: match.id,
    volunteer: { name: vol.name, city: vol.city, university: vol.university, child_year: vol.child_year, note: vol.note },
    concern_label: match.concern_label,
    parent_message: match.parent_message,
    brief_parent: match.brief_parent,
    slot_options: match.slot_options,
    fee_sheet: FEE_SHEET[lead.university_pref] ?? null,
    engine: match.engine,
    whatsapp,
  });
}
