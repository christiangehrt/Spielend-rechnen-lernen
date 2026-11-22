import { useSyncExternalStore } from 'react';

export type Route =
  | { name: 'hub' }
  | { name: 'profiles' }
  | { name: 'lobby'; gameId: string }
  | { name: 'play'; gameId: string }
  | { name: 'album' }
  | { name: 'parent' };

export const parseHash = (hash: string): Route => {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  switch (parts[0]) {
    case 'spiel':
      if (parts[1]) return parts[2] === 'los' ? { name: 'play', gameId: parts[1] } : { name: 'lobby', gameId: parts[1] };
      return { name: 'hub' };
    case 'profile':
      return { name: 'profiles' };
    case 'album':
      return { name: 'album' };
    case 'eltern':
      return { name: 'parent' };
    default:
      return { name: 'hub' };
  }
};

export const routeToHash = (route: Route): string => {
  switch (route.name) {
    case 'hub':
      return '#/';
    case 'profiles':
      return '#/profile';
    case 'lobby':
      return `#/spiel/${encodeURIComponent(route.gameId)}`;
    case 'play':
      return `#/spiel/${encodeURIComponent(route.gameId)}/los`;
    case 'album':
      return '#/album';
    case 'parent':
      return '#/eltern';
  }
};

export const navigate = (route: Route, replace = false) => {
  const hash = routeToHash(route);
  if (replace) history.replaceState(null, '', hash);
  else if (location.hash !== hash) location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};
const getHash = () => location.hash;

export const useRoute = (): Route => parseHash(useSyncExternalStore(subscribe, getHash, getHash));
