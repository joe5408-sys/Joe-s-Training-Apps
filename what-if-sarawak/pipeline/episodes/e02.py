"""Episode 02 (What if kolo mee was banned?) score and SFX cues. Original compositions. API: see e01.py."""


def score(g):
    globals().update(g)
    ban = cue["ban"]
    # S1 sunny morning groove, killed by the ban
    groove(0.0, ban - 0.1, ["F", "Dm", "Bb", "C"], drums=False, gain=0.6)
    a = int((ban - 0.1) * SR)
    mus.buf[:, a - int(0.5 * SR):a] = S.tape_stop(mus.buf[:, a - int(0.5 * SR):a], 0.5)
    mus.silence(ban - 0.1, 7.2, fade=0.01)
    mus.add(ban + 0.05, S.timpani(hz(33), 1.6), 0.6, 0)
    # S2 facts: light plucked arpeggios
    arps(7.2, 20.0, ["F", "C", "Dm", "Bb"], gain=0.75)
    # S3 sad day one: slow minor piano, tuba on 'not the same'
    chords(20.0, 31.0, ["Dm", "Bb", "Gm", "Asus"], dur_beats=4, gain=0.8)
    mus.add(L["n08"]["end"] + 0.15, S.sad_trombone(), 0.45, 0)
    # S4 spy/underground: walking pizzicato bass + snaps
    def spy(t0, t1, gain=1.0):
        line = [50, 53, 55, 56, 57, 56, 55, 53]
        t, k = t0, 0
        while t < t1 - 0.05:
            mus.add(t, S.pluck(hz(line[k % 8] - 12), 0.3, bright=0.5, sustain=0.985), 0.45 * gain, -0.1)
            if k % 2 == 1:
                mus.add(t, S.hat(0.05), 0.35 * gain, 0.4)
            if k % 8 == 0:
                mus.add(t, S.pad(hz(50), 4 * B, a=0.2, r=0.4, bright=0.3), 0.1 * gain, 0)
            t += B / 2
            k += 1
    spy(31.2, 43.0)
    # S5 raid: tense pad + timpani, silence before 'bungkus', then a sheepish resolve
    mus.add(43.0, S.pad(hz(50), L["o03"]["start"] - 43.2, a=0.6, r=0.3, bright=0.2), 0.2, -0.2)
    mus.add(43.0, S.pad(hz(56), L["o03"]["start"] - 43.2, a=0.6, r=0.3, bright=0.2), 0.16, 0.2)
    for k in range(4):
        mus.add(43.2 + k * 1.6, S.timpani(hz(38), 1.0), 0.35, 0)
    groove(L["o03"]["end"] + 0.2, 56.0, ["Bb", "F"], drums=False, bassline=False, gain=0.5)
    # S6 royal cameo: a tiny E01 fanfare callback, then the spy line again
    fanfare(56.0, 0.35, short=True)
    spy(57.6, 66.0, gain=0.8)
    # S7 reflective piano
    chords(66.0, 76.0, ["Gm", "Eb", "Bb", "F"], dur_beats=4, gain=0.9)
    # S8 party groove; stop for the twist; end-card reprise
    groove(76.2, L["n15"]["start"] + 1.2, ["Bb", "Gm", "Eb", "F"], lead=True, gain=0.8)
    mus.silence(L["n15"]["start"] + 1.2, cue["endcard"], fade=0.02)
    fanfare(cue["endcard"] + 0.1, 0.6, short=True)
    groove(cue["endcard"] + 1.5, 89.2, ["Bb", "Gm", "Eb", "F"], drums=True, gain=0.6)


def sfx(g, mb):
    globals().update(g)
    ban = cue["ban"]
    return [
        (0.0, S.birds(3.0, 9), 0.5, 0.3, "birds"),
        (0.0, S.cheer(3.2, voices=30) * 0.25, 0.4, 0, "kopitiam_chatter"),
        (0.6, S.sizzle(2.4), 0.35, -0.4, "wok_sizzle"),
        (L["o01"]["start"] - 0.6, S.siren(1.2), 0.5, 0.4, "siren"),
        (ban, S.stamp(), 0.9, 0, "ban_stamp"),
        (ban + 0.08, S.gasp(0.9), 0.6, 0, "crowd_gasp"),
        (7.1, S.whoosh(0.6, 2500, 400), 0.35, 0, "whoosh_down"),
        (L["n03"]["start"] + 0.2, S.ding(1568, 1.0), 0.3, 0, "fact_ding"),
        (L["n04"]["start"] + 0.2, S.ding(1760, 1.0), 0.3, 0, "fact_ding"),
        (L["n04"]["end"] - 1.2, S.sparkle(1.2), 0.4, 0, "sparkle"),
        (L["n05"]["start"] - 0.3, S.rewind(0.9), 0.45, 0, "rewind_glitch"),
        (L["n06"]["start"] + 1.4, S.paper_flutter(0.9, 10), 0.4, 0, "tarp_flap"),
        (L["n09"]["start"] - 0.2, S.whoosh(0.6, 2000, 300), 0.35, 0, "whoosh_down"),
        (cue["knock"], S.knock(), 0.8, 0.2, "secret_knock"),
        (L["a01"]["start"] - 0.35, S.slide_whistle(0.25, up=True), 0.2, 0, "peephole_slide"),
        (L["n10"]["start"] + 0.5, S.sizzle(2.5), 0.4, 0.3, "wok_sizzle"),
        (43.0, S.whoosh(0.5, 400, 2500), 0.35, 0, "torch_on"),
        (cue["sniff"], S.sniff(2), 0.8, 0.1, "sniff"),
        (L["a02"]["start"] - 0.2, S.slide_whistle(0.3, up=True), 0.25, 0, "gulp"),
        (L["o03"]["end"] - 0.3, S.paper_flutter(0.5, 14), 0.5, 0, "bungkus_bag"),
        (L["r01"]["start"] - 0.3, S.knock((0, 0.2, 0.4)), 0.5, -0.2, "secret_knock"),
        (L["n12"]["start"] - 0.2, S.whoosh(0.6, 2000, 400), 0.3, 0, "whoosh_down"),
        (L["n13"]["end"] - 0.6, S.thud(), 0.6, 0, "sign_falls"),
        (cue["lifted"], S.cheer(3.5), 0.55, 0, "crowd_cheer"),
        (cue["lifted"] + 0.1, S.firework(1.5), 0.4, -0.5, "party_popper"),
        (cue["lifted"] + 0.6, S.firework(1.5), 0.35, 0.5, "party_popper"),
        (L["n15"]["start"] + 1.2, S.record_scratch(mb[0, : int((L["n15"]["start"] + 1.2) * SR)]), 0.7, 0, "record_scratch"),
        (cue["endcard"], S.ding(1318, 1.0), 0.35, 0, "endcard_ding"),
        (cue["endcard"] + 0.15, S.sparkle(1.0), 0.3, 0, "sparkle"),
    ]
