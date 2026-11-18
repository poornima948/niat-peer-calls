import Anthropic from "@anthropic-ai/sdk";
import { FEE_SHEET } from "./data";
import { CONCERNS, Lang, Lead, Match, Volunteer } from "./types";

export type MatchDraft = Pick<
  Match,
  "volunteer_id" | "concern_label" | "brief_parent" | "brief_volunteer" | "parent_message" | "slot_options" | "reasoning" | "engine"
>;

const LANG_NAME: Record<Lang, string> = { en: "English", te: "Telugu", hi: "Hindi" };

// ---------- scoring shared by the tool and the fallback ----------
function score(v: Volunteer, lead: { city?: string; university?: string; fee_band?: string; language?: string }): number {
  let s = 0;
  if (lead.university && v.university === lead.university) s += 3;
  if (lead.city && v.city.toLowerCase() === lead.city.toLowerCase()) s += 2;
  if (lead.fee_band && v.fee_band === lead.fee_band) s += 2;
  if (lead.language && v.languages.includes(lead.language as Lang)) s += 2;
  return s;
}

function publicVolunteer(v: Volunteer, s: number) {
  // never expose phone to the model or the parent
  return { id: v.id, name: v.name, city: v.city, university: v.university, fee_band: v.fee_band, languages: v.languages, child_year: v.child_year, note: v.note, slots: v.slots, score: s };
}

// ---------- rule-based fallback (demo mode, or if the API call fails) ----------
const KEYWORDS: Record<string, string[]> = {
  fee_structure: ["fee", "cost", "lakh", "pay", "expensive", "money", "rupee", "rank", "kcet", "eamcet", "emi", "loan"],
  degree_validity: ["degree", "ugc", "aicte", "valid", "recogni", "legit", "scam", "genuine", "fake", "certificate"],
  placements: ["placement", "job", "salary", "package", "lpa", "internship", "company"],
  hostel_safety: ["hostel", "safe", "safety", "food", "campus", "girl", "daughter"],
  teaching_quality: ["teach", "faculty", "curriculum", "syllabus", "quality", "coding", "mentor"],
};

function classify(text: string): string {
  const t = text.toLowerCase();
  let best = "other";
  let bestN = 0;
  for (const [label, words] of Object.entries(KEYWORDS)) {
    const n = words.filter((w) => t.includes(w)).length;
    if (n > bestN) { best = label; bestN = n; }
  }
  return best;
}

const MESSAGES: Record<Lang, (v: Volunteer, c: string) => string> = {
  en: (v, c) => `Thank you for sharing your concern about ${c.replace("_", " ")}. We would like to connect you with ${v.name}, a parent whose child is already at NIAT. This is a parent-to-parent chat, not a sales call. Please pick a time that suits you.`,
  te: (v, c) => `మీ ఆందోళనను పంచుకున్నందుకు ధన్యవాదాలు (${c.replace("_", " ")}). NIATలో తమ పిల్లలు చదువుతున్న ${v.name} గారితో మిమ్మల్ని కలుపుతున్నాము. ఇది తల్లిదండ్రుల మధ్య సంభాషణ మాత్రమే, సేల్స్ కాల్ కాదు. మీకు అనుకూలమైన సమయాన్ని ఎంచుకోండి.`,
  hi: (v, c) => `अपनी चिंता (${c.replace("_", " ")}) साझा करने के लिए धन्यवाद। हम आपको ${v.name} से मिलवाना चाहते हैं, जिनका बच्चा पहले से NIAT में पढ़ रहा है। यह अभिभावक से अभिभावक की बातचीत है, सेल्स कॉल नहीं। कृपया अपने लिए सुविधाजनक समय चुनें।`,
};

export function heuristicMatch(lead: Lead, vols: Volunteer[]): MatchDraft {
  const ranked = vols
    .map((v) => ({ v, s: score(v, { city: lead.city, university: lead.university_pref, fee_band: lead.fee_band, language: lead.language }) }))
    .sort((a, b) => b.s - a.s);
  const best = ranked[0].v;
  const concern = classify(lead.worry_text);
  return {
    volunteer_id: best.id,
    concern_label: concern,
    brief_parent: `Questions you may want to ask ${best.name}: what did you worry about before paying, what did you check yourself, and what would you tell a parent in your position?`,
    brief_volunteer: `The parent's main concern is ${concern.replace("_", " ")}: "${lead.worry_text.slice(0, 200)}". Please share what you really experienced, including the parts that were hard. You are not expected to promote NIAT.`,
    parent_message: MESSAGES[lead.language](best, concern),
    slot_options: best.slots,
    reasoning: `Rule-based match (score ${ranked[0].s}): university, city, fee band and language compared.`,
    engine: "heuristic",
  };
}

// ---------- the Claude agent ----------
const TOOLS: any[] = [
  {
    name: "search_volunteers",
    description: "Search volunteer NIAT parents. Returns up to 5 ranked by fit (university, city, fee band, language). Never returns phone numbers.",
    input_schema: {
      type: "object",
      properties: {
        city: { type: "string" },
        university: { type: "string" },
        fee_band: { type: "string", enum: ["8-12", "12-18"] },
        language: { type: "string", enum: ["en", "te", "hi"] },
      },
    },
  },
  {
    name: "get_fee_sheet",
    description: "Get the per-year fee split (university fee vs NIAT training fee, in lakh) for a partner university. Sample figures in demo mode.",
    input_schema: { type: "object", properties: { university: { type: "string" } }, required: ["university"] },
  },
  {
    name: "submit_match",
    description: "Final step. Submit the chosen volunteer and the briefs. Call exactly once when done.",
    input_schema: {
      type: "object",
      properties: {
        volunteer_id: { type: "string" },
        concern_label: { type: "string", enum: [...CONCERNS] },
        brief_parent: { type: "string", description: "3 short questions the parent could ask, in the parent's language." },
        brief_volunteer: { type: "string", description: "Neutral summary of the parent's worry for the volunteer, plus a reminder to be honest about the hard parts. English." },
        parent_message: { type: "string", description: "2-3 warm sentences to the parent in their language. No hard sell, no promises about outcomes." },
        reasoning: { type: "string", description: "One sentence on why this volunteer." },
      },
      required: ["volunteer_id", "concern_label", "brief_parent", "brief_volunteer", "parent_message", "reasoning"],
    },
  },
];

const SYSTEM = `You match a hesitant parent of a 12th-grade student with a volunteer parent whose child already studies in NIAT (NxtWave's upskilling program at partner universities).
Rules:
- Honesty beats persuasion. Never promise jobs, salaries or admission. Never script the volunteer to sell.
- Pick the volunteer who best fits the parent's university, city, fee band and language. Use search_volunteers, then submit_match.
- If the worry is about fees, call get_fee_sheet for the parent's preferred university and mention the split in the parent brief.
- Write parent-facing text in the parent's language (English, Telugu or Hindi). Keep volunteer-facing text in English.
- Classify the worry as one of: ${CONCERNS.join(", ")}.
- If no volunteer fits well, still pick the closest and say so in reasoning.`;

export async function matchLead(lead: Lead, vols: Volunteer[]): Promise<MatchDraft> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return heuristicMatch(lead, vols);

  try {
    const client = new Anthropic({ apiKey: key });
    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
    const messages: any[] = [
      {
        role: "user",
        content: JSON.stringify({
          parent_city: lead.city,
          preferred_university: lead.university_pref,
          fee_band_lakh_total: lead.fee_band,
          parent_language: LANG_NAME[lead.language],
          trust_in_niat_1_to_10: lead.trust_before,
          worry_in_their_words: lead.worry_text,
        }),
      },
    ];

    for (let i = 0; i < 6; i++) {
      const resp: any = await client.messages.create({ model, max_tokens: 1800, system: SYSTEM, tools: TOOLS, messages });
      messages.push({ role: "assistant", content: resp.content });
      const uses = resp.content.filter((b: any) => b.type === "tool_use");
      if (uses.length === 0) break;

      const results: any[] = [];
      for (const u of uses) {
        if (u.name === "submit_match") {
          const a = u.input;
          const v = vols.find((x) => x.id === a.volunteer_id);
          if (!v) { results.push({ type: "tool_result", tool_use_id: u.id, content: "Unknown volunteer_id, pick one from search_volunteers.", is_error: true }); continue; }
          return {
            volunteer_id: v.id,
            concern_label: (CONCERNS as readonly string[]).includes(a.concern_label) ? a.concern_label : "other",
            brief_parent: String(a.brief_parent),
            brief_volunteer: String(a.brief_volunteer),
            parent_message: String(a.parent_message),
            slot_options: v.slots,
            reasoning: String(a.reasoning),
            engine: "claude",
          };
        }
        if (u.name === "search_volunteers") {
          const ranked = vols
            .map((v) => ({ v, s: score(v, u.input || {}) }))
            .sort((a, b) => b.s - a.s)
            .slice(0, 5)
            .map(({ v, s }) => publicVolunteer(v, s));
          results.push({ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(ranked) });
        } else if (u.name === "get_fee_sheet") {
          const f = FEE_SHEET[u.input?.university];
          results.push({ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(f ?? { error: "no fee sheet for that university" }) });
        } else {
          results.push({ type: "tool_result", tool_use_id: u.id, content: "Unknown tool", is_error: true });
        }
      }
      messages.push({ role: "user", content: results });
    }
  } catch (e) {
    console.error("Claude matching failed, using fallback:", e);
  }
  return heuristicMatch(lead, vols);
}
