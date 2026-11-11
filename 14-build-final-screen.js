// Node / Węzeł: Przygotuj ekran końcowy / Build final screen
// Module / Moduł: 11 · Ekran końcowy / Final screen

// Ekran, który pacjent widzi po wysłaniu formularza: odpowiedź (albo informacja, że sprawę przejął zespół).
// The screen the patient sees after sending the form: the reply (or a note that the team took over).
// Czytamy z bramki jakości, bo ona zawsze ma dane (wyjście IF jest puste na jednej z ścieżek).
// We read from the quality gate because it always has data (one output of the IF is empty on each path).
const p = $('Bramka jakości (Python) / Quality gate (Python)').first().json;
const cfg = p.settings;
const auto = p.gate.decision === 'auto';

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

const box = 'background:#f1f8f9;border:1px solid #d7e7ea;border-radius:12px;padding:16px 18px;line-height:1.6;font-size:15px';
const code = '<div style="margin-top:16px;padding:12px 16px;border-radius:12px;background:#0e8c9b;color:#ffffff;font-weight:600;letter-spacing:0.04em">Kod zgłoszenia / Request code: ' + esc(p.ticket_code) + '</div>';
const how = '<p style="margin:14px 0 0;font-size:13px;color:#52717a;line-height:1.5">Aby wrócić do rozmowy, otwórz formularz ponownie, wybierz „Wracam do mojej wizyty” i podaj ten sam e-mail oraz telefon.<br>To continue the conversation, open the form again, choose "Returning to my appointment" and enter the same e-mail and phone.</p>';

let content = '';
if (auto) {
  content = '<p style="margin:0 0 8px;font-size:14px;color:#52717a">Odpowiedź Nova Smile / Nova Smile reply</p>'
    + '<div style="' + box + '">' + esc(p.reply.body).replace(/\n/g, '<br>') + '</div>'
    + code
    + '<p style="margin:12px 0 0;font-size:13px;color:#52717a">Kopię wysłaliśmy też na Twój e-mail. / We also sent a copy to your e-mail.</p>'
    + how;
} else {
  const emergency = p.gate.is_emergency
    ? '<div style="margin-bottom:16px;padding:14px 16px;border-radius:12px;background:#fdecec;border:1px solid #f3b8b8;color:#8a1f1f;line-height:1.5"><b>Sytuacja pilna? / Urgent?</b><br>Zadzwoń na dyżur: ' + esc(cfg.emergency_phone) + '. W zagrożeniu życia dzwoń 112.<br>Call the on-call line: ' + esc(cfg.emergency_phone) + '. If life is at risk, call 112.</div>'
    : '';
  content = emergency
    + '<div style="' + box + '"><b>Dziękujemy! Przekazaliśmy Twoją sprawę zespołowi.</b><br>Odpowiedź dostaniesz e-mailem najszybciej, jak to możliwe.<br><br><b>Thank you! We have passed your request to our team.</b><br>You will receive a reply by e-mail as soon as possible.</div>'
    + code + how;
}

// Karta w kolorach kliniki, taka sama jak formularz.
// A card in the clinic colours, matching the form.
const html = '<div style="background:#eef6f7;padding:28px 14px;min-height:100vh;box-sizing:border-box;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0b3b46">'
  + '<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d7e7ea;border-radius:16px;box-shadow:0 8px 24px rgba(14,116,128,0.10);overflow:hidden">'
  + '<div style="background:#0e8c9b;color:#ffffff;padding:16px 24px;font-size:18px;font-weight:600">Nova Smile</div>'
  + '<div style="padding:24px">' + content + '</div></div></div>';

return [{ json: { final_html: html } }];
