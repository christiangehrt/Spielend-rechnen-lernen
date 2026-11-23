import { useEffect, useState } from 'react';
import { recommend } from '../../core/adaptive/recommend';
import type { GameModule } from '../../core/types/game';
import type { PlayerProfile } from '../../core/types/profile';
import { GAMES, loadModule } from '../../games/registry';
import { Art } from '../shared/Art';

const BOT_NAMES: Record<string, string> = { anfaenger: 'Anfänger', mittel: 'Mittel', clever: 'Clever' };

/** Per-game level, recent rounds and recommendation for parents. */
export function GameProgressTable({ profile }: { profile: PlayerProfile }) {
  const [modules, setModules] = useState<Record<string, GameModule>>({});
  useEffect(() => {
    let alive = true;
    Promise.all(GAMES.map((g) => loadModule(g.meta.id))).then((mods) => {
      if (!alive) return;
      const map: Record<string, GameModule> = {};
      mods.forEach((m) => m && (map[m.meta.id] = m));
      setModules(map);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <table className="parent__stats">
      <thead>
        <tr>
          <th>Spiel</th>
          <th>Runden</th>
          <th>Gewonnen</th>
          <th>Sterne</th>
          <th>Stufe</th>
          <th>Letzte Runden</th>
        </tr>
      </thead>
      <tbody>
        {GAMES.filter((g) => g.load).map(({ meta }) => {
          const st = profile.gameStats[meta.id];
          const mod = modules[meta.id];
          const last = st?.recent[st.recent.length - 1];
          const presetLabel = last ? (mod?.presets.find((p) => p.id === last.preset)?.label ?? last.preset) : '–';
          const rec =
            last && mod
              ? recommend(
                  mod.presets.map((p) => p.id),
                  st!.recent,
                  { presetId: last.preset, botLevel: last.bot },
                  last.bot !== undefined,
                )
              : null;
          const recLabel = rec?.change
            ? rec.axis === 'bot'
              ? `Roboter ${BOT_NAMES[rec.botLevel ?? 'anfaenger']}`
              : (mod?.presets.find((p) => p.id === rec.presetId)?.label ?? rec.presetId)
            : null;
          return (
            <tr key={meta.id}>
              <td>
                <Art name={meta.art} size={26} /> {meta.title}
              </td>
              <td>{st?.played ?? 0}</td>
              <td>{st?.won ?? 0}</td>
              <td>{st?.starsEarned ?? 0}</td>
              <td>
                {presetLabel}
                {last?.bot ? ` · ${BOT_NAMES[last.bot]}` : ''}
                {recLabel && (
                  <span className={`parent__rec parent__rec--${rec!.change}`}>
                    {rec!.change === 'up' ? '↑' : '↓'} {recLabel}
                  </span>
                )}
              </td>
              <td>
                <span className="parent__trend" aria-label="Letzte Runden: grün = gut geschafft">
                  {(st?.recent ?? []).slice(-6).map((r, i) => (
                    <span key={i} className={r.mastered ? 'ok' : ''} />
                  ))}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const rate = (s: { ok: number; miss: number } | undefined) => (s && s.ok + s.miss > 0 ? s.ok / (s.ok + s.miss) : null);

/** Fine-grained learning progress collected by the games. */
export function SkillOverview({ profile }: { profile: PlayerProfile }) {
  const numbers = Array.from({ length: 20 }, (_, i) => i + 1);
  const blitz = numbers.map((n) => ({ n, s: profile.skillStats[`blitzblick:${n}`] }));
  const hasBlitz = blitz.some((b) => b.s);
  const bridge = profile.skillStats['zehner:bruecke'];
  const bridgeRate = rate(bridge);
  const weak = blitz.filter((b) => b.s && b.s.ok + b.s.miss >= 2 && (rate(b.s) ?? 1) < 0.6).map((b) => b.n);

  if (!hasBlitz && !bridge) {
    return <p className="parent__note">Sobald Ihr Kind Blitzblick oder Zahlenstrahl-Hüpfen spielt, erscheint hier der Lernstand.</p>;
  }
  return (
    <div className="skills">
      {hasBlitz && (
        <div className="skills__block">
          <h3>Mengen auf einen Blick erkennen (Blitzblick)</h3>
          <div className="skills__numbers">
            {blitz.map(({ n, s }) => {
              const r = rate(s);
              const cls = r === null ? '' : r >= 0.8 ? 'good' : r >= 0.5 ? 'mid' : 'weak';
              return (
                <span key={n} className={`skills__num ${cls}`} title={s ? `${s.ok} von ${s.ok + s.miss} sofort richtig` : 'noch nicht geübt'}>
                  {n}
                </span>
              );
            })}
          </div>
          <p className="parent__note">
            Grün: sicher · Gelb: manchmal · Rot: noch unsicher · Grau: noch nicht geübt.
            {weak.length > 0 && ` Übungstipp: ${weak.join(', ')} – z. B. mit Fingern zeigen („fünf und …“) oder mit Würfeln/Wendeplättchen legen.`}
          </p>
        </div>
      )}
      {bridge && bridgeRate !== null && (
        <div className="skills__block">
          <h3>Zehnerübergang (Zahlenstrahl-Hüpfen)</h3>
          <div className="skills__bar">
            <span style={{ width: `${Math.round(bridgeRate * 100)}%` }} />
          </div>
          <p className="parent__note">
            Bei {bridge.ok} von {bridge.ok + bridge.miss} Aufgaben über die Zehn hat Ihr Kind den Zehner-Zwischenstopp genutzt
            (z. B. 7 + 6: erst bis 10, dann 3 weiter).
            {bridgeRate < 0.5 && ' Übungstipp: Fragen Sie „Wie viele fehlen noch bis zur 10?“ – die verliebten Zahlen helfen dabei.'}
          </p>
        </div>
      )}
    </div>
  );
}
