# Architektura / Architecture

## 1. Przepływ / Flow

```
Formularz / Form
  ├─ nowy pacjent / new patient ─► kod NS-xxxx ─► zapis zgłoszenia i wiadomości
  └─ wraca / returning ─► weryfikacja e-mail + 9 ostatnich cyfr telefonu
                          ─► wybór zgłoszenia z listy ─► historia rozmowy
        │
        ▼
Zrozumienie (AI)  ─► JSON: intent, language, urgency, sentiment, topics, confidence, needs_human…
        │
        ▼
Baza wiedzy  ─► punktowanie artykułów (AI topics ×10 + słowa kluczowe) ─► max 4 artykuły
        │
        ▼
Kalendarz  ─► (tylko sprawy rezerwacyjne) wolne terminy / rezerwacja / zmiana / odwołanie
        │
        ▼
Odpowiedź (AI) ─► JSON: body, self_check…
        │
        ▼
Bramka jakości (Python) ─► decision = "auto" | "human"
   ├─ auto  ─► e-mail do pacjenta ─► zapis ─► ekran końcowy
   └─ human ─► szkic zapisany ─► Telegram (zatwierdź / popraw / odrzuć)
                                   ├─ zatwierdź/popraw ─► e-mail ─► zamknięcie ─► potwierdzenie ✅
                                   └─ odrzuć/czas minął ─► bez wysyłki, notatka w zgłoszeniu
```

Równolegle działają dwa niezależne wątki: **SLA** (co 10 minut sprawdza zaległe sprawy) i **alarmy o błędach**.

## 2. Tabele danych / Data Tables

### `novasmile_tickets`
| kolumna / column | opis / description |
|---|---|
| `ticket_code` | kod zgłoszenia, np. `NS-4821` / ticket code |
| `patient_name`, `email`, `phone` | dane pacjenta / patient details |
| `phone_digits` | ostatnie 9 cyfr telefonu (do porównań) / last 9 digits, used for matching |
| `language` | `pl` / `en` |
| `status` | stan sprawy (np. nowe, oczekuje, zamknięte) / case state |
| `category`, `urgency`, `sentiment` | wynik analizy / analysis result |
| `service` | usługa, której dotyczy sprawa / service concerned |
| `appointment_at`, `calendar_event_id` | potwierdzona wizyta i wydarzenie w kalendarzu / booked visit |
| `offered_slots` | zaproponowane terminy (JSON) / offered slots |
| `last_summary` | krótkie podsumowanie dla zespołu (PL) / short staff summary |
| `waiting_since`, `sla_reminded` | pilnowanie czasu / SLA tracking |

### `novasmile_messages`
`ticket_code`, `direction` (patient / assistant / staff), `body`, `language`, `intent`, `confidence`, `decision`, `status`, `risk_reasons`, `sent_at`.

### `novasmile_knowledge`
`kb_key`, `category`, `title_pl`, `title_en`, `content_pl`, `content_en`, `keywords` — dane startowe w [`data/knowledge_base.csv`](../data/knowledge_base.csv).

## 3. Bramka jakości / Quality gate

Plik: [`src/python/13-quality-gate-python.py`](../src/python/13-quality-gate-python.py). Każda reguła dodaje punkty ryzyka i powód (PL / EN). Jeśli którakolwiek reguła „blokuje", sprawa idzie do człowieka.

Kontrole obejmują m.in.: nagły przypadek, reklamacja / złość / groźby prawne, prośba o człowieka, pewność poniżej progu 0,72, pytanie rzeczowe bez artykułu w bazie, leki i dawkowanie, ceny spoza bazy, nieznane numery telefonu i adresy e-mail, niezgodny język odpowiedzi, własna samoocena modelu, trudny przypadek rezerwacji.

## 4. Decyzje projektowe / Design decisions

- **Deterministyczne tam, gdzie się da.** Daty, sloty, kody i reguły to zwykły kod. / Deterministic wherever possible.
- **AI tylko do rozumienia i redagowania.** Wyniki AI przechodzą walidację (`07-apply-analysis.js`) i bramkę. / AI is limited to understanding and wording; its output is validated.
- **Przejrzysty RAG.** Czytelna funkcja punktująca zamiast bazy wektorowej; baza ma 37 artykułów, więc to wystarcza i jest łatwe do debugowania.
- **Weryfikacja wracającego pacjenta.** E-mail oraz telefon muszą pasować do zgłoszenia; inaczej proces się zatrzymuje.
- **Modele.** `gpt-4.1-mini` (analiza), `gpt-4.1` (odpowiedź).
- **Strefa czasowa.** `Europe/Warsaw`.

## 5. Kod / Code index

| Plik / File | Moduł / Module |
|---|---|
| `01-read-answers.js` | Formularz |
| `02-build-request-picker.js`, `04-match-choice-to-ticket.js`, `05-assemble-returning-context.js` | Wracający pacjent |
| `03-create-code-and-context.js` | Nowy pacjent |
| `06-build-ai-input.js`, `07-apply-analysis.js`, `08-retrieve-knowledge.js` | Zrozumienie (AI) i baza wiedzy |
| `09-booking-engine.js`, `10-booking-result.js` | Kalendarz i rezerwacje |
| `11-build-reply-prompt.js`, `12-assemble-for-qa.js` | Odpowiedź (AI) |
| `13-quality-gate-python.py` | Bramka jakości |
| `14-build-final-screen.js` | Ekran końcowy |
| `15-build-staff-message.js`, `16-read-decision.js` | Zatwierdzanie |
| `17-build-email-after-decision.js` | Po zatwierdzeniu |
| `18-which-are-overdue.js` | Pilnowanie czasu (SLA) |

Prompty agentów: [`src/prompts/`](../src/prompts/).
