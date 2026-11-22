import { describe, expect, it } from 'vitest';
import { parseHash, routeToHash, type Route } from './router';

describe('router', () => {
  it('round-trips all routes', () => {
    const routes: Route[] = [
      { name: 'hub' },
      { name: 'profiles' },
      { name: 'lobby', gameId: 'rauf-runter' },
      { name: 'play', gameId: 'klappen-zu' },
      { name: 'album' },
      { name: 'parent' },
    ];
    for (const r of routes) expect(parseHash(routeToHash(r))).toEqual(r);
  });
  it('falls back to the hub', () => {
    expect(parseHash('')).toEqual({ name: 'hub' });
    expect(parseHash('#/unbekannt')).toEqual({ name: 'hub' });
  });
});
