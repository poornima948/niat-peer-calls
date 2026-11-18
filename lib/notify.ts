// Sends an event to the n8n workflow (which does the WhatsApp messaging).
// No N8N_WEBHOOK_URL = no-op, so the app still works in demo mode.
export async function notifyN8n(payload: Record<string, unknown>): Promise<"sent" | "skipped" | "failed"> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return "skipped";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

export function dashboardKey(): string {
  return process.env.DASHBOARD_KEY || "demo";
}
