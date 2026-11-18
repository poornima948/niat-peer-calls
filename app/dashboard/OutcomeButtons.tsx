"use client";
import { useState } from "react";

export default function OutcomeButtons({ id, current, dkey }: { id: string; current: string; dkey: string }) {
  const [val, setVal] = useState(current);
  async function set(outcome: string) {
    const r = await fetch("/api/outcome", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match_id: id, outcome, key: dkey }),
    });
    if (r.ok) setVal(outcome);
  }
  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      <span className={"pill " + (val === "paid" ? "ok" : val === "not_paid" ? "red" : "")}>{val.replace("_", " ")}</span>
      <button className="ghost" style={{ padding: "3px 8px", fontSize: 12 }} onClick={() => set("paid")}>paid</button>
      <button className="ghost" style={{ padding: "3px 8px", fontSize: 12 }} onClick={() => set("not_paid")}>not paid</button>
    </span>
  );
}
