"""Narration script, scene structure and on-screen tags.

Each line:
  id     unique key (also the narration clip filename)
  text   spoken words, used for subtitles
  tag    'actual'  = documented history (warm sepia, solid ACTUAL HISTORY badge)
         'alt'     = speculation (cold grade, dashed ALTERNATE HISTORY badge)
         'neutral' = framing / questions
  mode   'sub'   = normal subtitle
         'title' = large emphasis caption that replaces the subtitle (same words)
  pre    pause (s) before the line starts
  tts    optional pronunciation override in Kokoro/espeak IPA, per word
"""

# Pronunciation fixes: espeak stresses the first syllable of Sarawak.
# Local pronunciation is sa-RAH-wak.
PHONEME_FIX = {
    "sˈaɹɐwˌak": "sɐɹˈɑːwak",
    "məlˈeɪziəɹ": "məlˈeɪziə",
}

# Text substitutions used only for speech (subtitles keep the digits).
SPEECH_FIX = {
    "1941": "nineteen forty-one",
    "1945": "nineteen forty-five",
    "1963": "nineteen sixty-three",
}

SCENES = [
    {"id": "s1_hook", "title": "THE HOOK", "tail": 2.4, "lines": [
        {"id": "l01", "pre": 0.35, "tag": "neutral", "mode": "title",
         "text": "What if the world you know had never existed?"},
        {"id": "l02", "pre": 0.55, "tag": "neutral",
         "text": "What if Nazi Germany and Imperial Japan had won the Second World War?",
         "cues": ["What if Nazi Germany and Imperial Japan", "had won the Second World War?"]},
        {"id": "l03", "pre": 0.45, "tag": "alt",
         "text": "This is one possible alternate history."},
    ]},
    {"id": "s2_turn", "title": "THE TURNING POINT", "tail": 0.6, "lines": [
        {"id": "l04", "pre": 0.3, "tag": "actual",
         "text": "In our history, the Axis powers were defeated."},
        {"id": "l05", "pre": 0.35, "tag": "actual",
         "text": "Germany surrendered in May 1945; Japan, that August."},
        {"id": "l06", "pre": 0.55, "tag": "alt",
         "text": "Victory would have needed many changes, not one single battle.",
         "cues": ["Victory would have needed many changes,", "not one single battle."]},
        {"id": "l07", "pre": 0.5, "tag": "alt",
         "text": "So imagine the war ending in an uneasy settlement."},
    ]},
    {"id": "s3_world", "title": "A DIVIDED WORLD", "tail": 0.9, "lines": [
        {"id": "l08", "pre": 0.5, "tag": "alt",
         "text": "In this imagined world, Germany dominates much of continental Europe.",
         "cues": ["In this imagined world, Germany", "dominates much of continental Europe."]},
        {"id": "l09", "pre": 0.7, "tag": "alt",
         "text": "Japan holds vast territories across East and Southeast Asia.",
         "cues": ["Japan holds vast territories", "across East and Southeast Asia."]},
        {"id": "l10", "pre": 0.7, "tag": "alt",
         "text": "The United States remains a powerful rival."},
    ]},
    {"id": "s4_europe", "title": "OCCUPIED EUROPE", "tail": 0.7, "lines": [
        {"id": "l11", "pre": 0.5, "tag": "alt",
         "text": "For millions in Europe, the nightmare would not end."},
        {"id": "l12", "pre": 0.6, "tag": "actual",
         "text": "In real history, the Nazi regime murdered six million Jews, and millions of others.",
         "cues": ["In real history, the Nazi regime", "murdered six million Jews, and millions of others."]},
        {"id": "l13", "pre": 0.8, "tag": "alt",
         "text": "In a victorious Reich, persecution and mass murder could have continued.",
         "cues": ["In a victorious Reich, persecution", "and mass murder could have continued."]},
        {"id": "l14", "pre": 0.6, "tag": "alt",
         "text": "Families displaced. Papers checked. Freedom of speech, gone.",
         "cues": ["Families displaced. Papers checked.", "Freedom of speech, gone."]},
    ]},
    {"id": "s5_asia", "title": "UNDER JAPANESE RULE", "tail": 0.6, "lines": [
        {"id": "l15", "pre": 0.5, "tag": "actual",
         "text": "Japanese rule in occupied Asia was also harsh, though it varied by place."},
        {"id": "l16", "pre": 0.5, "tag": "actual",
         "text": "Rice, rubber, oil and tin were taken. Hundreds of thousands were forced into labour."},
        {"id": "l17", "pre": 0.6, "tag": "alt",
         "text": "If that rule had lasted, exploitation might have shaped generations.",
         "cues": ["If that rule had lasted, exploitation", "might have shaped generations."]},
        {"id": "l18", "pre": 0.5, "tag": "alt",
         "text": "Yet people would still hold on to family, faith, and language.",
         "cues": ["Yet people would still hold on", "to family, faith, and language."]},
    ]},
    {"id": "s6_coldwar", "title": "A NEW COLD WAR?", "tail": 0.6, "lines": [
        {"id": "l19", "pre": 0.5, "tag": "alt", "mode": "title",
         "text": "But would the victors stay friends?"},
        {"id": "l20", "pre": 0.4, "tag": "actual",
         "text": "Germany and Japan were distant allies with different ambitions.",
         "cues": ["Germany and Japan were distant allies", "with different ambitions."]},
        {"id": "l21", "pre": 0.4, "tag": "alt",
         "text": "Facing the United States, they might become three rivals: watching, arming, waiting.",
         "cues": ["Facing the United States, they might", "become three rivals: watching, arming, waiting."]},
        {"id": "l22", "pre": 0.4, "tag": "alt", "mode": "title",
         "text": "A different Cold War might have begun."},
    ]},
    {"id": "s7_sarawak", "title": "WHAT ABOUT SARAWAK?", "tail": 0.6, "lines": [
        {"id": "l23", "pre": 0.6, "tag": "neutral",
         "text": "Now, closer to home: Sarawak, on Borneo."},
        {"id": "l24", "pre": 0.5, "tag": "actual",
         "text": "This part is real: Japan occupied Sarawak from 1941 to 1945.",
         "cues": ["This part is real: Japan occupied Sarawak", "from 1941 to 1945."]},
        {"id": "l25", "pre": 0.4, "tag": "actual",
         "text": "People lived with shortages, strict control, and fear."},
        {"id": "l26", "pre": 0.8, "tag": "alt",
         "text": "Now imagine that occupation had never ended."},
        {"id": "l27", "pre": 0.5, "tag": "alt",
         "text": "Would Sarawak have remained under Japanese rule?"},
        {"id": "l28", "pre": 0.4, "tag": "actual",
         "text": "In our history, it helped form Malaysia in 1963. Would that still happen?",
         "cues": ["In our history, it helped form Malaysia in 1963.", "Would that still happen?"]},
        {"id": "l29", "pre": 0.5, "tag": "alt",
         "text": "And what about our languages, families, and future?"},
    ]},
    {"id": "s8_reflect", "title": "REFLECTION", "tail": 5.2, "lines": [
        {"id": "l30", "pre": 0.9, "tag": "neutral",
         "text": "History was never inevitable. It was shaped by choices, sacrifice, and resistance.",
         "cues": ["History was never inevitable.", "It was shaped by choices, sacrifice, and resistance."]},
        {"id": "l31", "pre": 0.5, "tag": "neutral",
         "text": "A different ending could have changed millions of lives."},
        {"id": "l32", "pre": 0.7, "tag": "neutral", "mode": "title",
         "text": "So, what would your world look like?"},
        {"id": "l33", "pre": 0.8, "tag": "neutral", "mode": "title",
         "text": "What if history had turned the other way?"},
        {"id": "l34", "pre": 1.4, "tag": "alt", "mode": "title",
         "text": "And what if Sarawak had never left Japanese rule?"},
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
