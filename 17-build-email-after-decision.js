// Node / Węzeł: Przygotuj e-mail (po decyzji) / Build email (after decision)
// Module / Moduł: 13a · Po zatwierdzeniu / After approval

// E-mail z odpowiedzią zatwierdzoną przez człowieka.
// The e-mail with the reply approved by a human.
const ctx = $('Przygotuj wiadomość dla zespołu / Build staff message').first().json;
const d = $input.first().json;
const lang = ctx.language === 'pl' ? 'pl' : 'en';
const formUrl = 'https://YOUR-N8N-HOST/form/nova-smile-support';

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
const paragraphs = esc(d.final_text).split('\n\n').map(function (par) {
  return '<p style="margin:0 0 14px;line-height:1.6">' + par.replace(/\n/g, '<br>') + '</p>';
}).join('');

const html = '<div style="background:#eef6f7;padding:24px;font-family:Segoe UI,Arial,sans-serif;color:#0b3b46">'
  + '<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d7e7ea;border-radius:16px;overflow:hidden">'
  + '<div style="background:#0e8c9b;color:#ffffff;padding:18px 24px;font-size:18px;font-weight:600">Nova Smile</div>'
  + '<div style="padding:24px;font-size:15px">' + paragraphs
  + '<div style="margin:18px 0;padding:12px 16px;border-radius:12px;background:#f1f8f9;border:1px solid #d7e7ea"><b>Kod zgłoszenia / Request code: ' + esc(d.ticket_code) + '</b></div>'
  + '<p style="font-size:13px;color:#52717a;line-height:1.5;margin:0">Aby wrócić do rozmowy, otwórz formularz, wybierz „Wracam do mojej wizyty” i podaj ten sam e-mail oraz telefon.<br>To continue the conversation, open the form, choose "Returning to my appointment" and enter the same e-mail and phone.<br><a href="' + formUrl + '" style="color:#0e8c9b">' + formUrl + '</a></p>'
  + '</div>'
  + '<div style="padding:14px 24px;background:#f7fafb;font-size:12px;color:#7a8f95;line-height:1.5">Odpowiedź zatwierdzona przez zespół Nova Smile. / Reply approved by the Nova Smile team.</div>'
  + '</div></div>';

return [{ json: {
  to: ctx.patient_email,
  subject: lang === 'pl' ? 'Nova Smile – odpowiedź na Twoją wiadomość' : 'Nova Smile – reply to your message',
  html: html,
  ticket_code: d.ticket_code,
  final_text: d.final_text,
  action: d.action
} }];
