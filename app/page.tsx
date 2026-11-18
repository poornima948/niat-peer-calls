"use client";
import { useState } from "react";
import { STR } from "@/lib/i18n";
import { UNIVERSITIES } from "@/lib/data";
import { Lang } from "@/lib/types";

type Result = {
  match_id: string;
  volunteer: { name: string; city: string; university: string; child_year: number; note: string };
  concern_label: string;
  parent_message: string;
  brief_parent: string;
  slot_options: string[];
  fee_sheet: { university_per_year_lakh: number; niat_per_year_lakh: number } | null;
  engine: string;
  whatsapp: string;
};

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const t = STR[lang];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [slot, setSlot] = useState("");
  const [booked, setBooked] = useState(false);
  const [trust, setTrust] = useState(5);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr("");
    const f = new FormData(e.currentTarget);
    const body = {
      parent_name: f.get("name"), phone: f.get("phone"), city: f.get("city"),
      university_pref: f.get("uni"), fee_band: f.get("fee"), language: lang,
      worry_text: f.get("worry"), trust_before: trust, consent: f.get("consent") === "on",
    };
    try {
      const r = await fetch("/api/intake", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Something went wrong");
      setRes(j); setSlot(j.slot_options?.[0] ?? "");
    } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  }

  async function book() {
    if (!res) return;
    setBusy(true);
    await fetch("/api/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ match_id: res.match_id, slot }) });
    setBooked(true); setBusy(false);
  }

  return (
    <main className="wrap">
      <div className="langs">
        {(["en", "te", "hi"] as Lang[]).map((l) => (
          <button key={l} className={l === lang ? "on" : ""} type="button" onClick={() => setLang(l)}>
            {l === "en" ? "English" : l === "te" ? "తెలుగు" : "हिन्दी"}
          </button>
        ))}
      </div>
      <h1>{t.title}</h1>
      <p className="sub">{t.sub}</p>

      {!res && (
        <form className="card" onSubmit={submit}>
          <div className="row">
            <div><label>{t.name}</label><input name="name" required /></div>
            <div><label>{t.phone}</label><input name="phone" required inputMode="tel" placeholder="98XXXXXXXX" /></div>
          </div>
          <div className="row">
            <div><label>{t.city}</label><input name="city" required /></div>
            <div>
              <label>{t.fee}</label>
              <select name="fee" defaultValue="8-12"><option value="8-12">8 - 12</option><option value="12-18">12 - 18</option></select>
            </div>
          </div>
          <label>{t.uni}</label>
          <select name="uni" required>{UNIVERSITIES.map((u) => <option key={u}>{u}</option>)}</select>
          <label>{t.worry}</label>
          <textarea name="worry" required minLength={8} />
          <label>{t.trust}: <b>{trust}</b></label>
          <input type="range" min={1} max={10} value={trust} onChange={(e) => setTrust(+e.target.value)} />
          <label style={{ fontWeight: 400, display: "flex", gap: 8, alignItems: "flex-start" }}>
            <input type="checkbox" name="consent" required style={{ width: "auto", marginTop: 4 }} /> {t.consent}
          </label>
          {err && <p style={{ color: "var(--red)" }}>{err}</p>}
          <button disabled={busy}>{busy ? t.working : t.submit}</button>
        </form>
      )}

      {res && (
        <>
          <div className="card">
            <span className="pill ok">{t.matched}</span>
            <span className="pill">{res.concern_label.replace("_", " ")}</span>
            <h2 style={{ marginTop: 10 }}>{res.volunteer.name}</h2>
            <p className="note" style={{ marginTop: -4 }}>{res.volunteer.university} | {res.volunteer.city} | Year {res.volunteer.child_year}</p>
            <p>{res.parent_message}</p>
            <p className="note">&ldquo;{res.volunteer.note}&rdquo;</p>
            <h2>Questions you could ask</h2>
            <p style={{ whiteSpace: "pre-line" }}>{res.brief_parent}</p>
          </div>

          {res.fee_sheet && (
            <div className="card">
              <h2 style={{ marginTop: 0 }}>{t.sheet}</h2>
              <table className="fee"><tbody>
                <tr><td>University (academic fees)</td><td>Rs {res.fee_sheet.university_per_year_lakh} lakh</td></tr>
                <tr><td>NIAT (training fee)</td><td>Rs {res.fee_sheet.niat_per_year_lakh} lakh</td></tr>
                <tr><td><b>Total per year</b></td><td><b>Rs {(res.fee_sheet.university_per_year_lakh + res.fee_sheet.niat_per_year_lakh).toFixed(1)} lakh</b></td></tr>
              </tbody></table>
              <div className="warn">Demo figures. Replace with the official fee sheet before real use.</div>
            </div>
          )}

          <div className="card">
            <h2 style={{ marginTop: 0 }}>{t.pick}</h2>
            {!booked ? (
              <>
                <div className="slots">
                  {res.slot_options.map((s) => (
                    <label key={s}><input type="radio" name="slot" checked={slot === s} onChange={() => setSlot(s)} /> {s}</label>
                  ))}
                </div>
                <button onClick={book} disabled={busy}>{t.book}</button>
              </>
            ) : (
              <p><span className="pill ok">OK</span> {t.booked}</p>
            )}
            <p className="note" style={{ marginTop: 12 }}>
              Matched by: {res.engine === "claude" ? "Claude agent" : "rule-based demo matcher"} | WhatsApp: {res.whatsapp}
            </p>
          </div>
        </>
      )}
    </main>
  );
}
