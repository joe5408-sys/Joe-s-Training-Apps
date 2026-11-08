"""Episode 03 soundtrack: original procedural score + SFX, synced to scene frames (30 fps).
Outputs: public/e03_soundtrack.wav (48 kHz stereo), public/poc_soundtrack.wav, audio/cues.json
No voices, no speech, no samples: every sound is synthesised from oscillators/noise."""
import json, os, sys, wave
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "src", "audio"))
import synth as S  # noqa: E402

FPS = 30
SCENE = {"S01": 0, "S02": 240, "S03": 570, "S04": 930, "S05": 1290, "S06": 1680, "S07": 2040, "S08": 2280}
TOTAL = 2460 / FPS


def T(scene, local):
    """Global seconds from scene-local frame."""
    return (SCENE[scene] + local) / FPS


music = S.Mix(TOTAL)
sfx = S.Mix(TOTAL)
CUES = []


def cue(name, at, fn, gain=1.0, pan=0.0, bus=None):
    (bus or sfx).add(fn() if callable(fn) else fn, at, gain, pan)
    CUES.append({"t": round(at, 3), "frame": round(at * FPS), "sfx": name})


def beat_grid(t0, bpm, n):
    return [t0 + i * 60 / bpm for i in range(n)]


# ======================= S01 THE LAST SECOND (0-8 s): suspense + ticking
for k in range(3):
    cue("tick", T("S01", k * 30), S.tick(True), 0.9)
    cue("tock", T("S01", k * 30 + 15), S.tick(False), 0.7)
for k, dt in enumerate([0.25, 0.4, 0.5, 0.58, 0.64, 0.69, 0.73, 0.76, 0.79, 0.82, 0.85, 0.87, 0.89, 0.91, 0.93, 0.95, 0.97]):
    sfx.add(S.tick(k % 2 == 0), 2.0 + dt, 0.6 + 0.02 * k)  # accelerating ticks into midnight
music.add(S.drone(38, 3.0), 0.0, 0.8)
music.add(S.tremolo_strings(62, 1.0) * 0.4, 2.0, 0.6)
cue("midnight_hit", T("S01", 90), S.stinger([50, 57, 62], 0.5), 0.6)
cue("midnight_glitch", T("S01", 90), S.glitch(0.5), 0.6)
cue("crack_glitch", T("S01", 100), S.glitch(0.6), 0.7, 0.3)
cue("explosion_impact", T("S01", 120), S.impact(2.2), 1.2)
cue("brass_stinger_title", T("S01", 130), S.stinger([38, 45, 50, 57, 62], 1.6, 1.8), 0.9, bus=music)
music.add(S.timpani(38, 1.5), T("S01", 130), 1.0)
cue("whoosh_subtitle", T("S01", 160), S.whoosh(0.5), 0.6, -0.3)
cue("time_resumes_shimmer", T("S01", 175), S.sparkle(1.4), 0.6)
music.add(S.pad([50, 57, 62, 65], 2.7), T("S01", 160), 0.5)
cue("boing_confused_clock", T("S01", 185), S.boing(0.6, 220), 0.6, 0.6)

# ======================= S02 NO MORE ALARMS (8-19 s): triumphant orchestra
cue("alarm_bell", T("S02", 0), S.alarm_bell(1.33), 0.8, 0.5)
cue("pop_alarm_vanish", T("S02", 40), S.pop(700), 0.9, 0.5)
cue("whoosh_calendar", T("S02", 48), S.whoosh(0.8, False), 0.6, 0.6)
cue("pop_notification", T("S02", 84), S.pop(900), 0.8)
cue("boing_jump", T("S02", 100), S.boing(0.7, 160), 0.9)
BPM = 128
b = 60 / BPM
t0 = T("S02", 44)
# fanfare build: I - IV - V - I - vi - IV - V - I (C major), 2 beats each, brass melody on top
prog_ = [[48, 52, 55], [53, 57, 60], [55, 59, 62], [48, 52, 55], [57, 60, 64], [53, 57, 60], [55, 59, 62], [48, 52, 55]] * 2
for i, ch in enumerate(prog_):
    at = t0 + i * 2 * b
    if at > T("S02", 280):
        break
    for m in ch:
        music.add(S.strings(m + 12, 2 * b), at, 0.18, -0.3)
    music.add(S.bass(ch[0] - 12, b * 0.9), at, 0.5)
    music.add(S.bass(ch[0] - 12, b * 0.9), at + b, 0.4)
    music.add(S.timpani(ch[0] - 12 + 2, 0.8), at, 0.4)
melody = [(0, 67, 0.5), (0.5, 72, 0.5), (1, 76, 1), (2, 77, 1), (3, 76, 0.5), (3.5, 74, 0.5), (4, 74, 1.5), (5.5, 71, 0.5),
          (6, 72, 2), (8, 79, 1), (9, 76, 1), (10, 77, 1), (11, 74, 1), (12, 76, 0.5), (12.5, 77, 0.5), (13, 79, 1), (14, 84, 2)]
for rep in range(2):
    for beat, m, d in melody:
        at = t0 + (beat + rep * 16) * b
        if at < T("S02", 280):
            music.add(S.brass(m - 12, d * b * 0.95), at, 0.35, 0.2)
            music.add(S.brass(m - 24, d * b * 0.95), at, 0.18, -0.2)
for i, at in enumerate(beat_grid(t0, BPM, 40)):
    if at < T("S02", 280):
        music.add(S.hat(), at + b / 2, 0.35, 0.4)
        if i % 2 == 1:
            music.add(S.snare(), at, 0.35)
for k, lf in enumerate([160, 172, 184]):
    cue("ding_counter_zero", T("S02", lf), S.ding(88 + k * 4), 0.6, -0.3 + 0.3 * k)
for k in range(30):
    sfx.add(S.tick(True), T("S02", 124) + k * 0.06, 0.25)
cue("crash_FREEDOM", T("S02", 196), S.crash(3.0), 0.9)
cue("brass_tutti_FREEDOM", T("S02", 196), S.stinger([48, 55, 60, 64, 67, 72], 1.4, 2.0), 0.8, bus=music)
cue("party_popper", T("S02", 194), S.party_popper(), 0.9, -0.2)
cue("party_popper", T("S02", 216), S.party_popper(), 0.8, -0.6)
cue("party_popper", T("S02", 226), S.party_popper(), 0.8, 0.6)
cue("slide_whistle_throw", T("S02", 196), S.slide_whistle(500, 1600, 0.85), 0.6, 0.5)
cue("distant_crash_BYE", T("S02", 222), S.snare(0.4) * 0.5 + S.crash(0.4)[: len(S.snare(0.4))], 0.6, 0.8)
cue("record_scratch_WAIT", T("S02", 280), S.record_scratch(0.5), 1.0)
music.mute(T("S02", 280), T("S03", 0))

# ======================= S03 AIRPORT (19-31 s): quirky chaos
BPM = 140
b = 60 / BPM
t0 = T("S03", 0)
bass_line = [50, 57, 53, 57, 50, 57, 56, 55]
mel = [74, None, 73, 74, 77, None, 76, 74, 73, None, 70, 69, 70, 73, 74, None]
for i, at in enumerate(beat_grid(t0, BPM * 2, 2 * 28)):
    if at >= T("S03", 360):
        break
    if i % 2 == 0:
        music.add(S.bassoon(bass_line[(i // 2) % 8] - 12, 0.2), at, 0.55, -0.2)
    m = mel[i % 16]
    if m and i >= 16:
        music.add(S.pizz(m, 0.3), at, 0.4, 0.3)
    if i % 4 == 2:
        music.add(S.woodblock(84 if i % 8 == 2 else 79), at, 0.35, 0.5)
    music.add(S.hat(), at, 0.15)
for lf in (30, 50, 70):
    cue("digital_glitch_board", T("S03", lf), S.glitch(0.4), 0.7, -0.2)
    cue("error_beep", T("S03", lf + 4), S.error_beep(), 0.5, 0.2)
cue("boing_point", T("S03", 90), S.boing(0.5, 300), 0.7, -0.5)
cue("whoosh_watch_zoom", T("S03", 146), S.whoosh(0.4), 0.7)
cue("slide_whistle_dizzy", T("S03", 180), S.slide_whistle(1200, 400, 0.6), 0.5, 0.5)
cue("engine_forward", T("S03", 208), S.engine(1.4, True), 0.8, -0.3)
cue("engine_sputter_backward", T("S03", 270), S.engine(1.8, False, True), 0.8, 0.3)
cue("brass_stinger_WHENEVER", T("S03", 250), S.stinger([50, 53, 56], 0.6), 0.7, bus=music)
cue("sad_trombone_short", T("S03", 300), S.sad_trombone()[: int(1.6 * S.SR)] * np.linspace(1, 0, int(1.6 * S.SR)), 0.7, bus=music)

# ======================= S04 PLANK (31-43 s): gym beat -> abrupt stop -> tension -> chef
BPM = 126
b = 60 / BPM
t0 = T("S04", 0)
for i, at in enumerate(beat_grid(t0, BPM, 12)):
    if at >= T("S04", 100):
        break
    music.add(S.kick(), at, 0.8)
    music.add(S.hat(), at + b / 2, 0.3, 0.3)
    if i % 2 == 1:
        music.add(S.clap(), at, 0.5)
    music.add(S.bass([45, 45, 48, 43][(i // 2) % 4] - 12, b * 0.45), at + b / 2, 0.6)
for k, lf in enumerate((20, 40, 60, 80)):
    cue(f"timer_beep_{k}", T("S04", lf), S.countdown_beep(1320), 0.5)
music.mute(T("S04", 100), T("S04", 101), 0.005)
cue("record_stop+buzzer_ERROR", T("S04", 100), S.record_scratch(0.35), 0.9)
cue("buzzer_ERROR", T("S04", 102), S.buzzer(0.7), 0.6)
cue("shimmer_infinity", T("S04", 130), S.sparkle(1.0), 0.5)
for k, m in enumerate([50, 51, 52, 53, 54, 55, 56]):
    music.add(S.tremolo_strings(m + 12, 0.75) * (0.3 + 0.08 * k), T("S04", 130) + k * 0.7, 0.6)
for k in range(9):
    music.add(S.heartbeat(), T("S04", 120) + k * (0.7 - k * 0.03), 0.7)
cue("rubber_stretch", T("S04", 150), S.rubber_stretch(2.8), 0.7, 0.2)
cue("stinger_WHATS_A_SECOND", T("S04", 196), S.stinger([49, 52, 55, 58], 0.7), 0.7, bus=music)
cue("body_drop_thud", T("S04", 244), S.thud(), 1.2)
cue("whoosh_cut_chef", T("S04", 252), S.whoosh(0.3), 0.6)
cue("boiling_bubbles", T("S04", 255), S.bubbles(3.5), 0.6, -0.2)
for i, at in enumerate(beat_grid(T("S04", 258), 150 * 2, 18)):
    music.add(S.pizz([62, 66, 69, 66, 62, 69, 74, 69][i % 8], 0.25), at, 0.3, 0.3)
cue("slide_whistle_hands_up", T("S04", 290), S.slide_whistle(400, 1400, 0.4), 0.6)
cue("brass_wah_chef", T("S04", 294), S.stinger([50, 53, 56], 0.5), 0.6, bus=music)

# ======================= S05 MONTAGE (43-56 s): increasingly frantic percussion
t = T("S05", 0)
bpm = 160
i = 0
while t < T("S05", 389):
    bt = 60 / bpm
    music.add(S.kick(), t, 0.7)
    music.add(S.tom(45 + (i % 4) * 3), t + bt / 2, 0.45, -0.4 + (i % 3) * 0.4)
    music.add(S.hat(), t + bt / 4, 0.2, 0.4)
    music.add(S.hat(), t + 3 * bt / 4, 0.2, 0.4)
    if i % 2:
        music.add(S.snare(), t, 0.45)
    music.add(S.bassoon([50, 51, 50, 56][i % 4] - 12, bt * 0.4), t, 0.4)
    music.add(S.pizz([74, 75, 74, 80, 79, 78, 77, 76][i % 8], 0.2), t + bt / 2, 0.25, 0.3)
    t += bt
    bpm = min(184, bpm + 0.8)
    i += 1
cue("washer_hum", T("S05", 0), S.wash_hum(4.0), 0.7, -0.3)
for lf, name in ((120, "record_scratch_cut"), (250, "record_scratch_cut")):
    cue(name, T("S05", lf), S.record_scratch(0.35), 0.8)
for lf in (18, 138, 280):
    cue("impact_caption_slam", T("S05", lf), S.stinger([50, 56, 62], 0.35), 0.6, bus=music)
    cue("impact_hit", T("S05", lf), S.thud(), 0.5)
cue("shimmer_infinity_exam", T("S05", 130), S.sparkle(0.8), 0.4)
for k in range(13):
    sfx.add(S.paper_thump(), T("S05", 160) + k * 0.15, 0.6, 0.4)
for k, lf in enumerate((290, 315, 340)):
    cue("car_honk", T("S05", lf), S.honk(0.35), 0.6, [-0.6, 0.0, 0.6][k])
for k in range(5):
    sfx.add(S.tick(False), T("S05", 250) + k * 1.0, 0.4, -0.6)

# ======================= S06 DISCOVERY (56-68 s): epic fanfare
music.add(S.pad([50, 57, 62, 66], 5.6), T("S06", 0), 0.35)
SW = 24
for k in range(1, 7):
    cue("pendulum_tick", T("S06", 10 + SW * k), S.tick(k % 2 == 1), 0.7, -0.4 if k % 2 else 0.4)
for k, m in enumerate([72, 74, 76, 77, 79]):
    cue(f"count_glock_{k + 1}", T("S06", 10 + SW * (k + 1)), S.glock(m, 1.0), 0.6)
cue("whoosh_assemble", T("S06", 132), S.whoosh(0.5), 0.6)
cue("machine_startup", T("S06", 150), S.machine_startup(0.8), 0.7)
cue("ding_lightbulb", T("S06", 160), S.ding(96), 0.8)
cue("crash_GENIUS", T("S06", 166), S.crash(3.0), 0.9)
cue("sparkle_magic", T("S06", 166), S.sparkle(1.8), 0.7)
BPM = 120
b = 60 / BPM
t0 = T("S06", 166)
fan = [(0, 74, 1.5), (1.5, 74, 0.5), (2, 81, 2), (4, 79, 0.5), (4.5, 78, 0.5), (5, 76, 0.5), (5.5, 78, 0.5), (6, 74, 2),
       (8, 81, 1), (9, 83, 1), (10, 86, 2), (12, 85, 1), (13, 83, 1), (14, 86, 2), (16, 86, 2)]
chords = [[50, 54, 57], [50, 54, 57], [55, 59, 62], [57, 61, 64], [47, 50, 54], [55, 59, 62], [57, 61, 64], [50, 54, 57], [50, 54, 57]]
end_music = T("S07", 84)
for k, ch in enumerate(chords * 2):
    at = t0 + k * 2 * b
    if at >= end_music:
        break
    for m in ch:
        music.add(S.strings(m + 12, 2 * b), at, 0.2, -0.3)
        music.add(S.brass(m, 2 * b * 0.9, 1.2), at, 0.12, 0.3)
    music.add(S.timpani(ch[0] - 12, 1.0), at, 0.6)
    music.add(S.bass(ch[0] - 12, b * 0.9), at, 0.5)
    music.add(S.bass(ch[0] - 12, b * 0.9), at + b, 0.4)
for beat, m, d in fan + [(bb + 18, mm, dd) for bb, mm, dd in fan]:
    at = t0 + beat * b
    if at < end_music:
        music.add(S.brass(m - 12, d * b * 0.95, 1.5), at, 0.4, 0.15)
dance0 = T("S06", 236)
for i, at in enumerate(beat_grid(dance0, BPM, 20)):
    if at >= end_music:
        break
    music.add(S.kick(), at, 0.7)
    music.add(S.hat(), at + b / 2, 0.3, 0.3)
    if i % 2:
        music.add(S.clap(), at, 0.45)
cue("confetti_pop_AGAIN", T("S06", 236), S.party_popper(), 0.8)

# ======================= S07 WORST INVENTION (68-76 s)
for k in range(12):
    sfx.add(S.pop(500 + k * 60), T("S07", k * 3), 0.45, -0.6 + k * 0.1)
cue("whoosh_calendars_return", T("S07", 20), S.whoosh(0.9, False), 0.5)
cue("whoosh_cut_office", T("S07", 62), S.whoosh(0.3), 0.5)
music.mute(T("S07", 84), TOTAL)  # music stops dead when MONDAY appears
cue("ALARM_monday", T("S07", 84), S.alarm(2.2), 0.9)
cue("impact_notification", T("S07", 84), S.impact(1.0), 0.8)
cue("slide_whistle_tie_drop", T("S07", 108), S.slide_whistle(1300, 300, 0.5), 0.6, -0.3)
cue("tiny_thud_tie", T("S07", 124), S.thud() * 0.4, 0.6)
cue("sad_trombone", T("S07", 122), S.sad_trombone(), 0.9)
cue("doom_stinger_MONDAY_BACK", T("S07", 168), S.stinger([36, 43, 46], 1.2, 0.8), 0.8)
cue("alarm_soft", T("S07", 200), S.alarm(1.2), 0.4)

# ======================= S08 FINAL LOOP (76-82 s)
for k in range(8):
    sfx.add(S.heartbeat(), T("S08", 0) + k * 0.5, 0.8)
for k, lf in enumerate((0, 40, 80)):
    cue(f"countdown_hit_{3 - k}", T("S08", lf), S.countdown_beep(660 + 220 * k) + 0 * 1, 0.8)
    cue(f"countdown_boom_{3 - k}", T("S08", lf), S.timpani(38 - k * 2, 0.9), 0.8)
sfx.add(S.drone(38, 3.0), T("S08", 90), 0.6)
cue("boing_choice_yes", T("S08", 14), S.boing(0.4, 300), 0.5, -0.4)
cue("boing_choice_no", T("S08", 20), S.boing(0.4, 200), 0.5, 0.4)
cue("glitch_morph", T("S08", 120), S.glitch(0.5), 0.6)
cue("whoosh_morph", T("S08", 118), S.whoosh(0.6), 0.5)
# pre-roll of the opening: tick at 81.0, tock at 81.5 -> loops into tick at 0.0
cue("tick_preroll", T("S08", 150), S.tick(True), 0.9)
cue("tock_preroll", T("S08", 165), S.tick(False), 0.7)


def write_wav(path, st):
    pcm = (np.clip(st, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(S.SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    out = os.path.join(ROOT, "public")
    os.makedirs(out, exist_ok=True)
    music_st = np.stack([music.L, music.R], 1)
    sfx_st = np.stack([sfx.L, sfx.R], 1)
    full = S.Mix(TOTAL)
    full.L = music_st[:, 0] * 0.8 + sfx_st[:, 0]
    full.R = music_st[:, 1] * 0.8 + sfx_st[:, 1]
    st = full.render(-1.0)
    # micro fades at the very edges so the loop point does not click
    n = int(0.004 * S.SR)
    st[:n] *= np.linspace(0, 1, n)[:, None]
    st[-n:] *= np.linspace(1, 0, n)[:, None]
    write_wav(os.path.join(out, "e03_soundtrack.wav"), st)
    # proof-of-concept 4 s: ticking + countdown beeps + fanfare cue + boing at 3.0 s
    poc = S.Mix(4.0)
    for k in range(3):
        poc.add(S.tick(True), k, 0.8)
        poc.add(S.countdown_beep(880), k, 0.4)
    poc.add(S.stinger([48, 55, 60, 64, 67], 1.0, 2.0), 3.0, 0.8)
    poc.add(S.crash(1.0), 3.0, 0.6)
    poc.add(S.boing(0.6), 3.0, 0.7)
    poc.add(S.party_popper(), 3.0, 0.7)
    write_wav(os.path.join(out, "poc_soundtrack.wav"), poc.render(-1.0))
    with open(os.path.join(os.path.dirname(__file__), "cues.json"), "w") as fh:
        json.dump(sorted(CUES, key=lambda c: c["t"]), fh, indent=1)
    print("wrote", len(CUES), "cues; duration", st.shape[0] / S.SR, "s")
