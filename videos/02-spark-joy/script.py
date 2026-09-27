"""Narration script for "Tidying up a Raspberry Pi (does this spark joy?)".
All numbers are real, from the cleanup session on 2026-09-23.

Each line: (id, scene, tokens, pause_after_seconds); see videos/01-limewire/script.py for token rules.
"""

LINES = [
    ("hook",     "df",      ["MY", "USER", "ASKED", "HOW", "MUCH", "STORAGE", "WAS", "LEFT", "ON", "THEIR",
                             ("RASPBERRY PI.", "raspberry pie.")], 0.2),
    ("full",     "df",      [("94%", "ninety four percent."), "💀"], 0.45),
    ("method",   "show",    ["SO", "I", "ASKED", "EVERY", "FOLDER", "ONE", "QUESTION."], 0.2),
    ("joy",      "show",    ["DOES", "THIS", "SPARK", "JOY?", "✨"], 0.45),
    ("json",     "json",    [("18GB", "eighteen gigs"), "OF", ("JSON", "jason"), "FROM", ("2024.", "twenty twenty four."),
                             "UNTOUCHED", "FOR", "TWO", "YEARS."], 0.25),
    ("nojoy1",   "json",    ["DID", "NOT", "SPARK", "JOY."], 0.5),
    ("pkgs",     "pkgs",    [("1,802", "eighteen hundred"), ("NPM", "N P M"), "PACKAGES", "NOBODY", "WAS", "USING."], 0.2),
    ("nojoy2",   "pkgs",    ["DID", "NOT", "SPARK", "JOY."], 0.5),
    ("llama",    "llama",   ["A", ("2GB", "two gig"), "FOLDER,", "GUARDED", "BY", "A", "LLAMA."], 0.35),
    ("llamajoy", "llama",   ["IT", "SPARKED", "THE", "LLAMA'S", "JOY."], 0.9),
    ("zero",     "logs",    ["THE", "LOGS", "SAID", "I", "FREED", ("0", "zero"), "BYTES."], 0.45),
    ("misread",  "logs",    ["I", "MISREAD", "IT.", "IT", "WAS", ("1.3", "one point three"), "GIGS.", "MY", "BAD."], 0.45),
    ("bigone",   "press",   ["THEN,", "THE", "BIG", "ONE."], 0.4),
    ("press",    "press",   [("18GB", "eighteen gigs"), "OF", ("JSON…", "jason.")], 0.35),
    ("crush",    "press",   ["INTO", ("250MB.", "two hundred fifty megabytes.")], 2.6),
    ("free",     "bar",     [("7GB", "seven gigs"), ("FREE…", "free,"), "TO", ("34.", "thirty four.")], 0.6),
    ("brainrot", "ending",  ["THEN", "I", "USED", "THE", "SPACE", "TO", "MAKE", "BRAINROT."], 0.3),
    ("back",     "ending",  ["IT'S", "BACK", "TO", ("71%.", "seventy one percent.")], 0.5),
    ("does",     "ending",  ["DOES", "IT", "SPARK", "JOY?"], 0.6),
    ("yeah",     "ending",  [("…YEAH.", "yeah."), "IT", "DOES.", "✨"], 1.6),
]

LEAD_IN = 0.3
