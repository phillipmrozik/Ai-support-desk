// Node / Węzeł: Które czekają za długo? / Which are overdue?
// Module / Moduł: 14 · Pilnowanie czasu (SLA) / Response-time watchdog

// Pilne sprawy przypominamy po 10 minutach, zwykłe po 60.
// Urgent cases are reminded after 10 minutes, normal ones after 60.
const LIMIT_URGENT = 10;
const LIMIT_NORMAL = 60;
const now = Date.now();
const out = [];

for (const item of $input.all()) {
  const t = item.json;
  if (!t.ticket_code || !t.waiting_since) continue;
  const waited = Math.round((now - new Date(t.waiting_since).getTime()) / 60000);
  const urgent = t.urgency === 'emergency' || t.urgency === 'high';
  const limit = urgent ? LIMIT_URGENT : LIMIT_NORMAL;
  if (waited >= limit) {
    out.push({ json: { ticket_code: t.ticket_code, patient_name: t.patient_name, urgent: urgent, waited_min: waited, limit_min: limit, summary: t.last_summary || '' } });
  }
}

return out;
