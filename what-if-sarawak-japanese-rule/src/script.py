"""Episode 2 — narration script, scene structure and on-screen tags.

Each line:
  id     unique key (also the narration clip filename)
  text   spoken words, used for subtitles
  tag    'actual'  = documented history (warm sepia, solid ACTUAL HISTORY badge)
         'alt'     = speculation (cold grade, dashed ALTERNATE HISTORY badge)
         'neutral' = framing / questions
  mode   'sub'   = normal subtitle
         'title' = large emphasis caption that replaces the subtitle (same words)
  pre    pause (s) before the line starts
  cues   optional manual subtitle split (must join back to text)
"""

# Pronunciation fixes (espeak IPA, after phonemisation).
PHONEME_FIX = {
    "sˈaɹɐwˌak": "sɐɹˈɑːwak",        # Sarawak: sa-RAH-wak
    "məlˈeɪziəɹ": "məlˈeɪziə",
    "sˌaɹɐwˈakiənz": "sɐɹˈɑːwakiənz",  # Sarawakians
    "mˈiəɹi": "mˈiːɹi",               # Miri: MEE-ree
    "dˈeɪak": "dˈaɪak",               # Dayak: DYE-ak
    "ˈaɪbən": "ˈiːbɑːn",              # Iban: EE-bahn
    "bˈɪdeɪˌʌ": "bɪdˈɑːjuː",          # Bidayuh: bi-DAH-yoo
    "mˈɛlɐnˌaʊ": "məlˈɑːnaʊ",         # Melanau: me-LAH-now
    "ɹˈɑːdʒɑːz": "ɹˈɑːdʒəz",          # Rajahs
}

# Text substitutions used only for speech (subtitles keep the original).
SPEECH_FIX = {
    "1941": "nineteen forty-one",
    "1943": "nineteen forty-three",
    "1945": "nineteen forty-five",
    "1946": "nineteen forty-six",
    "1963": "nineteen sixty-three",
    "1970s": "nineteen seventies",
}

SCENES = [
    {"id": "s1_hook", "title": "THE HOOK", "tail": 2.6, "lines": [
        {"id": "l01", "pre": 0.35, "tag": "neutral", "mode": "title",
         "text": "What if Sarawak had never left Japanese rule?"},
        {"id": "l02", "pre": 0.5, "tag": "neutral",
         "text": "In 1945, the Japanese occupation of Sarawak ended. Now imagine it never did."},
        {"id": "l03", "pre": 0.4, "tag": "alt",
         "text": "This is one possible alternate history."},
    ]},
    {"id": "s2_before", "title": "BEFORE THE WAR", "tail": 0.5, "lines": [
        {"id": "l04", "pre": 0.3, "tag": "actual",
         "text": "For about a hundred years, Sarawak was ruled by the Brooke family, known as the White Rajahs.",
         "cues": ["For about a hundred years, Sarawak was ruled", "by the Brooke family, known as the White Rajahs."]},
        {"id": "l05", "pre": 0.5, "tag": "actual",
         "text": "In December 1941, Japanese forces landed at Miri, and soon took Kuching."},
    ]},
    {"id": "s3_occupation", "title": "THE REAL OCCUPATION", "tail": 0.5, "lines": [
        {"id": "l06", "pre": 0.5, "tag": "actual",
         "text": "The occupation lasted almost four years."},
        {"id": "l07", "pre": 0.4, "tag": "actual",
         "text": "Food ran short. Prisoners of war and civilians were held at Batu Lintang camp, in Kuching.",
         "cues": ["Food ran short.", "Prisoners of war and civilians were held", "at Batu Lintang camp, in Kuching."]},
        {"id": "l08", "pre": 0.5, "tag": "actual",
         "text": "In 1945, Allied special forces parachuted into the interior and fought alongside Dayak communities.",
         "cues": ["In 1945, Allied special forces parachuted into the interior", "and fought alongside Dayak communities."]},
        {"id": "l09", "pre": 0.5, "tag": "actual",
         "text": "That September, the Japanese commander in Kuching surrendered."},
    ]},
    {"id": "s4_turn", "title": "THE TURN", "tail": 0.6, "lines": [
        {"id": "l10", "pre": 0.8, "tag": "alt",
         "text": "Now imagine the war ends in a settlement instead, and Japan keeps Borneo.",
         "cues": ["Now imagine the war ends in a settlement instead,", "and Japan keeps Borneo."]},
        {"id": "l11", "pre": 0.5, "tag": "alt",
         "text": "No liberation. No return of the Rajahs. No British colony.",
         "cues": ["No liberation. No return of the Rajahs.", "No British colony."]},
    ]},
    {"id": "s5_rule", "title": "WHO WOULD RULE?", "tail": 0.5, "lines": [
        {"id": "l12", "pre": 0.5, "tag": "alt",
         "text": "Japan might rule directly, or through local leaders."},
        {"id": "l13", "pre": 0.4, "tag": "actual",
         "text": "In real history, it gave Burma and the Philippines nominal independence in 1943, but kept control.",
         "cues": ["In real history, it gave Burma and the Philippines", "nominal independence in 1943, but kept control."]},
        {"id": "l14", "pre": 0.5, "tag": "alt",
         "text": "A puppet Borneo state is one possibility."},
    ]},
    {"id": "s6_life", "title": "OIL AND EVERYDAY LIFE", "tail": 0.5, "lines": [
        {"id": "l15", "pre": 0.5, "tag": "actual",
         "text": "Oil was a key reason Japan invaded Borneo."},
        {"id": "l16", "pre": 0.4, "tag": "alt",
         "text": "Here, Miri's oilfields might pump for Japanese industry for decades."},
        {"id": "l17", "pre": 0.5, "tag": "alt",
         "text": "Schools might teach in Japanese, and jobs might favour those who learned it.",
         "cues": ["Schools might teach in Japanese,", "and jobs might favour those who learned it."]},
        {"id": "l18", "pre": 0.5, "tag": "alt",
         "text": "Iban, Malay, Chinese, Bidayuh, Melanau and other languages might survive mostly at home.",
         "cues": ["Iban, Malay, Chinese, Bidayuh, Melanau", "and other languages might survive mostly at home."]},
    ]},
    {"id": "s7_resist", "title": "RESISTANCE AND CHANGE", "tail": 0.5, "lines": [
        {"id": "l19", "pre": 0.6, "tag": "actual",
         "text": "During the real occupation, communities were treated differently, and fear was common.",
         "cues": ["During the real occupation, communities were treated differently,", "and fear was common."]},
        {"id": "l20", "pre": 0.5, "tag": "alt",
         "text": "If it lasted, resistance might continue in the interior, as it did in 1945.",
         "cues": ["If it lasted, resistance might continue in the interior,", "as it did in 1945."]},
        {"id": "l21", "pre": 0.4, "tag": "alt",
         "text": "Or a new generation might demand independence, as happened across Asia.",
         "cues": ["Or a new generation might demand independence,", "as happened across Asia."]},
    ]},
    {"id": "s8_futures", "title": "THREE POSSIBLE FUTURES", "tail": 0.6, "lines": [
        {"id": "l22", "pre": 0.7, "tag": "alt",
         "text": "So where might Sarawak be by the 1970s? No one can know.",
         "cues": ["So where might Sarawak be by the 1970s?", "No one can know."]},
        {"id": "l23", "pre": 0.5, "tag": "alt",
         "text": "Perhaps a tightly controlled territory."},
        {"id": "l24", "pre": 0.4, "tag": "alt",
         "text": "Perhaps an independent state, won through long struggle."},
        {"id": "l25", "pre": 0.4, "tag": "alt",
         "text": "Perhaps a pawn, traded between rival powers."},
    ]},
    {"id": "s9_real", "title": "WHAT REALLY HAPPENED", "tail": 4.6, "lines": [
        {"id": "l26", "pre": 0.9, "tag": "actual",
         "text": "What really happened: liberation in 1945, a British colony in 1946, and Malaysia in 1963.",
         "cues": ["What really happened: liberation in 1945,", "a British colony in 1946, and Malaysia in 1963."]},
        {"id": "l27", "pre": 0.5, "tag": "actual",
         "text": "Even then, many Sarawakians opposed becoming a colony. Nothing was automatic.",
         "cues": ["Even then, many Sarawakians opposed becoming a colony.", "Nothing was automatic."]},
        {"id": "l28", "pre": 0.9, "tag": "neutral", "mode": "title",
         "text": "Which future do you think Sarawak would have had?"},
    ]},
]


def all_lines():
    for s in SCENES:
        for ln in s["lines"]:
            yield s, ln


if __name__ == "__main__":
    import re
    n = sum(len(re.findall(r"[A-Za-z0-9']+", ln["text"])) for _, ln in all_lines())
    print("spoken words:", n)
