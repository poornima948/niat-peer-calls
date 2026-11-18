"use client";
import { useState } from "react";

export default function Feedback({ params }: { params: { id: string } }) {
  const [trust, setTrust] = useState(7);
  const [resolved, setResolved] = useState(true);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/feedback", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match_id: params.id, trust_after: trust, resolved, note }),
    });
    if (r.ok) setDone(true); else setErr((await r.json()).error || "Could not save");
  }

  return (
    <main className="wrap">
      <h1>How was your call?</h1>
      <p className="sub">Three quick questions. Your honest answer helps the next parent.</p>
      {done ? (
        <div className="card"><span className="pill ok">Thank you</span> We have saved your feedback.</div>
      ) : (
        <form className="card" onSubmit={send}>
          <label>How comfortable are you with NIAT now? (1 to 10): <b>{trust}</b></label>
          <input type="range" min={1} max={10} value={trust} onChange={(e) => setTrust(+e.target.value)} />
          <label>Did the call answer your main worry?</label>
          <select value={resolved ? "yes" : "no"} onChange={(e) => setResolved(e.target.value === "yes")}>
            <option value="yes">Yes</option><option value="no">Not really</option>
          </select>
          <label>Anything else you want us to know? (optional)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} />
          {err && <p style={{ color: "var(--red)" }}>{err}</p>}
          <button>Send</button>
        </form>
      )}
    </main>
  );
}
