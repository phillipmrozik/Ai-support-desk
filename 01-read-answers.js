// Node / Węzeł: Odczytaj odpowiedzi / Read answers
// Module / Moduł: 1 · Formularz / Form

// 1) Odczyt odpowiedzi z pierwszej strony formularza
// 1) Reading the answers from the first form page
const raw = $input.first().json;

// Szukamy pola po nazwie technicznej albo po fragmencie etykiety.
// We look for a field by its technical name or by a piece of its label.
function pick(names, fragments) {
  for (const n of names) {
    if (raw[n] !== undefined && raw[n] !== null && raw[n] !== '') return raw[n];
  }
  const key = Object.keys(raw).find(function (k) {
    const low = k.toLowerCase();
    return fragments.some(function (f) { return low.indexOf(f) !== -1; });
  });
  return key ? raw[key] : '';
}

const action = String(pick(['action'], ['co chcesz', 'what would you like'])).toLowerCase();
const email = String(pick(['email'], ['e-mail', 'email'])).trim().toLowerCase();
const phone = String(pick(['phone'], ['telefon', 'phone'])).trim();

// Do porównań używamy tylko ostatnich 9 cyfr numeru (bez +48, spacji i myślników).
// For comparisons we only use the last 9 digits of the number (no +48, spaces or dashes).
const phoneDigits = phone.replace(/\D/g, '').slice(-9);

const isReturning = action.indexOf('wracam') !== -1 || action.indexOf('returning') !== -1;

return [{ json: {
  action_key: isReturning ? 'return' : 'new',
  email: email,
  phone: phone,
  phone_digits: phoneDigits
} }];
