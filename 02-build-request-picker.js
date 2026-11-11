// Node / Węzeł: Przygotuj listę wyboru / Build request picker
// Module / Moduł: 2 · Wracający pacjent / Returning patient

// 2) Budujemy listę zgłoszeń do wyboru. Pokazujemy tylko te, które pasują do e-maila ORAZ telefonu.
// 2) We build the list of requests to choose from, only those matching BOTH e-mail and phone.
const form = $('Odczytaj odpowiedzi / Read answers').first().json;

const rows = $input.all()
  .map(function (i) { return i.json; })
  .filter(function (r) { return r.ticket_code && r.phone_digits === form.phone_digits; });

const TOPIC = {
  booking_new: 'Rezerwacja / Booking',
  booking_reschedule: 'Zmiana terminu / Reschedule',
  booking_cancel: 'Odwołanie / Cancellation',
  booking_confirm_slot: 'Potwierdzony termin / Confirmed slot',
  price_inquiry: 'Cennik / Prices',
  treatment_info: 'Pytanie o zabieg / Treatment question',
  preparation_aftercare: 'Przed i po zabiegu / Before and after care',
  hours_location_contact: 'Informacje o klinice / Clinic info',
  payments_insurance: 'Płatności / Payments',
  complaint: 'Reklamacja / Complaint',
  urgent_medical: 'Pilna sprawa / Urgent'
};

const newest = rows.slice(0, 10);
const options = newest.map(function (r) {
  const topic = TOPIC[r.category] || 'Rozmowa / Conversation';
  const visit = r.appointment_at ? ' · wizyta / visit: ' + String(r.appointment_at).slice(0, 16).replace('T', ' ') : '';
  return r.ticket_code + ' · ' + topic + visit;
});

const fields = [
  {
    fieldLabel: 'Wybierz swoje zgłoszenie / Choose your request',
    fieldName: 'ticket_choice',
    fieldType: 'dropdown',
    fieldOptions: { values: options.map(function (o) { return { option: o }; }) },
    requiredField: true
  },
  {
    fieldLabel: 'Twoja wiadomość / Your message',
    fieldName: 'message',
    fieldType: 'textarea',
    placeholder: 'Np. Chciałbym przełożyć wizytę na inny dzień. / E.g. I would like to move my appointment to another day.',
    requiredField: true
  }
];

return [{ json: { found: newest.length > 0, picker_fields: JSON.stringify(fields), count: newest.length } }];
