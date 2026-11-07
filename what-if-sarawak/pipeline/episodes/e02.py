"""Episode 02 score and sound-effect cue list (original compositions). See e01.py for the API."""


def score(g):
    globals().update(g)
    # S1 coronation fanfare, cut hard to "airport muzak"
    fanfare(0.0, 1.0)
    mus.silence(cue["cut"], 8.0, fade=0.01)
    groove(cue["cut"] + 0.1, 8.0, ["F", "Dm", "Bb", "C"], drums=False, bassline=True, gain=0.45)
    # S2 history: plucked arpeggios, suspense pad on "went solo?"
    arps(8.0, L["n05"]["start"] - 0.1, ["Dm", "Bb", "F", "C"], gain=0.9)
    mus.add(L["n05"]["start"] - 0.1, S.pad(hz(57), 2.4, a=0.3, r=0.6, bright=0.4), 0.2, -0.3)
    mus.add(L["n05"]["start"] - 0.1, S.pad(hz(64), 2.4, a=0.3, r=0.6, bright=0.4), 0.2, 0.3)
    # S3 fiction: tense pad, game-show groove for the cook-off, gong + fanfare for the win
    mus.add(19.5, S.pad(hz(50), 3.9, a=0.3, r=0.4, bright=0.2), 0.22, 0)
    mus.add(19.5, S.pad(hz(53), 3.9, a=0.3, r=0.4, bright=0.2), 0.18, 0.2)
    groove(L["n07"]["start"] - 0.1, cue["win"], ["Bb", "Gm", "Eb", "F"], lead=True, gain=0.85)
    fanfare(cue["win"] + 0.2, 0.8, short=True)
    fanfare(L["n08"]["start"] - 0.36, 0.7, short=True)
    # S4 throne room groove; silence for the decree punch; groove after the fix; tuba on the new pothole
    groove(31.0, L["q02"]["start"] - 0.1, ["Bb", "Gm", "Eb", "F"], drums=False, gain=0.75)
    groove(cue["roadfix"] + 0.1, cue["pothole"], ["Bb", "F", "Gm", "Eb"], gain=0.8)
    mus.add(cue["pothole"] + 0.35, S.tuba_bwomp(), 0.5, 0)
    groove(L["n10"]["end"] + 0.1, 42.5, ["Bb"], drums=False, bassline=False, gain=0.5)
    # S5 money groove, cut for the Queen's outrage
    groove(42.5, L["q03"]["start"] - 0.1, ["Eb", "F", "Bb", "Gm"], lead=True, gain=0.75)
    for k in range(8):
        mus.add(L["q03"]["end"] + 0.1 + k * B / 2, S.pluck(hz([62, 61, 62, 61, 60, 59, 58, 57][k]), 0.25, bright=0.8, sustain=0.98), 0.22, -0.2)
    # S6 travel: easy groove, softer piano after the call
    groove(53.5, cue["ring"], ["F", "Dm", "Bb", "C"], drums=False, gain=0.7)
    chords(L["g01"]["start"], 65.0, ["Bb", "F", "Gm", "Eb"], dur_beats=3, gain=0.7)
    # S7 reflective piano (no answer given)
    chords(65.0, 77.0, ["Gm", "Eb", "Bb", "F", "Cm", "Eb", "F", "F"], dur_beats=3, gain=1.0)
    # S8 night market groove, drum roll for "one great war", end-card reprise
    groove(77.0, L["n17"]["start"], ["Bb", "Gm", "Eb", "F"], drums=False, gain=0.6)
    for k in range(18):
        mus.add(L["n17"]["start"] + k * 0.13, S.timpani(hz(34), 0.4), 0.12 + 0.03 * k, 0)
    fanfare(cue["endcard"] + 0.1, 0.6, short=True)
    groove(cue["endcard"] + 1.5, 89.2, ["Bb", "Gm", "Eb", "F"], drums=True, gain=0.6)


def sfx(g, mb):
    globals().update(g)
    return [
        (0.1, S.cheer(3.0), 0.45, 0, "crowd_cheer"),
        (0.4, S.firework(1.5), 0.4, -0.6, "firework"),
        (1.1, S.firework(1.5), 0.35, 0.6, "firework"),
        (1.6, S.sparkle(1.2), 0.3, 0, "sparkle"),
        (cue["cut"] - 0.05, S.whoosh(0.5, 2500, 300), 0.4, 0, "whoosh_down"),
        (cue["cut"] + 0.05, S.airport_chime(), 0.35, 0.3, "airport_chime"),
        (cue["cut"] + 0.1, S.traffic_bed(5.0), 0.5, 0, "hall_ambience"),
        (cue["stamp"], S.stamp(), 0.9, 0, "immigration_stamp"),
        (8.0, S.whoosh(0.6, 2500, 300), 0.4, 0, "whoosh_down"),
        (9.0, S.paper_flutter(0.6, 10), 0.3, 0.2, "map_rustle"),
        (L["n04"]["start"] + 3.0, S.ding(1568, 1.2), 0.4, 0, "malaysia_ding"),
        (L["n05"]["start"] + 1.2, S.rewind(1.2), 0.5, 0, "rewind"),
        (L["n06"]["start"] + 0.9, S.stamp(), 0.6, 0, "kingdom_stamp"),
        (L["n07"]["start"] + 0.6, S.sizzle(3.6), 0.55, 0.2, "wok_sizzle"),
        (cue["win"], S.gong(3.0), 0.7, 0, "gong"),
        (cue["win"] + 0.15, S.cheer(3.0), 0.5, 0, "crowd_cheer"),
        (L["n08"]["start"], S.firework(1.5), 0.4, 0.5, "firework"),
        (31.0, S.whoosh(0.7, 400, 3000), 0.35, 0, "whoosh"),
        (L["q02"]["end"] - 0.2, S.thud(), 0.6, 0, "table_bang"),
        (cue["roadfix"], S.sparkle(1.4), 0.6, 0, "sparkle"),
        (cue["roadfix"] + 0.05, S.blip(1800), 0.4, 0, "blip"),
        (cue["pothole"], S.thud(), 1.0, 0, "pothole_thud"),
        (cue["pothole"] + 0.08, S.boing(), 0.45, 0.2, "boing"),
        (cue["kaching"], S.kaching(), 0.7, 0, "kaching"),
        (L["n12"]["start"] + 0.5, S.paper_flutter(0.8, 12), 0.35, 0, "note_flutter"),
        (L["q03"]["start"] - 0.25, S.slide_whistle(0.3, up=True), 0.3, 0, "slide_up"),
        (53.6, S.flyby(1.8), 0.6, 0, "plane_pass"),
        (L["n13"]["start"] + 2.0, S.airport_chime(), 0.35, -0.3, "airport_chime"),
        (cue["ring"], S.ring_tone(3), 0.6, 0.2, "video_call_ring"),
        (L["n14"]["start"] + 0.2, S.blip(1600), 0.35, 0.3, "chat_blip"),
        (L["n14"]["start"] + 0.7, S.blip(2000), 0.35, -0.3, "chat_blip"),
        (L["n14"]["start"] + 1.2, S.blip(1800), 0.35, 0.2, "chat_blip"),
        (65.2, S.whoosh(0.6, 2000, 400), 0.3, 0, "whoosh_down"),
        (L["n16"]["start"] + 0.3, S.kaching(), 0.45, -0.3, "kaching"),
        (L["n16"]["start"] + 2.2, S.paper_flutter(1.6, 16), 0.45, 0.3, "bills"),
        (77.0, S.sizzle(3.2), 0.5, 0.3, "wok_sizzle"),
        (L["n17"]["end"] - 0.2, S.thunder(2.5), 0.5, 0, "vs_thunder"),
        (cue["endcard"], S.ding(1318, 1.0), 0.35, 0, "endcard_ding"),
        (cue["endcard"] + 0.15, S.sparkle(1.0), 0.3, 0, "sparkle"),
    ]
