# Spielend rechnen lernen

Offline-fähige Mathe-Spielesammlung (PWA) für Kinder ab 6 Jahren: 9 Spiele für den Übergang vom
zählenden Rechnen zu Addition, Zahlzerlegung, Abstandsabschätzung und Zahlensprüngen.
Bedienbar ohne Lesekenntnisse (Icons, Animationen, Sprachausgabe), große Touch-Flächen,
kurze Runden, keine Zeitlimits, sanftes Feedback bei falschen Zügen.

Umgesetzt sind alle Roadmap-Phasen aus dem Entwickler-Briefing v2.0. Die finalen
Illustrationen und Sprachaufnahmen kommen später über den [Asset-Contract](#asset-contract).

## Die 9 Spiele

Die Spiele übernehmen die Mechaniken aus dem Briefing, haben aber **eigene Namen und eine
eigene Optik**. Die Originaltitel (The Game, 6 nimmt!, Halli Galli, Sleeping Queens, I Sea 10!,
Elfer raus!) sind geschützte Marken bzw. Verlagsprodukte und werden in der App nicht verwendet.

| # | In der App | Mechanik (Briefing) | Junior-Standard | Profi | Modi |
|---|---|---|---|---|---|
| 1 | **Rauf & Runter** | The Game | Karten 2–19, 1 Stapel ↑ ab 1, 1 Stapel ↓ ab 20, Sprung ±5, 6 Handkarten | 1–50 (±10), Original 2–99 mit 4 Stapeln | allein, zu zweit (Koop) |
| 2 | **Raupen-Reihen** | 6 nimmt! | Karten 1–30, 3 Reihen, jede Karte 1 Punkt, 6 Handkarten | 1–104, 4 Reihen, Original-Wertung | gegen 2 Roboter, zu zweit + Roboter |
| 3 | **Nachbar-Reihe** | Elfer raus! | 2 Farben × 1–20, 7 Handkarten | 4 Farben (80 Karten) | gegen Roboter, zu zweit |
| 4 | **Klappen zu!** | Shut the Box | Klappen 1–9, 2 Würfel (ZR 10: Klappen 1–6, 1 Würfel) | Klappen 1–12 | allein |
| 5 | **Schlummer-Schloss** | Sleeping Queens | Originaldeck (67 Karten), 12 schlafende Tiere, Sieg mit 4 Tieren/40 Punkten | 5 Tiere/50 Punkte | gegen Roboter, zu zweit |
| 6 | **Blitz-Fünf** | Halli Galli | Zielsumme 5, 56 Karten, 4 Obstsorten | – | gegen Roboter, Split-Screen zu zweit |
| 7 | **Verliebte Zahlen** | I Sea 10! | 4×5-Raster (20 Plättchen), ohne Elster | 40 bzw. 100 Plättchen mit Elster (statt Hai) | allein |
| 8 | **Zahlenstrahl-Hüpfen** | – | Zahlenstrahl 0–20, Steine bei 5/10/15/20, Zehner-Zwischenstopp | 0–10, Minus bis 20, 0–100 (20er-Ausschnitt) | allein |
| 9 | **Zahlen-Detektiv** | – | Geheimzahl 1–20, Fragen >, <, zwischen, genau | 1–10, 1–50, 1–100 | allein |

Schlummer-Schloss: Wecker (König), Waschbär (Ritter), Wachhund (Drache), Schlaflied (Schlaftrank),
Trommel (Zauberstab), Clown (Hofnarr). Die Hund/Katze-Konfliktregel ist nicht enthalten.

Roboter-Stärken (Anfänger = Standard, Mittel, Clever) folgen den Heuristiken aus Abschnitt 6 des
Briefings; Bots „denken“ 800–1500 ms, damit das Kind jeden Zug verfolgen kann.

## Schnellstart

```bash
npm install
npm run dev        # Entwicklungsserver (http://localhost:5173)
npm test           # Unit-Tests (Vitest, reine Spiellogik, Speicher, Belohnungen)
npm run build      # Typecheck + Produktions-Build nach dist/ (inkl. Service Worker)
npm run preview    # Build lokal ansehen (http://localhost:4173)
```

Node 22 wird empfohlen.

### Auf dem Tablet testen

Service Worker (Offline-Modus) und Installation funktionieren nur über **HTTPS** (oder `localhost`).

- **GitHub Pages:** Der Workflow `.github/workflows/deploy-pages.yml` baut und veröffentlicht die App
  bei jedem Push auf `main`. Einmalig unter *Settings → Pages → Source* „GitHub Actions“ wählen.
  Die App läuft mit relativen Pfaden und Hash-Routing, also auch unter `…/Spielend-rechnen-lernen/`.
- **Im Heimnetz (ohne Offline-Modus):** `npm run build && npx vite preview --host` und auf dem Tablet
  `http://<IP-des-Rechners>:4173` öffnen.

Dann im Browser „Zum Home-Bildschirm“ (iPadOS Safari: Teilen-Menü) bzw. „App installieren“
(Android Chrome) wählen. Das schützt auf iOS auch vor dem automatischen Löschen der Daten nach
7 Tagen ohne Nutzung.

## Architektur

```
public/
  manifest.json              PWA-Manifest
  icons/                     App-Icons (aus icons/icon.svg erzeugt)
  assets/
    art.json  art/           Grafik-Manifest + SVGs (Spielkacheln, Avatare, Karten, UI)
    stickers/stickers.json   Sticker-Manifest + 40 Sticker
    themes/themes.json       4 Album-Szenen (Dschungel, Weltall, Unterwasserwelt, Bauernhof)
    sounds/sounds.json       Audio-Sprite-Manifest + ui-sprite.mp3
src/
  core/
    types/                   Profile, Settings, Rewards, GameModule-Schnittstelle
    storage/                 localStorage-Wrapper, Schema-Migration, Auto-Resume, JSON-Backup
    audio/                   Web-Audio-Manager (Unlock, Sprites, Sprach-Fallback), Sprachbausteine
    rewards/                 Sterne, Schatztruhe, Statistik (reine Funktionen)
    bots/                    Denkpausen, Bot-Stärken, Timer-Hook
    scaffolding/             Punktemuster (5er-/10er-Feld), Mini-Zahlenstrahl
    random/, history.ts, subsetSum.ts, router.ts
  components/
    Hub/                     Startseite (9 Kacheln, Lernziel-Filter), Lobby, Profile
    GameHost/                Spielrahmen: Laden/Speichern, Undo, Ergebnis, Sterne, Truhe
    StickerAlbum/            Szenen mit Drag & Drop, Tippen-zum-Platzieren, Skalieren (Pinch/±)
    ParentGate/              Elternbereich (3 Sekunden halten)
    shared/                  Buttons, Karten, Würfel, Overlays, Drag & Drop, Pass-and-Play
  games/
    registry.ts              zentrale Registrierung aller 9 Module (lazy geladen)
    <spiel>/                 meta.ts · types.ts · engine.ts · engine.test.ts · View · index.ts
```

**Game-Engine-Pattern:** Jede Spiellogik ist ein reiner Reducer (`reduce(state, action) → state`)
ohne DOM- oder Zeitabhängigkeit. Zufall läuft über einen Seed im State (mulberry32), dadurch sind
Züge reproduzierbar, testbar und nach einem Reload exakt wiederherstellbar. Ein Modul implementiert
`GameModule` (`src/core/types/game.ts`): Presets, Modi, `create`, `reduce`, `canUndo`, `result`, `View`.
Der `GameHost` speichert nach jedem gültigen Zug (`activeSession_<profil>_<spiel>`), zeigt das
Ergebnis und vergibt die Sterne genau einmal, wenn die Runde wirklich beendet ist. So lassen sich
Sterne nicht durch Rückgängig-Machen und Wiederholen sammeln.

**Undo:** Rauf & Runter, Klappen zu! (nur die noch nicht bestätigte Klappenauswahl),
Zahlenstrahl-Hüpfen und Verliebte Zahlen (Sammeln, nicht Umdrehen). Endet eine Runde in einer
Sackgasse, fragt die App zuerst „Rückgängig oder fertig?“.

**Belohnungen:** Runde beendet +1 Stern, gewonnen +2, Strategie-Bonus +1 (±5/±10-Sprung,
Gleichung, Zerlegung mit 3+ Teilen, Zehner-Zwischenstopp, Intervall-Halbierung). Alle 5 Sterne
öffnet sich eine Truhe mit einem neuen Sticker, ohne Doppelte.

**Audio:** Beim ersten Tippen wird der `AudioContext` entsperrt. UI-Geräusche kommen aus einem
selbst synthetisierten MP3-Sprite (`scripts/generate-ui-sounds.py`). Sprache wird zuerst aus
aufgenommenen Clips gespielt; fehlt ein Clip, spricht `speechSynthesis` den Text. Gibt es keine
deutsche Stimme, bleibt die App still, statt falsch auszusprechen. Der Elternbereich zeigt an, ob
eine deutsche Stimme vorhanden ist.

## Asset-Contract

Grafiken und Töne werden nur über Manifeste referenziert. Finale Dateien können **1:1 ersetzt**
werden (gleicher Dateiname) oder im JSON umgehängt werden – ohne Code-Änderung.

| Manifest | Inhalt |
|---|---|
| `public/assets/art.json` | `key → { src, emoji }` – z. B. `game.klappen-zu`, `avatar.fox`, `card.wecker`, `fruit.pear`, `ui.star` |
| `public/assets/stickers/stickers.json` | `[{ id, src, theme }]` – neue Sticker einfach ergänzen |
| `public/assets/themes/themes.json` | `[{ id, name, src, art, color }]` – Szenen-Hintergründe |
| `public/assets/sounds/sounds.json` | `sprites: { id: { src } }`, `clips: { key: { sprite, start, duration } }` |

**Sprachaufnahmen nachliefern:** Ein Sprach-Sprite (z. B. `speech.mp3`) unter `sprites` eintragen
und in `clips` die Zeitbereiche für diese Schlüssel angeben:

- Zahlen: `num_0` … `num_100`
- Bausteine (siehe `src/core/audio/phrases.ts`): `plus`, `minus`, `equals`, `ten_jump` („Zehnersprung!“),
  `five_jump`, `great` („Super gemacht!“), `well_done`, `try_again`, `not_here`, `too_far`, `too_much`,
  `your_turn`, `yes`, `no`, `bigger`, `smaller`, `between`, `and`, `exactly`, `won`, `chest`,
  `new_sticker`, `continue`, `new_game`, `hold_parent`

Vorhandene Clips werden automatisch verwendet, fehlende fallen auf die Sprachsynthese zurück.
Die Platzhalter-Grafiken stammen aus Twemoji; `npm run assets:twemoji` kopiert sie neu,
`npm run assets:sounds` erzeugt das UI-Sprite neu, `npm run assets:icons` die App-Icons.

## Speicher & Datenschutz

Alles bleibt lokal im Browser (`localStorage`, Schlüssel `msl.*`, `schemaVersion: 1` mit Migration).
Kein Konto, kein Server, kein Tracking. Der Elternbereich (Schloss-Symbol 3 Sekunden halten) bietet
Profile, Einstellungen (Zahlenraum, Punktemuster, Mini-Zahlenstrahl, Geräusche, Sprache), Statistik
und den JSON-Export/-Import aller Profile, Sticker-Alben und laufenden Spiele.

## Qualitätssicherung

Automatisch geprüft (`npm test`, 126 Tests):
- The Game: Pflichtabgabe sinkt bei leerem Stapel von 2 auf 1, Undo stellt den Zug exakt wieder her
- Shut the Box: Subset-Sum-Ende (offen 2/4/6, Wurf 5 → sofort Ende), 1-Würfel-Option genau wenn alle Klappen > 6 zu sind
- Sleeping Queens: 2- und Mehr-Summanden-Gleichungen (1+2+3=6), Ablehnung falscher, Konter als Interrupt
- 6 nimmt!: strikt aufsteigende Abarbeitung, manuell gewählte Reihe beginnt mit der neuen Karte, bevor die nächste Karte geprüft wird
- Auto-Resume und JSON-Backup verlustfrei (Round-Trip-Test), Schema-Migration
- Bot-gegen-Bot-Partien aller Stärken laufen ohne Hänger durch

Im Browser geprüft (Chromium, Tablet- und Handy-Querformat): alle 9 Spiele spielbar, Reload mitten im
Spiel, Offline-Start aller Spiele über den Service Worker, keine Konsolenfehler.

**Noch auf echten Geräten zu prüfen** (Abnahmekriterien Abschnitt 8): iPadOS Safari und Android
Chrome (Audio-Unlock, Sprachausgabe, Installation, Multi-Touch im Split-Screen von Blitz-Fünf).

## Lizenzen der Platzhalter-Assets

- Grafiken: [Twemoji](https://github.com/jdecked/twemoji) – © Twitter/X und Mitwirkende, CC-BY 4.0
- Schriften: Fredoka, Nunito – SIL Open Font License (über `@fontsource`, lokal eingebettet)
- Icons: [Lucide](https://lucide.dev) – ISC
- Geräusche, Szenen-Hintergründe, App-Icon, Kartenstapel-Symbol: für dieses Projekt erstellt
