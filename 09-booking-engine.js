// Node / Węzeł: Silnik rezerwacji / Booking engine
// Module / Moduł: 6 · Kalendarz i rezerwacje / Calendar and booking

// Silnik rezerwacji: szuka wolnych terminów i decyduje, co zrobić w kalendarzu.
// Booking engine: finds free slots and decides what to do in the calendar.
const p = $('Wyszukaj w bazie wiedzy / Retrieve knowledge').first().json;
const cfg = $('Ustawienia kliniki / Clinic settings').first().json;
const a = p.analysis;
const tz = cfg.timezone;

const booking = { action: 'none', slots: [], chosen: null, note: '', old_event_id: '', event_start: '', event_end: '', event_summary: '', event_description: '' };

// ---------- pomocnicze funkcje / helper functions ----------
function pad(n) { return String(n).padStart(2, '0'); }

// ISO z kalendarza -> czas lokalny "YYYY-MM-DDTHH:mm"
// ISO from the calendar -> local time "YYYY-MM-DDTHH:mm"
function toLocal(iso) {
  const s = new Intl.DateTimeFormat('sv-SE', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
  return s.replace(' ', 'T');
}
function localNow(addHours) { return toLocal(new Date(Date.now() + (addHours || 0) * 3600 * 1000).toISOString()); }
function asMinutes(local) {
  return Date.UTC(+local.slice(0, 4), +local.slice(5, 7) - 1, +local.slice(8, 10), +local.slice(11, 13), +local.slice(14, 16)) / 60000;
}
function addMinutes(local, m) {
  const d = new Date((asMinutes(local) + m) * 60000);
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes());
}
function label(local, lang) {
  return new Intl.DateTimeFormat(lang === 'pl' ? 'pl-PL' : 'en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(local + ':00Z'));
}

// ---------- zajęte terminy z kalendarza / busy times from the calendar ----------
const busy = $input.all()
  .map(function (i) { return i.json; })
  .filter(function (e) { return e && e.start && e.start.dateTime && e.end && e.end.dateTime; })
  .map(function (e) { return { s: asMinutes(toLocal(e.start.dateTime)), e: asMinutes(toLocal(e.end.dateTime)) }; });

function isFree(startLocal) {
  const s = asMinutes(startLocal);
  const e = s + cfg.slot_minutes;
  return !busy.some(function (b) { return b.s < e && b.e > s; });
}

function hoursFor(dateStr) {
  const day = new Date(dateStr + 'T12:00:00Z').getUTCDay();   // 0 = niedziela / Sunday
  if (day === 0) return null;
  if (day === 6) return [cfg.saturday_open, cfg.saturday_close];
  return [cfg.weekday_open, cfg.weekday_close];
}

function freeSlots() {
  const minStart = localNow(2);                                // nie wcześniej niż za 2 godziny / not earlier than 2 hours from now
  const today = localNow(0).slice(0, 10);
  const result = [];
  for (let d = 0; d <= cfg.search_days; d++) {
    const day = new Date(today + 'T12:00:00Z');
    day.setUTCDate(day.getUTCDate() + d);
    const dateStr = day.toISOString().slice(0, 10);
    const h = hoursFor(dateStr);
    if (!h) continue;
    for (let hour = h[0]; hour + cfg.slot_minutes / 60 <= h[1]; hour++) {
      const start = dateStr + 'T' + pad(hour) + ':00';
      if (start >= minStart && isFree(start)) result.push(start);
    }
  }
  return result;
}

// Wybieramy 3 terminy najbliższe życzeniu pacjenta.
// We pick the 3 slots closest to what the patient asked for.
function rank(list) {
  const want = a.requested_datetime || '';
  const tod = a.requested_time_of_day || '';
  const scored = list.map(function (s) {
    let score = 0;
    if (want && want.length === 10) {
      score = Math.abs(asMinutes(s.slice(0, 10) + 'T12:00') - asMinutes(want + 'T12:00')) / 60 + (+s.slice(11, 13)) / 100;
    } else if (want) {
      score = Math.abs(asMinutes(s) - asMinutes(want)) / 60;
    } else {
      score = asMinutes(s) / 60 / 1000;
    }
    const hr = +s.slice(11, 13);
    if (tod === 'morning' && hr >= 12) score += 500;
    if (tod === 'afternoon' && (hr < 12 || hr >= 17)) score += 500;
    if (tod === 'evening' && hr < 17) score += 500;
    return { s: s, score: score };
  });
  scored.sort(function (x, y) { return x.score - y.score; });
  return scored.slice(0, cfg.max_slots).map(function (x) { return x.s; }).sort();
}

function offer(note) {
  const slots = rank(freeSlots());
  booking.slots = slots.map(function (s) { return { start: s, label_pl: label(s, 'pl'), label_en: label(s, 'en') }; });
  booking.action = slots.length ? 'offer_slots' : 'need_human';
  booking.note = slots.length ? (note || '') : 'No free slots found in the next ' + cfg.search_days + ' days';
}

// ---------- decyzja / the decision ----------
const t = p.ticket || {};
const existingLocal = t.appointment_at ? String(t.appointment_at).slice(0, 16) : '';
const existingEvent = t.calendar_event_id || '';
const hoursToVisit = existingLocal ? (asMinutes(existingLocal) - asMinutes(localNow(0))) / 60 : null;
const tooLate = existingEvent && hoursToVisit !== null && hoursToVisit < cfg.min_notice_hours;

if (a.intent === 'booking_new') {
  offer('');
} else if (a.intent === 'booking_reschedule') {
  if (tooLate) { booking.action = 'need_human'; booking.note = 'Reschedule requested less than ' + cfg.min_notice_hours + 'h before the visit (policy: staff decides about the fee)'; }
  else offer('');
} else if (a.intent === 'booking_cancel') {
  if (!existingEvent) { booking.action = 'need_human'; booking.note = 'Cancellation requested but no booked appointment found on this ticket'; }
  else if (tooLate) { booking.action = 'need_human'; booking.note = 'Cancellation less than ' + cfg.min_notice_hours + 'h before the visit (policy: staff decides about the fee)'; }
  else { booking.action = 'cancel'; booking.old_event_id = existingEvent; }
} else if (a.intent === 'booking_confirm_slot') {
  let offered = [];
  try { offered = JSON.parse(t.offered_slots || '[]'); } catch (e) { offered = []; }
  const chosen = offered[a.chosen_slot_index - 1];
  if (!chosen) offer('We could not match the answer to one of the offered times, so new options are offered.');
  else if (!isFree(chosen.start)) offer('The chosen time has just been taken, so new options are offered.');
  else if (tooLate) { booking.action = 'need_human'; booking.note = 'Moving the appointment less than ' + cfg.min_notice_hours + 'h before the visit (policy)'; }
  else {
    booking.chosen = chosen;
    booking.action = existingEvent ? 'reschedule' : 'create';
    booking.old_event_id = existingEvent;
  }
}

if (booking.chosen) {
  const NAMES = { consultation: 'Konsultacja', hygiene: 'Higienizacja', whitening: 'Wybielanie', filling: 'Wypełnienie', root_canal: 'Leczenie kanałowe', extraction: 'Usunięcie zęba', implant: 'Implant', crown: 'Korona', veneer: 'Licówka', orthodontics: 'Ortodoncja', aesthetic_botulinum: 'Botulina', aesthetic_filler: 'Kwas hialuronowy' };
  const service = a.service || t.service || 'consultation';
  booking.event_start = booking.chosen.start + ':00';
  booking.event_end = addMinutes(booking.chosen.start, cfg.slot_minutes) + ':00';
  booking.event_summary = 'Nova Smile · ' + (NAMES[service] || 'Wizyta') + ' · ' + p.patient_name;
  booking.event_description = 'Ticket ' + p.ticket_code + ' | ' + p.email + ' | ' + p.phone + ' (demo)';
}

return [{ json: Object.assign({}, p, { booking: booking }) }];
