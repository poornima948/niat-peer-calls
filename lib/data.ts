import { Volunteer } from "./types";

// University names come from NIAT's public collaborating-universities list.
export const UNIVERSITIES = [
  "Chalapathi University (Guntur)",
  "Annamacharya University (Andhra Pradesh)",
  "Yenepoya University (Mangalore)",
  "Ajeenkya DY Patil University (Pune)",
  "Noida International University (Noida)",
  "S-VYASA University (Bengaluru)",
];

// !!! SAMPLE FIGURES FOR THE DEMO ONLY !!!
// NIAT publishes a total range (Rs 8-18 lakh over four years, Rs 2-4.5 lakh a year,
// university collects academic fees, NIAT charges its training fee separately).
// The per-university split below is invented so the sheet has something to show.
// Replace with the official fee sheet before using this with real parents.
export const FEE_SHEET: Record<string, { university_per_year_lakh: number; niat_per_year_lakh: number }> = {
  "Chalapathi University (Guntur)": { university_per_year_lakh: 1.4, niat_per_year_lakh: 0.9 },
  "Annamacharya University (Andhra Pradesh)": { university_per_year_lakh: 1.5, niat_per_year_lakh: 1.0 },
  "Yenepoya University (Mangalore)": { university_per_year_lakh: 2.2, niat_per_year_lakh: 1.2 },
  "Ajeenkya DY Patil University (Pune)": { university_per_year_lakh: 2.6, niat_per_year_lakh: 1.4 },
  "Noida International University (Noida)": { university_per_year_lakh: 2.0, niat_per_year_lakh: 1.2 },
  "S-VYASA University (Bengaluru)": { university_per_year_lakh: 2.4, niat_per_year_lakh: 1.3 },
};

// SAMPLE volunteer parents (fictional). In real use these are parents who opted in.
export const SEED_VOLUNTEERS: Volunteer[] = [
  { id: "v1", name: "Lakshmi R.", city: "Hyderabad", university: "Chalapathi University (Guntur)", fee_band: "8-12", languages: ["te", "en"], child_year: 2, note: "Joined 2024. Worried about the two-fee setup at first; asked the university directly and got it in writing.", phone: "+910000000001", slots: ["Sat 11 AM", "Sat 6 PM", "Sun 5 PM"], sample: true },
  { id: "v2", name: "Venkat P.", city: "Hyderabad", university: "Annamacharya University (Andhra Pradesh)", fee_band: "8-12", languages: ["te", "en", "hi"], child_year: 3, note: "Child is in 3rd year. Happy with the coding focus, unsure about campus facilities.", phone: "+910000000002", slots: ["Fri 7 PM", "Sat 10 AM"], sample: true },
  { id: "v3", name: "Sunita K.", city: "Bengaluru", university: "S-VYASA University (Bengaluru)", fee_band: "12-18", languages: ["hi", "en"], child_year: 2, note: "Moved from a state-rank seat to NIAT. Can talk about the fee gap honestly.", phone: "+910000000003", slots: ["Sun 11 AM", "Sun 4 PM"], sample: true },
  { id: "v4", name: "Anil D.", city: "Pune", university: "Ajeenkya DY Patil University (Pune)", fee_band: "12-18", languages: ["hi", "en"], child_year: 1, note: "First-year parent, so can speak to admission and the first months only.", phone: "+910000000004", slots: ["Sat 5 PM", "Sun 6 PM"], sample: true },
  { id: "v5", name: "Meena S.", city: "Chennai", university: "Yenepoya University (Mangalore)", fee_band: "12-18", languages: ["en", "hi"], child_year: 2, note: "Child lives in the hostel; can speak about hostel life and safety.", phone: "+910000000005", slots: ["Sat 12 PM", "Sun 7 PM"], sample: true },
  { id: "v6", name: "Rajesh T.", city: "Delhi", university: "Noida International University (Noida)", fee_band: "8-12", languages: ["hi", "en"], child_year: 2, note: "Checked the UGC listing himself before paying; happy to share how.", phone: "+910000000006", slots: ["Sat 7 PM", "Sun 10 AM"], sample: true },
  { id: "v7", name: "Padma G.", city: "Vijayawada", university: "Chalapathi University (Guntur)", fee_band: "8-12", languages: ["te"], child_year: 3, note: "Telugu-speaking family; child is working on a first-year internship project.", phone: "+910000000007", slots: ["Fri 6 PM", "Sat 4 PM"], sample: true },
  { id: "v8", name: "Imran A.", city: "Hyderabad", university: "Yenepoya University (Mangalore)", fee_band: "12-18", languages: ["en", "hi", "te"], child_year: 2, note: "Compared NIAT with two private colleges before deciding; can share the numbers.", phone: "+910000000008", slots: ["Sun 9 AM", "Sun 8 PM"], sample: true },
];
