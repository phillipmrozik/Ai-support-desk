// Node / Węzeł: Dopasuj wybór do zgłoszenia / Match choice to ticket
// Module / Moduł: 2 · Wracający pacjent / Returning patient

// Z wybranej etykiety wyciągamy kod zgłoszenia (np. NS-4821).
// From the chosen label we pull out the ticket code (e.g. NS-4821).
const raw = $input.first().json;

function pick(name, fragments) {
  if (raw[name] !== undefined && raw[name] !== '') return raw[name];
  const key = Object.keys(raw).find(function (k) {
    const low = k.toLowerCase();
    return fragments.some(function (f) { return low.indexOf(f) !== -1; });
  });
  return key ? raw[key] : '';
}

const choice = String(pick('ticket_choice', ['wybierz', 'choose']));
const message = String(pick('message', ['wiadomo', 'message'])).trim();
const m = choice.match(/NS-\d{4,5}/);

return [{ json: { ticket_code: m ? m[0] : '', message: message } }];
