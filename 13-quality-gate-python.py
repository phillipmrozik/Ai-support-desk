# Node / Węzeł: Bramka jakości (Python) / Quality gate (Python)
# Module / Moduł: 8 · Bramka jakości / Quality gate

# Bramka jakości: reguły bezpieczeństwa w czystym Pythonie (bez importów).
# Quality gate: safety rules in plain Python (no imports). It checks the AI reply BEFORE it can reach a patient.

data = dict(_items[0]["json"])
a = data.get("analysis", {})
reply = data.get("reply", {})
cfg = data.get("settings", {})
booking = data.get("booking", {})

body = str(reply.get("body", ""))
body_low = body.lower()
msg_low = str(data.get("message", "")).lower()
intent = a.get("intent", "other")
lang = data.get("reply_language", "pl")
threshold = float(cfg.get("confidence_threshold", 0.72))

blockers = []   # (punkty ryzyka, opis PL / EN)


def block(points, pl, en):
    blockers.append((points, pl + " / " + en))


def digit_runs(text):
    runs = []
    cur = ""
    for ch in text:
        if ch.isdigit():
            cur += ch
        elif cur:
            runs.append(cur)
            cur = ""
    if cur:
        runs.append(cur)
    return runs


# 1) Pilne sprawy zawsze idą do człowieka / Urgent cases always go to a human
emergency = intent == "urgent_medical" or a.get("urgency") == "emergency"
if emergency:
    block(60, "Sprawa pilna medycznie", "Medical emergency")

# 2) Reklamacje, złość, groźby prawne / Complaints, anger, legal threats
if intent == "complaint" or a.get("sentiment") == "angry":
    block(40, "Reklamacja lub zdenerwowany pacjent", "Complaint or angry patient")
legal = ["prawnik", "adwokat", "do sądu", "w sądzie", "pozew", "prokurat", "uokik", "lawyer", "solicitor", "lawsuit", "sue you", "chargeback", "odszkodowan", "zadośćuczynien"]
if any(w in msg_low for w in legal):
    block(40, "Wzmianka o sprawach prawnych lub odszkodowaniu", "Mention of legal action or compensation")

# 3) Prośba o człowieka lub decyzja poza zasadami / Request for a human or a decision outside the rules
if intent == "staff_request":
    block(30, "Pacjent prosi o kontakt z człowiekiem lub wyjątek", "Patient asks for a human or an exception")
if a.get("needs_human"):
    block(30, "Analiza AI: potrzebna decyzja człowieka (" + str(a.get("needs_human_reason", "")) + ")", "AI analysis: a human decision is needed")
if reply.get("needs_human"):
    block(30, "Asystent nie jest pewien odpowiedzi (" + str(reply.get("needs_human_reason", "")) + ")", "The assistant is not sure about the answer")

# 4) Pewność modelu / Model confidence
if float(a.get("confidence", 0)) < threshold:
    block(25, "Niska pewność rozpoznania sprawy", "Low confidence in understanding the request")

# 5) Pytania o fakty bez źródła w bazie wiedzy / Factual questions without a source in the knowledge base
factual = ["price_inquiry", "treatment_info", "preparation_aftercare", "hours_location_contact", "payments_insurance", "invoice_documents"]
if intent in factual and len(data.get("kb_articles", [])) == 0:
    block(35, "Brak odpowiedzi w bazie wiedzy", "No answer found in the knowledge base")

# 6) Porady medyczne i leki / Medical advice and medicines
medical = ["ibuprofen", "paracetamol", "nurofen", "aspiryn", "aspirin", "antybiotyk", "antibiotic", "amoksycylin", "amoxicillin", "ketonal", "diklofenak", "diclofenac", " mg ", " mg."]
if any(w in body_low for w in medical):
    block(50, "Odpowiedź zawiera nazwę leku lub dawkę", "The reply mentions a medicine or a dose")

# 7) Ceny muszą pochodzić z bazy wiedzy / Prices must come from the knowledge base
kb_numbers = set(digit_runs(str(data.get("kb_text", ""))))
unsupported = []
for marker in ["zł", "pln", "eur", "€"]:
    start = 0
    while True:
        idx = body_low.find(marker, start)
        if idx == -1:
            break
        j = idx - 1
        while j >= 0 and body_low[j] == " ":
            j -= 1
        k = j
        while k >= 0 and body_low[k].isdigit():
            k -= 1
        num = body_low[k + 1:j + 1]
        if num and num not in kb_numbers:
            unsupported.append(num)
        start = idx + len(marker)
if unsupported:
    block(45, "Cena w odpowiedzi nie występuje w bazie wiedzy (" + ", ".join(unsupported) + ")", "A price in the reply is not in the knowledge base")

# 8) Numery telefonów i e-maile tylko znane / Only known phone numbers and e-mails
allowed_phones = []
for key in ["clinic_phone", "emergency_phone"]:
    allowed_phones.append("".join([c for c in str(cfg.get(key, "")) if c.isdigit()])[-9:])
allowed_phones.append(str(data.get("phone_digits", "")))
cur = ""
leak = False
for ch in body + " ":
    if ch.isdigit():
        cur += ch
    elif ch in " -+" and cur:
        continue
    else:
        if len(cur) >= 9 and cur[-9:] not in allowed_phones:
            leak = True
        cur = ""
allowed_mails = [str(cfg.get("clinic_email", "")).lower(), str(data.get("email", "")).lower()]
for token in body_low.split():
    token = token.strip(",.;:()<>\"'")
    if "@" in token and token not in allowed_mails:
        leak = True
if leak:
    block(45, "W odpowiedzi jest nieznany telefon lub e-mail", "The reply contains an unknown phone number or e-mail")

# 9) Język odpowiedzi / Reply language
pl_letters = sum(1 for ch in body_low if ch in "ąćęłńóśźż")
if lang == "en" and pl_letters > 2:
    block(25, "Odpowiedź miała być po angielsku", "The reply was supposed to be in English")
if lang == "pl" and len(body) > 120 and pl_letters == 0:
    block(25, "Odpowiedź miała być po polsku", "The reply was supposed to be in Polish")

# 10) Autokontrola modelu piszącego / Self-check of the writer model
sc = reply.get("self_check", {})
if sc.get("all_facts_from_clinic_facts") is False or sc.get("contains_medical_advice") is True or sc.get("language_matches") is False:
    block(35, "Autokontrola asystenta wykryła problem", "The assistant self-check found a problem")

# 11) Kalendarz / Calendar
if booking.get("action") == "need_human":
    block(35, "Rezerwacja wymaga decyzji człowieka (" + str(booking.get("note", "")) + ")", "The booking needs a human decision")

risk = min(100, sum(p for p, _ in blockers))
data["gate"] = {
    "decision": "human" if blockers else "auto",
    "is_emergency": emergency,
    "risk_score": risk,
    "reasons": [r for _, r in blockers],
    "checks_run": 11
}
return [{"json": data}]
