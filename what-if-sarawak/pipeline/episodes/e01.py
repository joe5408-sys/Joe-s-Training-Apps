"""Episode 01 score and sound-effect cue list (original compositions).

Called by pipeline/build_audio.py; `g` carries the shared tools (S, hz, SR, np, mus, B,
L = placed lines by id, cue = cue times in seconds, TOTAL, fanfare, groove, arps, chords).
"""


def score(g):
    globals().update(g)
    # S1 hook: fanfare, cut by scratch
    fanfare(0.0, 1.0)
    mus.silence(cue["scratch"], 6.0, fade=0.01)
    # S2 history: harpsichord-ish plucks
    arps(6.0, L["n05"]["start"] - 0.1, ["Dm", "Bb", "F", "C"], gain=0.9)
    mus.add(L["n05"]["start"] - 0.1, S.pad(hz(57), 2.4, a=0.3, r=0.6, bright=0.4), 0.2, -0.3)
    mus.add(L["n05"]["start"] - 0.1, S.pad(hz(64), 2.4, a=0.3, r=0.6, bright=0.4), 0.2, 0.3)
    # S3 alternate timeline: tense pad, then build, then big welcome hit
    mus.add(17.8, S.pad(hz(50), 5.0, a=0.4, r=0.5, bright=0.2), 0.22, 0)
    mus.add(17.8, S.pad(hz(53), 5.0, a=0.4, r=0.5, bright=0.2), 0.18, 0.2)
    for k in range(4):
        mus.add(17.8 + k * 2 * B * 2, S.timpani(hz(38), 1.2), 0.45, 0)
    build_t0 = L["n08"]["start"] - 0.3
    welcome = L["n09"]["start"]
    nb = int((welcome - build_t0) / (B / 2))
    for k in range(nb):  # accelerating snare build
        tk = build_t0 + k * (B / 2) * (1 - 0.35 * k / max(nb, 1))
        if tk < welcome - 0.05:
            mus.add(tk, S.snare(), 0.12 + 0.25 * k / nb, 0)
            mus.add(tk, S.kick(), 0.25, 0)
    fanfare(welcome - 0.36, 0.9, short=True)
    # S4 royal groove, stop at the pothole, return under narrator punchline
    groove(27.4, cue["pothole"], ["Bb", "Gm", "Eb", "F"])
    groove(L["n11"]["start"] - 0.2, 40.0, ["Bb", "Gm", "Eb", "F"], drums=False, gain=0.8)
    # S5 office: light groove, cut at ring, nervous plucks after auntie
    groove(40.0, cue["ring"], ["Eb", "F", "Bb", "Gm"], drums=False, gain=0.8)
    mus.add(cue["ring"] + 0.5, S.timpani(hz(34), 1.2), 0.6, 0)
    mus.add(cue["ring"] + 0.75, S.timpani(hz(33), 1.4), 0.6, 0)
    for k in range(10):
        mus.add(L["r02"]["start"] + k * B / 2, S.pluck(hz([62, 61, 62, 61, 60, 59, 60, 59, 58, 57][k]) , 0.25, bright=0.8, sustain=0.98), 0.25, -0.2)
    # S6 tech powerhouse: synth arp groove, record-stop at the stamp
    groove(52.0, cue["stamp"], ["Bb", "F", "Gm", "Eb"], lead=True, gain=0.9)
    fanfare(L["m02"]["end"] - 1.2, 0.6, short=True)
    a = int(cue["stamp"] * SR)
    mus.buf[:, a - int(0.6 * SR):a] = S.tape_stop(mus.buf[:, a - int(0.6 * SR):a], 0.6)
    mus.silence(cue["stamp"], 63.0, fade=0.01)
    mus.add(cue["stamp"] + 0.35, S.sad_trombone(), 0.55, 0)
    groove(63.4, 65.0, ["Bb"], drums=False, bassline=False, gain=0.6)
    # S7 reality check: reflective piano
    chords(65.0, 77.0, ["Gm", "Eb", "Bb", "F", "Cm", "Eb", "F", "F"], dur_beats=3, gain=1.0)
    # S8 sunset then thunder cuts it, end card reprise
    arps(77.0, cue["thunder"], ["Bbmaj7", "Eb"], inst="piano", step=B, gain=0.8, octave=0)
    mus.silence(cue["thunder"], cue["endcard"], fade=0.02)
    fanfare(cue["endcard"] + 0.1, 0.55, short=True)
    groove(cue["endcard"] + 1.5, 89.2, ["Bb", "Gm", "Eb", "F"], drums=True, gain=0.6)


def sfx(g, mb):
    globals().update(g)
    welcome = L["n09"]["start"]
    fanfare_mono = mb[0, : int(cue["scratch"] * SR)]
    scratch = S.record_scratch(fanfare_mono)
    FX_EVENTS = [
        (0.15, S.flyby(1.6), 0.5, -0.6, "flyby"),
        (2.2, S.flyby(1.4), 0.35, 0.6, "flyby"),
        (cue["scratch"], scratch, 0.9, 0, "record_scratch"),
        (cue["scratch"] + 0.25, S.traffic_bed(2.6), 0.8, 0, "traffic_bed"),
        (3.75, S.honk(420), 0.5, -0.5, "honk"),
        (4.05, S.honk(380), 0.4, 0.5, "honk"),
        (4.3, S.honk(460), 0.35, -0.2, "honk"),
        (5.0, S.honk(400, 0.6), 0.45, 0.4, "honk_long"),
        (5.35, S.tuba_bwomp(), 0.5, 0, "tuba_bwomp"),
        (6.05, S.whoosh(0.6, 2500, 300), 0.4, 0, "whoosh_down"),
        (9.5, S.paper_flutter(0.6, 10), 0.3, 0.2, "map_rustle"),
        (L["n05"]["start"] + 1.4, S.rewind(1.2), 0.5, 0, "rewind"),
        (17.95, S.gavel(), 0.6, 0.1, "gavel"),
        (L["n07"]["start"] - 0.45, S.rewind(0.9), 0.55, 0, "rewind_glitch"),
        (L["n07"]["end"] - 0.35, S.stamp(), 0.7, 0, "rejected_stamp"),
        (L["n08"]["start"] - 0.3, S.riser(welcome - L["n08"]["start"] + 0.3), 0.5, 0, "riser"),
        (welcome - 0.1, S.firework(1.5), 0.45, -0.6, "firework"),
        (welcome + 0.5, S.firework(1.5), 0.4, 0.6, "firework"),
        (welcome + 1.0, S.sparkle(1.4), 0.4, 0, "sparkle"),
        (27.4, S.whoosh(0.8, 500, 3000), 0.4, 0.5, "whoosh"),
        (28.2, S.flyby(1.4), 0.4, -0.5, "flyby"),
        (29.6, S.flyby(1.2), 0.35, 0.5, "flyby"),
        (cue["pothole"], S.thud(), 1.0, 0, "pothole_thud"),
        (cue["pothole"] + 0.08, S.boing(), 0.45, 0.2, "crown_boing"),
        (L["r01"]["start"] - 0.25, S.slide_whistle(0.35, up=False), 0.3, 0, "slide_down"),
        (40.1, S.blip(1600), 0.4, 0.3, "holo_blip"),
        (40.3, S.blip(2000), 0.35, -0.3, "holo_blip"),
        (L["m01"]["end"] - 0.9, S.ding(1568, 1.2), 0.4, 0, "chart_ding"),
        (cue["ring"], S.ring_tone(3), 0.7, 0.2, "video_call_ring"),
        (L["r02"]["start"] - 0.2, S.slide_whistle(0.3, up=True), 0.2, 0, "gulp"),
        (52.1, S.whoosh(0.7, 400, 4000), 0.45, 0, "whoosh"),
        (54.0, S.sparkle(1.0), 0.3, 0.3, "sparkle"),
        (L["m02"]["start"] + 0.2, S.flyby(1.8), 0.6, 0, "hyperloop_pass"),
        (cue["stamp"], S.stamp(), 1.0, 0, "delayed_stamp"),
        (65.2, S.whoosh(0.6, 2000, 400), 0.3, 0, "whoosh_down"),
        (L["n15"]["start"] - 0.3, S.paper_flutter(4.2, 18), 0.55, 0, "paper_pile"),
        (L["n15"]["end"] - 0.6, S.thud(), 0.45, 0, "paper_thump"),
        (cue["thunder"], S.thunder(4.0), 0.9, 0, "thunder"),
        (cue["thunder"] + 0.1, (lambda r: r * np.minimum(np.arange(len(r)) / (0.6 * SR), 1))(S.rain(TOTAL - cue["thunder"])), 0.55, 0, "rain"),
        (L["r04"]["end"] + 0.1, S.whoosh(0.5, 1500, 400), 0.4, 0.6, "run_off"),
        (cue["endcard"], S.ding(1318, 1.0), 0.35, 0, "endcard_ding"),
        (cue["endcard"] + 0.15, S.sparkle(1.0), 0.3, 0, "sparkle"),
    ]
    return FX_EVENTS
