// Node / Węzeł: Zastosuj analizę / Apply analysis
// Module / Moduł: 5 · Zrozumienie (AI) i baza wiedzy / Understanding (AI) and knowledge

// Sprawdzamy i porządkujemy to, co zwróciło AI, żeby dalsze kroki miały pewne dane.
// We check and tidy up what the AI returned so the next steps get reliable data.
const base = $('Zbuduj zapytanie do AI / Build AI input').first().json;
const out = $input.first().json.output || {};

const INTENTS = ['greeting_smalltalk', 'thanks_closing', 'booking_new', 'booking_reschedule', 'booking_cancel', 'booking_confirm_slot', 'price_inquiry', 'treatment_info', 'preparation_aftercare', 'hours_location_contact', 'payments_insurance', 'invoice_documents', 'complaint', 'urgent_medical', 'staff_request', 'off_topic_spam', 'other'];
const URGENCY = ['low', 'normal', 'high', 'emergency'];
const SENTIMENT = ['positive', 'neutral', 'negative', 'angry'];
const keys = base.kb.map(function (r) { return r.kb_key; });

const parsed = Object.keys(out).length > 0;
const intent = INTENTS.indexOf(out.intent) !== -1 ? out.intent : 'other';
const detected = out.language === 'pl' ? 'pl' : 'en';       // wszystko poza polskim obsługujemy po angielsku
const preferred = base.preferred_language;
const replyLanguage = (preferred === 'pl' || preferred === 'en') ? preferred : detected;

let confidence = Number(out.confidence);
if (!isFinite(confidence)) confidence = 0;
confidence = Math.max(0, Math.min(1, confidence));

const analysis = {
  language: detected,
  intent: intent,
  urgency: URGENCY.indexOf(out.urgency) !== -1 ? out.urgency : 'normal',
  sentiment: SENTIMENT.indexOf(out.sentiment) !== -1 ? out.sentiment : 'neutral',
  topics: (Array.isArray(out.topics) ? out.topics : []).filter(function (t) { return keys.indexOf(t) !== -1; }),
  service: out.service || '',
  requested_datetime: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(out.requested_datetime || '') ? out.requested_datetime : '',
  requested_time_of_day: ['morning', 'afternoon', 'evening'].indexOf(out.requested_time_of_day) !== -1 ? out.requested_time_of_day : '',
  chosen_slot_index: parseInt(out.chosen_slot_index, 10) || 0,
  needs_human: parsed ? !!out.needs_human : true,
  needs_human_reason: parsed ? (out.needs_human_reason || '') : 'The analysis model returned no usable result',
  confidence: parsed ? confidence : 0,
  summary_pl: out.summary_pl || 'Wiadomość od pacjenta.',
  reasoning: out.reasoning || ''
};

const result = Object.assign({}, base, { analysis: analysis, reply_language: replyLanguage });
delete result.ai_prompt_understand;
return [{ json: result }];
