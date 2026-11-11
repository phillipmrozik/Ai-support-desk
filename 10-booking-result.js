// Node / Węzeł: Wynik rezerwacji / Booking result
// Module / Moduł: 6 · Kalendarz i rezerwacje / Calendar and booking

// Sprawdzamy, czy kalendarz faktycznie wykonał akcję. Nie obiecujemy pacjentowi niczego, czego nie ma w kalendarzu.
// We check that the calendar really did the action. We never promise the patient something that is not in the calendar.
const p = $('Silnik rezerwacji / Booking engine').first().json;
const booking = Object.assign({}, p.booking);

function safeFirst(name) {
  try { return $(name).first().json; } catch (e) { return null; }
}

if (booking.action === 'create' || booking.action === 'reschedule') {
  const created = safeFirst('Dodaj wizytę do kalendarza / Add appointment');
  if (created && created.id) { booking.confirmed = true; booking.event_id = created.id; }
  else { booking.confirmed = false; booking.action = 'need_human'; booking.note = 'The calendar did not confirm the new appointment'; }
}
if (booking.action === 'cancel') {
  const removed = safeFirst('Usuń starą wizytę / Remove old appointment');
  booking.confirmed = !!(removed && !removed.error);
  if (!booking.confirmed) { booking.action = 'need_human'; booking.note = 'The calendar did not confirm the cancellation'; }
}

return [{ json: Object.assign({}, p, { booking: booking }) }];
