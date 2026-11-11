// Node / Węzeł: Złóż kontekst wracającego / Assemble returning context
// Module / Moduł: 2 · Wracający pacjent / Returning patient

// Składamy wszystko, co wiemy o wracającym pacjencie: zgłoszenie + historię rozmowy.
// We put together everything we know about the returning patient: the ticket + the chat history.
const form = $('Odczytaj odpowiedzi / Read answers').first().json;
const choice = $('Dopasuj wybór do zgłoszenia / Match choice to ticket').first().json;
const ticket = $('Pobierz zgłoszenie / Load ticket').first().json;

// Dodatkowe zabezpieczenie: wybrane zgłoszenie musi należeć do osoby, która podała ten e-mail i telefon.
// Extra safety check: the chosen ticket must belong to the person who typed this e-mail and phone.
if (!ticket || !ticket.ticket_code || ticket.email !== form.email || ticket.phone_digits !== form.phone_digits) {
  throw new Error('Ticket verification failed / Nie udało się zweryfikować zgłoszenia');
}

const history = $input.all()
  .map(function (i) { return i.json; })
  .filter(function (r) { return r.body; })
  .map(function (r) { return { who: r.direction, text: r.body, at: r.sent_at }; });

return [{ json: {
  is_returning: true,
  ticket_code: ticket.ticket_code,
  patient_name: ticket.patient_name,
  email: ticket.email,
  phone: ticket.phone,
  phone_digits: ticket.phone_digits,
  message: choice.message,
  preferred_language: 'auto',
  ticket: {
    status: ticket.status,
    category: ticket.category,
    service: ticket.service,
    appointment_at: ticket.appointment_at,
    calendar_event_id: ticket.calendar_event_id,
    offered_slots: ticket.offered_slots,
    language: ticket.language
  },
  history: history
} }];
