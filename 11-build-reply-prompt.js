// Node / Węzeł: Zbuduj prompt odpowiedzi / Build reply prompt
// Module / Moduł: 7 · Odpowiedź (AI) / Reply (AI)

// Układamy zadanie dla AI piszącego odpowiedź: fakty z bazy wiedzy + wynik rezerwacji + rozmowa.
// We assemble the task for the AI that writes the reply: facts from the knowledge base + booking result + conversation.
const p = $('Wynik rezerwacji / Booking result').first().json;
const a = p.analysis;
const b = p.booking || {};
const lang = p.reply_language;
const langName = lang === 'pl' ? 'Polish' : 'English';
const first = String(p.patient_name || '').trim().split(/\s+/)[0] || '';

let bookingText = 'No calendar action is involved.';
if (b.action === 'offer_slots') {
  bookingText = 'OFFERED SLOTS (list exactly these, numbered, in ' + langName + '): ' + b.slots.map(function (s, i) { return (i + 1) + ') ' + (lang === 'pl' ? s.label_pl : s.label_en); }).join(' | ') + (b.note ? ' | NOTE: ' + b.note : '');
} else if (b.confirmed && (b.action === 'create' || b.action === 'reschedule')) {
  bookingText = 'BOOKING CONFIRMED for: ' + (lang === 'pl' ? b.chosen.label_pl : b.chosen.label_en) + (b.action === 'reschedule' ? ' (the previous appointment was cancelled and moved)' : '') + '.';
} else if (b.confirmed && b.action === 'cancel') {
  bookingText = 'APPOINTMENT CANCELLED successfully at the request of the patient.';
} else if (b.action === 'need_human') {
  bookingText = 'BOOKING COULD NOT BE COMPLETED automatically. Reason: ' + (b.note || 'unknown') + '. Tell the patient that our team will contact them (do not promise a time).';
}

const history = (p.history || []).slice(-6).map(function (h) {
  return (h.who === 'patient' ? 'PATIENT: ' : 'CLINIC: ') + String(h.text).slice(0, 500);
}).join('\n');

const prompt = [
  'REPLY LANGUAGE (mandatory): ' + langName,
  'PATIENT FIRST NAME: ' + (first || '(unknown)'),
  'ANALYSIS: intent=' + a.intent + ', urgency=' + a.urgency + ', sentiment=' + a.sentiment + ', service=' + (a.service || '-'),
  'CLINIC FACTS (the ONLY source of facts):\n' + (p.kb_text || '(none for this message)'),
  'BOOKING RESULT: ' + bookingText,
  'CONVERSATION SO FAR:\n' + (history || '(none)'),
  'PATIENT LATEST MESSAGE:\n"""\n' + p.message + '\n"""'
].join('\n\n');

return [{ json: { reply_prompt: prompt } }];
