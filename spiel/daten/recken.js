// Die fünf Reckenklassen. `ab` ist die Zahl der Erledigten, ab der die Klasse
// im Tal auftaucht. `blut`/`knochen`/`schrott` ist die Beute pro Stück, vor
// allen Ausbauten. Die Farbfelder gehören zum Aussehen, nicht zur Rechnung.

export const RECKEN = [
  {
    id: 'bauer', name: 'Bauer', ab: 0,
    hoehe: 11, tempo: 20,
    blut: 3, knochen: 1, schrott: 0,
    koerper: '#5e5138', arm: '#6d5f42', stiefel: '#33291f', haut: '#c39066',
    kopf: '#a9873f', metall: '#8a8f9f', farbe: '#6d5f42', helm: false
  },
  {
    id: 'soeldner', name: 'Söldner', ab: 16,
    hoehe: 12, tempo: 24,
    blut: 8, knochen: 1, schrott: 1,
    koerper: '#523f2d', arm: '#634c37', stiefel: '#2d241b', haut: '#b07f57',
    kopf: '#2f2a24', metall: '#949aab', farbe: '#634c37', helm: false
  },
  {
    id: 'ritter', name: 'Ritter', ab: 62,
    hoehe: 14, tempo: 17,
    blut: 24, knochen: 2, schrott: 4,
    koerper: '#5f6474', arm: '#787d8e', stiefel: '#3d404c', haut: '#c39066',
    metall: '#949aaa', farbe: '#8b90a2', helm: true, schild: '#4d4380'
  },
  {
    id: 'paladin', name: 'Paladin', ab: 170,
    hoehe: 16, tempo: 14,
    blut: 68, knochen: 3, schrott: 9,
    koerper: '#7d8394', arm: '#969cad', stiefel: '#4c5060', haut: '#c39066',
    metall: '#b0b6c6', farbe: '#aab0c0', helm: true, schild: '#6558ab', umhang: '#584c96'
  },
  {
    id: 'meister', name: 'Großmeister', ab: 420,
    hoehe: 18, tempo: 12,
    blut: 180, knochen: 4, schrott: 18,
    koerper: '#9aa0b0', arm: '#b4bac9', stiefel: '#5b5f6e', haut: '#c39066',
    metall: '#ccd2e0', farbe: '#c6ccda', helm: true, schild: '#8f81d6', umhang: '#7264bb'
  }
];

export const RECKEN_NACH_ID = Object.fromEntries(RECKEN.map((r) => [r.id, r]));
