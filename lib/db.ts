import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SEED_VOLUNTEERS } from "./data";
import { Lead, Match, Volunteer } from "./types";

// One interface, two stores: Supabase when keys are set, in-memory otherwise (demo mode).
export const usingSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

type Mem = { volunteers: Volunteer[]; leads: Lead[]; matches: Match[] };
const g = globalThis as unknown as { __niatMem?: Mem };
if (!g.__niatMem) g.__niatMem = { volunteers: [...SEED_VOLUNTEERS], leads: [], matches: [] };
const mem = g.__niatMem;

let sb: SupabaseClient | null = null;
function client(): SupabaseClient {
  if (!sb) sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u: any, o: any) => fetch(u, { ...o, cache: "no-store" }) } });
  return sb;
}
function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function listVolunteers(): Promise<Volunteer[]> {
  if (!usingSupabase) return mem.volunteers;
  return check(await client().from("volunteers").select("*")) as Volunteer[];
}

export async function insertLead(l: Lead): Promise<void> {
  if (!usingSupabase) { mem.leads.push(l); return; }
  check(await client().from("leads").insert(l));
}

export async function getLead(id: string): Promise<Lead | null> {
  if (!usingSupabase) return mem.leads.find((x) => x.id === id) ?? null;
  return check(await client().from("leads").select("*").eq("id", id).maybeSingle()) as Lead | null;
}

export async function listLeads(): Promise<Lead[]> {
  if (!usingSupabase) return mem.leads;
  return check(await client().from("leads").select("*")) as Lead[];
}

export async function insertMatch(m: Match): Promise<void> {
  if (!usingSupabase) { mem.matches.push(m); return; }
  check(await client().from("matches").insert(m));
}

export async function getMatch(id: string): Promise<Match | null> {
  if (!usingSupabase) return mem.matches.find((x) => x.id === id) ?? null;
  return check(await client().from("matches").select("*").eq("id", id).maybeSingle()) as Match | null;
}

export async function updateMatch(id: string, patch: Partial<Match>): Promise<Match | null> {
  if (!usingSupabase) {
    const m = mem.matches.find((x) => x.id === id);
    if (!m) return null;
    Object.assign(m, patch);
    return m;
  }
  check(await client().from("matches").update(patch).eq("id", id));
  return getMatch(id);
}

export async function listMatches(): Promise<Match[]> {
  if (!usingSupabase) return [...mem.matches].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return check(await client().from("matches").select("*").order("created_at", { ascending: false })) as Match[];
}
