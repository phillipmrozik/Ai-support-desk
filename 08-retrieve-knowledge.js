// Node / Węzeł: Wyszukaj w bazie wiedzy / Retrieve knowledge
// Module / Moduł: 5 · Zrozumienie (AI) i baza wiedzy / Understanding (AI) and knowledge

// Prosty, przejrzysty "RAG": punktujemy artykuły z bazy wiedzy i bierzemy najlepsze.
// A simple, transparent "RAG": we score the knowledge base articles and take the best ones.
const p = $input.first().json;
const a = p.analysis;
const lang = p.reply_language;

function strip(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
}

const tokens = strip(p.message).split(/[^a-z0-9]+/).filter(function (t) { return t.length > 2; });

const scored = p.kb.map(function (r) {
  let score = 0;
  if (a.topics.indexOf(r.kb_key) !== -1) score += 10;                      // wskazane przez AI / picked by the AI
  const words = strip(r.keywords).split(/\s+/);
  let hits = 0;
  tokens.forEach(function (t) { if (words.indexOf(t) !== -1) hits++; });   // zgodność słów kluczowych / keyword overlap
  score += Math.min(hits, 4) * 1.5;
  return { r: r, score: score };
});

const skip = ['greeting_smalltalk', 'thanks_closing', 'off_topic_spam'].indexOf(a.intent) !== -1;
let chosen = skip ? [] : scored.filter(function (s) { return s.score >= 3; }).sort(function (x, y) { return y.score - x.score; }).slice(0, 4);

// Niektóre tematy zawsze potrzebują konkretnych artykułów.
// Some topics always need specific articles.
function ensure(key) {
  if (chosen.some(function (s) { return s.r.kb_key === key; })) return;
  const found = p.kb.find(function (r) { return r.kb_key === key; });
  if (found) chosen.push({ r: found, score: 99 });
}
if (a.intent === 'urgent_medical') { ensure('emergency'); ensure('contact'); }
if (a.intent.indexOf('booking_') === 0) { ensure('booking_policy'); ensure('hours'); }
if (a.intent === 'complaint') ensure('warranty_complaints');

const articles = chosen.map(function (s) {
  return {
    key: s.r.kb_key,
    title: lang === 'pl' ? s.r.title_pl : s.r.title_en,
    content: lang === 'pl' ? s.r.content_pl : s.r.content_en,
    score: s.score
  };
});

const kbText = articles.map(function (x) { return '[' + x.key + '] ' + x.title + ': ' + x.content; }).join('\n\n');

const result = Object.assign({}, p, { kb_articles: articles, kb_text: kbText });
delete result.kb;
return [{ json: result }];
