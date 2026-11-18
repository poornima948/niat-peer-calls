export type Lang = "en" | "te" | "hi";
export type FeeBand = "8-12" | "12-18";

export interface Volunteer {
  id: string;
  name: string; // first name + initial only
  city: string;
  university: string;
  fee_band: FeeBand;
  languages: Lang[];
  child_year: number;
  note: string; // honest one-line summary, written by the volunteer
  phone: string; // never shown to parents; used by the WhatsApp flow only
  slots: string[];
  sample: boolean;
}

export interface Lead {
  id: string;
  parent_name: string;
  phone: string;
  city: string;
  university_pref: string;
  fee_band: FeeBand;
  language: Lang;
  worry_text: string;
  trust_before: number; // 1-10
  created_at: string;
}

export type Outcome = "pending" | "paid" | "not_paid";
export type MatchStatus = "matched" | "booked" | "completed";

export interface Match {
  id: string;
  lead_id: string;
  volunteer_id: string;
  concern_label: string;
  brief_parent: string;
  brief_volunteer: string;
  parent_message: string;
  slot_options: string[];
  slot_chosen: string | null;
  status: MatchStatus;
  trust_after: number | null;
  resolved: boolean | null;
  feedback_note: string | null;
  outcome: Outcome;
  reasoning: string;
  engine: "claude" | "heuristic";
  created_at: string;
}

export const CONCERNS = [
  "fee_structure",
  "degree_validity",
  "placements",
  "hostel_safety",
  "teaching_quality",
  "other",
] as const;
