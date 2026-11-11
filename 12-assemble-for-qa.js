// Node / Węzeł: Złóż wynik do kontroli / Assemble for QA
// Module / Moduł: 7 · Odpowiedź (AI) / Reply (AI)

// Łączymy odpowiedź AI z całym kontekstem i przygotowujemy e-mail oraz aktualizację zgłoszenia.
// We join the AI reply with the full context and prepare the e-mail and the ticket update.
const p = $('Wynik rezerwacji / Booking result').first().json;
const cfg = $('Ustawienia kliniki / Clinic settings').first().json;
const w = $input.first().json.output || {};
const lang = p.reply_language;
const b = p.booking || {};

const ok = typeof w.body === 'string' && w.body.trim().length > 0;
const fallbackBody = lang === 'pl'
  ? 'Dzień dobry,\n\ndziękujemy za wiadomość. Nasz zespół odpowie najszybciej, jak to możliwe.\n\nZespół Nova Smile'
  : 'Hello,\n\nthank you for your message. Our team will get back to you as soon as possible.\n\nNova Smile Team';

const reply = {
  subject: (ok && w.subject) ? w.subject : (lang === 'pl' ? 'Nova Smile – odpowiedź na Twoją wiadomość' : 'Nova Smile – reply to your message'),
  body: ok ? w.body.trim() : fallbackBody,
  used_kb_keys: Array.isArray(w.used_kb_keys) ? w.used_kb_keys : [],
  needs_human: ok ? !!w.needs_human : true,
  needs_human_reason: ok ? (w.needs_human_reason || '') : 'The writer model returned no usable reply',
  self_check: w.self_check || { all_facts_from_clinic_facts: false, contains_medical_advice: false, language_matches: false }
};

// Co zapisujemy w zgłoszeniu po tej wiadomości / What we store on the ticket after this message
const t = p.ticket || {};
const tu = {
  service: p.analysis.service || t.service || '',
  appointment_at: t.appointment_at || '',
  calendar_event_id: t.calendar_event_id || '',
  offered_slots: '[]',
  last_summary: p.analysis.summary_pl
};
if (b.action === 'offer_slots') tu.offered_slots = JSON.stringify(b.slots);
if (b.confirmed && (b.action === 'create' || b.action === 'reschedule')) { tu.appointment_at = b.chosen.start; tu.calendar_event_id = b.event_id; }
if (b.confirmed && b.action === 'cancel') { tu.appointment_at = ''; tu.calendar_event_id = ''; }

// E-mail do pacjenta (HTML) / The e-mail to the patient (HTML)
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
const paragraphs = esc(reply.body).split('\n\n').map(function (par) {
  return '<p style="margin:0 0 14px;line-height:1.6">' + par.replace(/\n/g, '<br>') + '</p>';
}).join('');

const emailHtml = '<div style="background:#eef6f7;padding:24px;font-family:Segoe UI,Arial,sans-serif;color:#0b3b46">'
  + '<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d7e7ea;border-radius:16px;overflow:hidden">'
  + '<div style="background:#0e8c9b;color:#ffffff;padding:18px 24px;font-size:18px;font-weight:600">Nova Smile</div>'
  + '<div style="padding:24px;font-size:15px">' + paragraphs
  + '<div style="margin:18px 0;padding:12px 16px;border-radius:12px;background:#f1f8f9;border:1px solid #d7e7ea"><b>Kod zgłoszenia / Request code: ' + esc(p.ticket_code) + '</b></div>'
  + '<p style="font-size:13px;color:#52717a;line-height:1.5;margin:0">Aby wrócić do rozmowy, otwórz formularz, wybierz „Wracam do mojej wizyty” i podaj ten sam e-mail oraz telefon.<br>To continue the conversation, open the form, choose "Returning to my appointment" and enter the same e-mail and phone.<br><a href="' + cfg.form_url + '" style="color:#0e8c9b">' + cfg.form_url + '</a></p>'
  + '</div>'
  + '<div style="padding:14px 24px;background:#f7fafb;font-size:12px;color:#7a8f95;line-height:1.5">Tę odpowiedź przygotował wirtualny asystent Nova Smile. / This reply was prepared by the Nova Smile virtual assistant.</div>'
  + '</div></div>';

return [{ json: Object.assign({}, p, { reply: reply, settings: cfg, ticket_updates: tu, email_html: emailHtml }) }];
