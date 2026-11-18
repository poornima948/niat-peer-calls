-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- The app talks to these tables only from the server, using the service-role key.

create table if not exists volunteers (
  id text primary key,
  name text not null,
  city text not null,
  university text not null,
  fee_band text not null check (fee_band in ('8-12','12-18')),
  languages text[] not null default '{}',
  child_year int not null,
  note text not null,
  phone text not null,
  slots jsonb not null default '[]',
  sample boolean not null default false
);

create table if not exists leads (
  id uuid primary key,
  parent_name text not null,
  phone text not null,
  city text not null,
  university_pref text not null,
  fee_band text not null,
  language text not null check (language in ('en','te','hi')),
  worry_text text not null,
  trust_before int not null check (trust_before between 1 and 10),
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id uuid primary key,
  lead_id uuid not null references leads(id),
  volunteer_id text not null references volunteers(id),
  concern_label text not null,
  brief_parent text not null,
  brief_volunteer text not null,
  parent_message text not null,
  slot_options jsonb not null default '[]',
  slot_chosen text,
  status text not null default 'matched' check (status in ('matched','booked','completed')),
  trust_after int check (trust_after between 1 and 10),
  resolved boolean,
  feedback_note text,
  outcome text not null default 'pending' check (outcome in ('pending','paid','not_paid')),
  reasoning text not null default '',
  engine text not null default 'heuristic',
  created_at timestamptz not null default now()
);

-- Lock the tables: only the server (service-role key) can touch them.
alter table volunteers enable row level security;
alter table leads enable row level security;
alter table matches enable row level security;

-- SAMPLE volunteers (fictional). Replace with real opted-in parents.
insert into volunteers (id, name, city, university, fee_band, languages, child_year, note, phone, slots, sample) values
('v1','Lakshmi R.','Hyderabad','Chalapathi University (Guntur)','8-12','{te,en}',2,'Joined 2024. Worried about the two-fee setup at first; asked the university directly and got it in writing.','+910000000001','["Sat 11 AM","Sat 6 PM","Sun 5 PM"]',true),
('v2','Venkat P.','Hyderabad','Annamacharya University (Andhra Pradesh)','8-12','{te,en,hi}',3,'Child is in 3rd year. Happy with the coding focus, unsure about campus facilities.','+910000000002','["Fri 7 PM","Sat 10 AM"]',true),
('v3','Sunita K.','Bengaluru','S-VYASA University (Bengaluru)','12-18','{hi,en}',2,'Moved from a state-rank seat to NIAT. Can talk about the fee gap honestly.','+910000000003','["Sun 11 AM","Sun 4 PM"]',true),
('v4','Anil D.','Pune','Ajeenkya DY Patil University (Pune)','12-18','{hi,en}',1,'First-year parent, so can speak to admission and the first months only.','+910000000004','["Sat 5 PM","Sun 6 PM"]',true),
('v5','Meena S.','Chennai','Yenepoya University (Mangalore)','12-18','{en,hi}',2,'Child lives in the hostel; can speak about hostel life and safety.','+910000000005','["Sat 12 PM","Sun 7 PM"]',true),
('v6','Rajesh T.','Delhi','Noida International University (Noida)','8-12','{hi,en}',2,'Checked the UGC listing himself before paying; happy to share how.','+910000000006','["Sat 7 PM","Sun 10 AM"]',true),
('v7','Padma G.','Vijayawada','Chalapathi University (Guntur)','8-12','{te}',3,'Telugu-speaking family; child is working on a first-year internship project.','+910000000007','["Fri 6 PM","Sat 4 PM"]',true),
('v8','Imran A.','Hyderabad','Yenepoya University (Mangalore)','12-18','{en,hi,te}',2,'Compared NIAT with two private colleges before deciding; can share the numbers.','+910000000008','["Sun 9 AM","Sun 8 PM"]',true)
on conflict (id) do nothing;
