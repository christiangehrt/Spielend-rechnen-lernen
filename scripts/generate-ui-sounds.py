#!/usr/bin/env python3
"""Synthesises the UI sound sprite (public/assets/sounds/ui-sprite.mp3).

All UI sounds are generated procedurally (no third-party samples) so they are
free to use. The script also writes the sprite offsets into sounds.json while
keeping any other entries (e.g. a later recorded speech sprite) untouched.

Usage: python3 scripts/generate-ui-sounds.py   (needs numpy + ffmpeg)
"""
import json
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

SR = 44100
GAP = 0.15  # seconds of silence between sprite segments
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "assets" / "sounds"
rng = np.random.default_rng(7)


def t(duration):
    return np.arange(int(SR * duration)) / SR


def env(duration, attack=0.005, decay=None, curve=4.0):
    x = t(duration)
    a = np.clip(x / max(attack, 1e-4), 0, 1)
    d = np.exp(-curve * x / (decay or duration))
    return a * d


def tone(freq, duration, shape="sine", decay=None, curve=4.0, attack=0.005):
    x = t(duration)
    if callable(freq):
        phase = 2 * np.pi * np.cumsum(freq(x)) / SR
    else:
        phase = 2 * np.pi * freq * x
    if shape == "sine":
        w = np.sin(phase)
    elif shape == "triangle":
        w = 2 / np.pi * np.arcsin(np.sin(phase))
    else:
        w = np.sign(np.sin(phase)) * 0.5
    return w * env(duration, attack, decay, curve)


def noise(duration):
    return rng.uniform(-1, 1, int(SR * duration))


def lowpass(sig, cutoff):
    # simple one-pole low-pass, good enough for soft UI sounds
    alpha = 1 - np.exp(-2 * np.pi * cutoff / SR)
    out = np.zeros_like(sig)
    acc = 0.0
    for i, v in enumerate(sig):
        acc += alpha * (v - acc)
        out[i] = acc
    return out


def highpass(sig, cutoff):
    return sig - lowpass(sig, cutoff)


def mix(*parts):
    n = max(len(p) for p in parts)
    out = np.zeros(n)
    for p in parts:
        out[: len(p)] += p
    return out


def seq(*parts, gap=0.0):
    pieces = []
    for p in parts:
        pieces.append(p)
        if gap:
            pieces.append(np.zeros(int(SR * gap)))
    return np.concatenate(pieces)


def offset(sig, seconds):
    return np.concatenate([np.zeros(int(SR * seconds)), sig])


def norm(sig, peak=0.8):
    m = np.max(np.abs(sig)) or 1
    return sig / m * peak


def sounds():
    s = {}
    # Card: short paper rustle
    rustle = highpass(noise(0.16), 1800) * env(0.16, 0.004, 0.05, 3)
    s["card"] = norm(rustle, 0.55)
    # Flip: lighter, quicker rustle + tiny tick
    s["flip"] = norm(mix(highpass(noise(0.1), 2500) * env(0.1, 0.002, 0.03, 3), tone(1400, 0.03, decay=0.02) * 0.3), 0.5)
    # Click: wooden flap (resonant knock)
    knock = mix(tone(760, 0.12, "sine", 0.03), tone(1210, 0.08, "sine", 0.02) * 0.5, lowpass(noise(0.02), 3000) * 0.6)
    s["click"] = norm(knock, 0.75)
    # Select: soft high pop
    s["select"] = norm(tone(lambda x: 900 + 500 * np.exp(-x * 40), 0.09, decay=0.05), 0.45)
    # Plop: star appears (pitch drop bubble)
    s["plop"] = norm(tone(lambda x: 300 + 900 * np.exp(-x * 25), 0.22, decay=0.1), 0.7)
    # Hint: gentle, neutral two-note "hmm" (no harsh error buzz)
    hint = seq(tone(440, 0.16, "sine", 0.12, attack=0.02) * 0.6, tone(392, 0.22, "sine", 0.16, attack=0.02) * 0.6)
    s["hint"] = norm(lowpass(hint, 1800), 0.45)
    # Success: quick happy arpeggio C-E-G-C
    notes = [523.25, 659.25, 783.99, 1046.5]
    arp = mix(*[offset(tone(f, 0.35, "triangle", 0.25), i * 0.08) for i, f in enumerate(notes)])
    s["success"] = norm(arp, 0.6)
    # Fanfare: win jingle
    melody = [(523.25, 0.0), (659.25, 0.14), (783.99, 0.28), (1046.5, 0.42), (783.99, 0.62), (1046.5, 0.76)]
    fan = mix(*[offset(mix(tone(f, 0.45, "triangle", 0.35), tone(f * 2, 0.3, "sine", 0.2) * 0.2), at) for f, at in melody])
    chord = offset(mix(tone(523.25, 0.9, "sine", 0.8), tone(659.25, 0.9, "sine", 0.8), tone(783.99, 0.9, "sine", 0.8)) * 0.5, 0.9)
    s["fanfare"] = norm(mix(fan, chord), 0.65)
    # Chest: magical sparkle (rising shimmer)
    sparkle = mix(*[offset(tone(1200 + 180 * i, 0.4, "sine", 0.25) * (0.8 - i * 0.05), i * 0.06) for i in range(10)])
    s["chest"] = norm(mix(sparkle, offset(tone(lambda x: 200 + 400 * x, 0.6, "triangle", 0.5) * 0.3, 0.0)), 0.6)
    # Bell: buzzer bell ring
    bell = mix(tone(1320, 1.1, "sine", 0.9), tone(2640, 0.8, "sine", 0.5) * 0.4, tone(3960, 0.5, "sine", 0.3) * 0.2)
    s["bell"] = norm(bell, 0.6)
    # Dice: several clicks with decreasing gaps
    clicks = []
    at = 0.0
    for i in range(7):
        clicks.append(offset(mix(tone(1800 + rng.uniform(-300, 300), 0.03, decay=0.012), lowpass(noise(0.03), 4000) * 0.4) * (1 - i * 0.08), at))
        at += 0.09 - i * 0.008
    s["dice"] = norm(mix(*clicks), 0.6)
    # Jump: soft "boing"
    s["jump"] = norm(tone(lambda x: 250 + 500 * np.sin(np.pi * np.minimum(x / 0.3, 1)), 0.3, "sine", 0.28, curve=2), 0.6)
    # Whoosh: collect into basket
    sweep = lowpass(noise(0.35), 2200) * np.sin(np.pi * t(0.35) / 0.35) ** 2
    s["whoosh"] = norm(sweep, 0.5)
    return s


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    segments = sounds()
    gap = np.zeros(int(SR * GAP))
    buf = [gap]
    entries = {}
    cursor = GAP
    for name, sig in segments.items():
        sig = np.asarray(sig, dtype=np.float64)
        fade = min(len(sig), int(SR * 0.01))
        sig[-fade:] *= np.linspace(1, 0, fade)
        entries[name] = {"sprite": "ui", "start": round(cursor, 4), "duration": round(len(sig) / SR, 4)}
        buf += [sig, gap]
        cursor += len(sig) / SR + GAP
    audio = np.concatenate(buf)
    pcm = (np.clip(audio, -1, 1) * 32767).astype(np.int16)

    with tempfile.TemporaryDirectory() as tmp:
        wav_path = Path(tmp) / "ui.wav"
        with wave.open(str(wav_path), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        mp3 = OUT_DIR / "ui-sprite.mp3"
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_path), "-codec:a", "libmp3lame", "-b:a", "96k", str(mp3)],
            check=True,
        )

    manifest_path = OUT_DIR / "sounds.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    manifest.setdefault("sprites", {})["ui"] = {"src": "assets/sounds/ui-sprite.mp3"}
    manifest.setdefault("clips", {}).update(entries)
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {len(entries)} sounds, {cursor:.2f}s -> {mp3.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
