import { listLeads, listMatches, listVolunteers, usingSupabase } from "@/lib/db";
import { dashboardKey } from "@/lib/notify";
import OutcomeButtons from "./OutcomeButtons";

export const dynamic = "force-dynamic";

const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const pct = (n: number, d: number) => (d ? Math.round((100 * n) / d) : 0);

export default async function Dashboard({ searchParams }: { searchParams: { key?: string } }) {
  const key = searchParams.key ?? "";
  if (key !== dashboardKey()) {
    return <main className="wrap"><h1>Counsellor dashboard</h1><p className="sub">Add ?key=YOUR_KEY to the address to open this page.</p></main>;
  }

  const [leads, matches, vols] = await Promise.all([listLeads(), listMatches(), listVolunteers()]);
  const leadById = new Map(leads.map((l) => [l.id, l]));
  const volById = new Map(vols.map((v) => [v.id, v]));

  const booked = matches.filter((m) => m.status !== "matched");
  const done = matches.filter((m) => m.status === "completed");
  const paid = matches.filter((m) => m.outcome === "paid");
  const decided = matches.filter((m) => m.outcome !== "pending");

  const trustBefore = avg(done.map((m) => leadById.get(m.lead_id)?.trust_before ?? 0).filter(Boolean));
  const trustAfter = avg(done.map((m) => m.trust_after ?? 0).filter(Boolean));
  const resolved = pct(done.filter((m) => m.resolved).length, done.length);

  const concerns: Record<string, number> = {};
  matches.forEach((m) => (concerns[m.concern_label] = (concerns[m.concern_label] || 0) + 1));
  const concernRows = Object.entries(concerns).sort((a, b) => b[1] - a[1]);
  const maxC = Math.max(1, ...concernRows.map((r) => r[1]));

  const langs: Record<string, number> = {};
  leads.forEach((l) => (langs[l.language] = (langs[l.language] || 0) + 1));

  return (
    <main className="wrap wide">
      <h1>Counsellor dashboard</h1>
      <p className="sub">
        Parent-to-parent peer calls | data: {usingSupabase ? "Supabase" : "in-memory demo (resets on restart)"}
      </p>

      <div className="kpis">
        <div className="kpi"><b>{leads.length}</b><span>Parents who asked</span></div>
        <div className="kpi"><b>{pct(booked.length, matches.length)}%</b><span>Booked a call ({booked.length})</span></div>
        <div className="kpi"><b>{pct(done.length, booked.length)}%</b><span>Calls completed ({done.length})</span></div>
        <div className="kpi"><b>{trustBefore ? trustBefore.toFixed(1) : "-"} to {trustAfter ? trustAfter.toFixed(1) : "-"}</b><span>Trust, before to after (1-10)</span></div>
        <div className="kpi"><b>{resolved}%</b><span>Worry resolved</span></div>
        <div className="kpi"><b>{pct(paid.length, decided.length)}%</b><span>Paid, of decided ({paid.length}/{decided.length})</span></div>
      </div>

      <div className="row" style={{ alignItems: "start" }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>What parents worry about</h2>
          {concernRows.length === 0 && <p className="note">No data yet.</p>}
          {concernRows.map(([k, n]) => (
            <div className="barrow" key={k}>
              <span>{k.replace("_", " ")}</span>
              <div><div className="bar" style={{ width: `${(100 * n) / maxC}%` }} /></div>
              <b>{n}</b>
            </div>
          ))}
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Language mix</h2>
          {Object.entries(langs).length === 0 && <p className="note">No data yet.</p>}
          {Object.entries(langs).map(([k, n]) => (
            <div className="barrow" key={k}>
              <span>{k === "en" ? "English" : k === "te" ? "Telugu" : "Hindi"}</span>
              <div><div className="bar" style={{ width: `${(100 * n) / Math.max(1, leads.length)}%` }} /></div>
              <b>{n}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <h2 style={{ marginTop: 0 }}>Matches</h2>
        <table>
          <thead><tr><th>Parent</th><th>Worry</th><th>Matched with</th><th>Status</th><th>Trust</th><th>Outcome</th></tr></thead>
          <tbody>
            {matches.length === 0 && <tr><td colSpan={6} className="note">No matches yet. Submit the form on the home page.</td></tr>}
            {matches.map((m) => {
              const l = leadById.get(m.lead_id);
              const v = volById.get(m.volunteer_id);
              return (
                <tr key={m.id}>
                  <td>{l?.parent_name}<div className="note">{l?.city} | {l?.language}</div></td>
                  <td><span className="pill">{m.concern_label.replace("_", " ")}</span><div className="note">{l?.worry_text.slice(0, 90)}</div></td>
                  <td>{v?.name}<div className="note">{m.slot_chosen ?? "no slot yet"}</div></td>
                  <td><span className={"pill " + (m.status === "completed" ? "ok" : "")}>{m.status}</span></td>
                  <td>{l?.trust_before} to {m.trust_after ?? "-"}</td>
                  <td><OutcomeButtons id={m.id} current={m.outcome} dkey={key} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
