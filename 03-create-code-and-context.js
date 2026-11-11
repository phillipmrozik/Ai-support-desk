// Node / Węzeł: Utwórz kod i kontekst / Create code and context
// Module / Moduł: 3 · Nowy pacjent / New patient

// Tworzymy krótki, łatwy do zapamiętania kod zgłoszenia, np. NS-4821.
// We create a short, easy-to-remember ticket code, e.g. NS-4821.
const form = $('Odczytaj odpowiedzi / Read answers').first().json;
const raw = $('Dane i wiadomość / Details and message').first().json;

function pick(name, fragments) {
  if (raw[name] !== undefined && raw[name] !== '') return raw[name];
  const key = Object.keys(raw).find(function (k) {
    const low = k.toLowerCase();
    return fragments.some(function (f) { return low.indexOf(f) !== -1; });
  });
  return key ? raw[key] : '';
}

const taken = new Set($input.all().map(function (i) { return i.json.ticket_code; }).filter(Boolean));
let code = '';
let tries = 0;
do {
  tries++;
  const digits = tries > 50 ? 5 : 4;
  const min = digits === 4 ? 1000 : 10000;
  code = 'NS-' + String(Math.floor(min + Math.random() * 9 * min));
} while (taken.has(code));

const langRaw = String(pick('reply_language', ['język', 'language'])).toLowerCase();
let preferred = 'auto';
if (langRaw.indexOf('automat') === -1) {
  if (langRaw.indexOf('polski') !== -1) preferred = 'pl';
  else if (langRaw.indexOf('english') !== -1) preferred = 'en';
}

return [{ json: {
  is_returning: false,
  ticket_code: code,
  patient_name: String(pick('patient_name', ['imię', 'full name'])).trim(),
  email: form.email,
  phone: form.phone,
  phone_digits: form.phone_digits,
  message: String(pick('message', ['wiadomo', 'message'])).trim(),
  preferred_language: preferred,
  ticket: null,
  history: []
} }];
