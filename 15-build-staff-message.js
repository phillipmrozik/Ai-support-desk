// Node / Węzeł: Przygotuj wiadomość dla zespołu / Build staff message
// Module / Moduł: 12 · Zatwierdzanie / Human approval

// Wiadomość na Telegram dla człowieka: kto pisze, dlaczego sprawa trafiła do człowieka i jaki jest szkic odpowiedzi.
// The Telegram message for the human: who is writing, why a human is needed and what the draft reply is.
const ticket = $('Pobierz zgłoszenie do decyzji / Load ticket for decision').first().json;
const rows = $input.all().map(function (i) { return i.json; }).filter(function (r) { return r.body; });

const drafts = rows.filter(function (r) { return r.direction === 'assistant' && r.status === 'pending_approval'; });
const patientMsgs = rows.filter(function (r) { return r.direction === 'patient'; });
if (!drafts.length) { throw new Error('No pending draft for ' + ticket.ticket_code); }

const draft = drafts[drafts.length - 1];
const patient = patientMsgs.length ? patientMsgs[patientMsgs.length - 1] : { body: '' };
const emergency = draft.decision === 'emergency';

function cut(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

const lines = [
  (emergency ? '🚨 PILNE / URGENT · ' : '🦷 ') + 'Nova Smile · potrzebna decyzja / decision needed',
  '',
  'Zgłoszenie / Ticket: ' + ticket.ticket_code,
  'Pacjent / Patient: ' + ticket.patient_name + ' · ' + String(ticket.language || '').toUpperCase(),
  '',
  'Dlaczego człowiek? / Why a human?',
  cut(draft.risk_reasons || '-', 600),
  '',
  'Wiadomość pacjenta / Patient message:',
  '„' + cut(patient.body, 700) + '”',
  '',
  'Szkic odpowiedzi / Draft reply:',
  cut(draft.body, 1400),
  '',
  'Naciśnij przycisk poniżej, aby zdecydować. / Tap the button below to decide.'
];

return [{ json: {
  ticket_code: ticket.ticket_code,
  patient_email: ticket.email,
  patient_name: ticket.patient_name,
  language: ticket.language,
  draft_text: draft.body,
  emergency: emergency,
  telegram_text: lines.join('\n')
} }];
