// Node / Węzeł: Zbuduj zapytanie do AI / Build AI input
// Module / Moduł: 5 · Zrozumienie (AI) i baza wiedzy / Understanding (AI) and knowledge

// Zbieramy wszystko, co AI musi wiedzieć, w jednym czytelnym tekście.
// We collect everything the AI needs to know in one readable text.
const ctx = $('Kontekst zgłoszenia / Request context').first().json;
const cfg = $('Ustawienia kliniki / Clinic settings').first().json;
const kb = $input.all().map(function (i) { return i.json; }).filter(function (r) { return r.kb_key; });

// Aktualny czas w Polsce, żeby AI rozumiało "jutro" albo "w piątek".
// Current time in Poland so the AI understands "tomorrow" or "on Friday".
const now = new Date();
const human = new Intl.DateTimeFormat('en-GB', { timeZone: cfg.timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
const iso = new Intl.DateTimeFormat('sv-SE', { timeZone: cfg.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
const todayIso = iso.slice(0, 10);

const history = (ctx.history || []).slice(-8).map(function (h) {
  return (h.who === 'patient' ? 'PATIENT: ' : 'CLINIC: ') + String(h.text).slice(0, 600);
}).join('\n');

const t = ctx.ticket || {};
const ticketLine = ctx.is_returning
  ? 'Existing ticket ' + ctx.ticket_code + ' | status: ' + (t.status || '-') + ' | service: ' + (t.service || '-') + ' | booked appointment (local time): ' + (t.appointment_at || 'none') + ' | slots offered earlier: ' + (t.offered_slots || '[]')
  : 'New ticket ' + ctx.ticket_code + ' (first message from this patient)';

const catalog = kb.map(function (r) { return r.kb_key + ' = ' + r.title_en + ' / ' + r.title_pl; }).join('\n');

const prompt = [
  'CURRENT DATE/TIME in Poland: ' + human + ' (local ISO date: ' + todayIso + ')',
  'PATIENT: ' + ctx.patient_name + ' | preferred reply language: ' + ctx.preferred_language,
  'TICKET: ' + ticketLine,
  'CONVERSATION SO FAR:\n' + (history || '(none)'),
  'NEW PATIENT MESSAGE:\n"""\n' + ctx.message + '\n"""',
  'KNOWLEDGE BASE TOPIC KEYS (use these exact keys in "topics"):\n' + catalog
].join('\n\n');

return [{ json: Object.assign({}, ctx, { kb: kb, now_local_human: human, today_iso: todayIso, ai_prompt_understand: prompt }) }];
