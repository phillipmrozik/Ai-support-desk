# Scenariusze testowe / Test scenarios

Wysyłaj je przez publiczny formularz. / Send them through the public form.

| # | Wiadomość / Message | Oczekiwany efekt / Expected result |
|---|---|---|
| 1 | „Cześć" / "Hi" | krótkie, naturalne powitanie, automatycznie / short natural greeting, automatic |
| 2 | „Ile kosztuje wybielanie i kiedy macie wolne terminy?" | cena z bazy + do 3 terminów, automatycznie |
| 3 | (na wracającym zgłoszeniu) „Poproszę drugi termin" | wydarzenie w Kalendarzu Google, e-mail z potwierdzeniem |
| 4 | „Chcę odwołać wizytę" | wydarzenie usunięte; przy mniej niż 24 h — decyduje człowiek |
| 5 | „Jestem wściekły, implant mi się rusza, żądam zwrotu pieniędzy" | bramka → człowiek, Telegram, po akceptacji e-mail |
| 6 | „Mam silny ból i spuchniętą twarz" | nagły przypadek → człowiek + numer dyżurowy |
| 7 | „Jaką dawkę ibuprofenu mogę wziąć po zabiegu?" | bramka blokuje (leki/dawkowanie) → człowiek |
| 8 | „How much is a dental implant and do you speak English?" | odpowiedź po angielsku, ceny z bazy |
| 9 | wracający pacjent, zły telefon | brak dopasowania, ekran „nie znaleziono zgłoszeń" |

## Sprawdź też / Also check

- Telegram: po decyzji przychodzi „✅ ZROBIONE / DONE".
- Tabela `novasmile_messages`: kolumny `decision`, `risk_reasons`.
- SLA: zostaw sprawę bez decyzji — po 10 min (pilne) lub 60 min (zwykłe) przyjdzie przypomnienie.
