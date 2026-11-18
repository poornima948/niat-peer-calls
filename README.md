# NIAT Parent Peer Calls

A small system that connects a hesitant parent with a parent whose child already studies in a NIAT program, for a short, honest, unscripted conversation.

## The problem

Parents decide whether a 4-year program is worth lakhs of rupees, but almost everything they hear comes from the institution itself: brochures, parent videos, counselling calls. Parents tend to discount that, and the questions that matter most are the ones an institution cannot answer credibly, such as "who am I actually paying?" and "was it worth it for you?"

## What it does

1. A parent fills a short form in English, Telugu or Hindi: city, preferred university, budget, and their biggest worry in their own words.
2. A Claude agent reads the worry, classifies it, and picks the best-fitting volunteer parent (same university, city, fee band and language). It writes a short brief for both sides in the right language.
3. The parent sees the match, suggested questions, a fee-split sheet and available call slots, then books a time.
4. An n8n workflow sends WhatsApp messages to both parents, confirms the slot, and sends a feedback link after the call.
5. After the call, the parent rates their trust in the program again and says whether the worry was answered.
6. A counsellor dashboard shows the funnel, trust before and after, the main worries, and lets the team mark whether the parent finally enrolled.

Volunteers are never scripted and are not rewarded for enrolments. The point is an honest peer conversation.

## Architecture

```
Parent form (Next.js)
      |
      v
/api/intake ---> Claude agent (tool use)
      |             - search_volunteers
      |             - get_fee_sheet
      |             - submit_match
      v
 Supabase (leads, volunteers, matches)
      |
      v
 n8n webhook ---> WhatsApp (Twilio): match, booking, reminder, feedback link
      |
      v
Feedback page ---> Supabase ---> Counsellor dashboard
```

The agent never sees volunteer phone numbers. Contact details are used only by the messaging workflow.

## Tech stack

- Next.js 14 (App Router) and TypeScript
- Anthropic Claude API with tool calling
- Supabase (Postgres)
- n8n and the Twilio WhatsApp API
- Deployed on Vercel

## Project structure

```
app/                 pages and API routes (intake, booking, feedback, outcome, dashboard)
lib/agent.ts         the matching agent and a rule-based fallback
lib/db.ts            Supabase store, with an in-memory store for local runs
lib/i18n.ts          English, Telugu and Hindi interface text
lib/data.ts          partner university list, sample fee sheet, sample volunteers
supabase/schema.sql  database tables and sample rows
n8n/                 importable WhatsApp workflow
```

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no environment variables set, the app runs with in-memory data and a rule-based matcher, so you can try the full flow immediately. The dashboard is at `/dashboard?key=YOUR_KEY`.

## Configuration

Copy `.env.example` to `.env.local` and fill in what you need. Every variable is optional.

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Enables the Claude matching agent |
| `ANTHROPIC_MODEL` | Model name (defaults to `claude-sonnet-5-5`) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Persistent database |
| `N8N_WEBHOOK_URL` | Production webhook of the n8n workflow |
| `DASHBOARD_KEY` | Password for the counsellor dashboard. Set your own before deploying |
| `NEXT_PUBLIC_BASE_URL` | Public site URL, used in WhatsApp feedback links |

## Setup for production

1. **Database:** create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. **Messaging:** import `n8n/whatsapp-workflow.json` into n8n and connect a Twilio WhatsApp sender. Put your Twilio Account SID in the request URL and attach a Basic Auth credential.
3. **Hosting:** deploy to Vercel and add the environment variables above.

## Data and privacy notes

- The partner university names come from NIAT's public list.
- The volunteer parents and the per-university fee split in this repository are **sample data** for demonstration. Replace them with real, opted-in parents and the official fee sheet before any real use.
- Parents give explicit consent for WhatsApp contact, and their number is not shared with the other parent.
- Row-level security is enabled on all tables. The app reads and writes only from the server with the service-role key.

## Known limitations and next steps

- The Twilio sandbox is for testing. Production use needs an approved WhatsApp Business number.
- Add a data-deletion path and a privacy notice before storing real parent contacts.
- Replace the rule-based fallback with a simple review queue if the AI call fails.
- Measure whether peer calls actually raise enrolment, for example by comparing a randomised group that gets a call with one that does not.
