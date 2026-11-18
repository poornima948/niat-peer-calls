# NIAT Parent Peer Calls

A small AI-native growth system for the NxtWave Growth Hack Challenge (Layer 3).
A hesitant parent describes their worry; a Claude agent matches them with a volunteer
NIAT parent, writes both briefs in the parent's language, WhatsApp automation books the call,
and a counsellor dashboard tracks trust before/after and who finally paid.

## How the pieces connect

1. **Web app (Next.js)**: parent form in English / Telugu / Hindi, booking, feedback page.
2. **Claude agent** (`lib/agent.ts`): tool-calling loop. Tools: `search_volunteers`, `get_fee_sheet`, `submit_match`.
   It never sees volunteer phone numbers.
3. **Supabase (Postgres)**: `leads`, `volunteers`, `matches` (`supabase/schema.sql`).
4. **n8n + WhatsApp (Twilio)**: the app posts events to an n8n webhook; n8n messages both parents,
   confirms the slot, and sends the feedback link 24h later (`n8n/whatsapp-workflow.json`).
5. **Counsellor dashboard** (`/dashboard?key=...`): funnel, trust before vs after, worry themes,
   language mix, and paid / not-paid buttons (the experiment's main metric).

## Demo mode (works with zero setup)

```bash
npm install
npm run dev        # open http://localhost:3000
```

With no keys it uses in-memory data and a rule-based matcher. Open `/dashboard?key=demo` to see the dashboard.
Everything resets when the server restarts.

## Going live, in this order (each step is optional, the app works after any of them)

1. **Supabase** (free): create a project, run `supabase/schema.sql` in the SQL editor.
   Copy the project URL and the `service_role` key into `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
2. **Claude**: create an API key at console.anthropic.com and set `ANTHROPIC_API_KEY`.
   (Model defaults to `claude-sonnet-5-5`; change with `ANTHROPIC_MODEL`.)
3. **Deploy** to Vercel: push this folder to GitHub, import it in Vercel, add the env vars from `.env.example`,
   set `NEXT_PUBLIC_BASE_URL` to your Vercel URL, and choose your own `DASHBOARD_KEY`.
4. **n8n** (cloud free trial or self-hosted): import `n8n/whatsapp-workflow.json`.
   In the "Send WhatsApp (Twilio)" node, put your Twilio Account SID in the URL and attach a
   Basic Auth credential (username = Account SID, password = Auth Token). Use the Twilio WhatsApp sandbox
   and have each test phone join the sandbox first. Activate the workflow, then copy the **production**
   webhook URL into `N8N_WEBHOOK_URL` on Vercel and redeploy.

## Honest limits (say these in your Loom)

- Volunteer parents and fee figures are **sample data**. Replace with real opted-in parents and NIAT's official fee sheet.
- Twilio's sandbox is for testing only; real use needs an approved WhatsApp Business number.
- The n8n workflow and the Claude path were tested here against a fake local server, not against live Twilio or the live API.
- Phone numbers are stored, so add a privacy notice and deletion path before real use.

## 3-minute Loom outline

1. (0:00) The problem in one line: parents hear only from the institution.
2. (0:20) Fill the form in Telugu with a real worry. Show the match, the questions and the fee sheet.
3. (1:10) Book a slot; show the WhatsApp messages arriving (n8n execution view + phone).
4. (1:50) Open the feedback link, give a trust score.
5. (2:15) Dashboard: trust before to after, worry themes, mark paid. Tie it to the experiment metric.
6. (2:45) Limits and next step: real volunteers, official fee sheet.
