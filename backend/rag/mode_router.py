def detect_mode(question):

    q = question.lower()

    if "company" in q or "corporate" in q:
        return "corporate"

    if "right" in q or "article" in q:
        return "rights"

    if "ipc" in q or "punishment" in q or "crime" in q:
        return "legal"

    return "legal"