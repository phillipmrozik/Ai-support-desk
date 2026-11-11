// Node / Węzeł: Odczytaj decyzję / Read decision
// Module / Moduł: 12 · Zatwierdzanie / Human approval

// Zamieniamy odpowiedź z formularza na prostą decyzję: approve / edit / reject / expired.
// We turn the form answer into a simple decision: approve / edit / reject / expired.
const ctx = $('Przygotuj wiadomość dla zespołu / Build staff message').first().json;
const r = $input.first().json || {};

// Zbieramy wszystkie teksty z odpowiedzi, niezależnie od tego, jak formularz je opakował.
// We collect every text from the answer, no matter how the form wrapped it.
const answers = [];
function walk(node, key) {
  if (node === null || node === undefined) return;
  if (typeof node === 'string') { answers.push({ key: key, value: node }); return; }
  if (typeof node === 'object') { Object.keys(node).forEach(function (k) { walk(node[k], k); }); }
}
walk(r, '');

// 1) Decyzja: która z trzech opcji została wybrana
// 1) Decision: which of the three options was chosen
const decisionHit = answers.find(function (a) {
  return a.value.length < 120 && /zatwierd|approve and send|popraw|edited version|odrzu|reject, do not send/i.test(a.value);
});
const decisionRaw = decisionHit ? decisionHit.value : '';

// 2) Tekst odpowiedzi (przydatny przy wersji poprawionej)
// 2) The reply text (used for the edited version)
let textRaw = '';
const byKey = answers.find(function (a) { return /tre[sś][cć]|reply text/i.test(a.key); });
if (byKey) {
  textRaw = byKey.value.trim();
} else {
  const others = answers
    .filter(function (a) { return a !== decisionHit && a.value.length > 40; })
    .sort(function (x, y) { return y.value.length - x.value.length; });
  if (others.length) textRaw = others[0].value.trim();
}

let action = 'expired';                                   // brak odpowiedzi w limicie czasu / no answer within the time limit
if (/zatwierd|approve and send/i.test(decisionRaw)) action = 'approve';
else if (/popraw|edited version/i.test(decisionRaw)) action = 'edit';
else if (/odrzu|reject/i.test(decisionRaw)) action = 'reject';

let finalText = '';
if (action === 'approve') finalText = ctx.draft_text;
if (action === 'edit') finalText = textRaw || ctx.draft_text;

return [{ json: { action: action, final_text: finalText, ticket_code: ctx.ticket_code } }];
