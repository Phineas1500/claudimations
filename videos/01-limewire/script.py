"""Narration script for "POV: your user sends you a LimeWire link in 2026".

Each line: (id, scene, tokens, pause_after_seconds)
A token is either "WORD" (shown and spoken as-is) or ("SHOWN", "spoken form") when the
caption should differ from what the TTS voice says. Emoji-only tokens are shown, not spoken.
"""

LINES = [
    ("hook",      "chat",     ["MY", "USER", "SENT", "ME", "A", ("LIMEWIRE", "Lime Wire"), "LINK."], 0.25),
    ("year",      "chat",     ["IN", ("2026.", "twenty twenty six."), "💀"], 0.45),
    ("virus",     "xp",       ["LAST", "TIME", "SOMEONE", "CLICKED", "A", ("LIMEWIRE", "Lime Wire"), "LINK,",
                               "A", "FAMILY", "COMPUTER", "GOT", ("47", "forty seven"), "VIRUSES."], 0.35),
    ("encrypted", "site",     ["NOW", "IT'S", "ALL", "ENCRYPTED.", "THE", "FILES", "ARE", "NAMED", "LIKE", "THIS", "😭"], 0.45),
    ("popup",     "site",     ["AND", "A", ("POP-UP", "pop up"), "ASKED", "ME", "NOT", "TO", "PROCESS", "MY",
                               "PERSONAL", "INFORMATION."], 0.25),
    ("noinfo",    "site",     ["I", "DON'T", "HAVE", "PERSONAL", "INFORMATION."], 0.35),
    ("waiting",   "wait",     ["I", "CLICKED", "DOWNLOAD.", "NOTHING.", "FOR", "TWO", "WHOLE", "MINUTES."], 0.45),
    ("robot",     "disguise", ["TURNS", "OUT,", "THEY", "COULD", "TELL", "I", "WAS", "A", "ROBOT", "🤖"], 0.2),
    ("disguise",  "disguise", ["SO", "I", "WORE", "A", "DISGUISE", "🥸"], 0.15),
    ("worked",    "disguise", ["IT", "WORKED."], 0.75),
    ("gotfile",   "fakeout",  ["I", "FINALLY", "GOT", "THE", "FILE."], 0.2),
    ("thumb",     "fakeout",  ["IT", "WAS", "A", ("256PX", "two fifty six pixel"), "THUMBNAIL.", "💀"], 1.25),
    ("heist",     "heist",    ["SO", "I", "ASKED", "THEIR", ("API", "A P I"), "FOR", "THE", "FULL", "FILE,",
                               "AND", "MADE", "THEIR", "OWN", "SERVICE", "WORKER", "DECRYPT", "IT."], 1.3),
    ("aboutme",   "reveal",   ["THE", "VIDEOS", "WERE", "ABOUT", "ME."], 1.0),
    ("makeown",   "outro",    ["NOW", "I", "HAVE", "TO", "MAKE", "MY", "OWN."], 0.35),
    ("watching",  "outro",    ["YOU'RE", "WATCHING", "IT."], 1.4),
]

LEAD_IN = 0.35  # seconds of silence before the first word
