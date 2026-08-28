// Die fünf Reckenklassen.
//
// `abWelle` ist die Welle, ab der eine Klasse überhaupt erscheinen kann.
// Die Grenzen sind fest — der „Edle Köder" ist gestrichen, weil die
// Wellen von selbst schwerer werden.
//
// `lp` sind Lebenspunkte im Zehnermaßstab und zugleich die Verdauzeit:
// Das Monster frisst mit einer Grundgeschwindigkeit von 10 LP je Sekunde.
// Ein Großmeister blockiert also 16 Sekunden lang einen Platz in der Burg
// — das ist der eigentliche Grund, warum Kapazität so wertvoll ist.
//
// `blut` ist keine Währung mehr, sondern reine Statistik: Liter, die im
// Tor geblieben sind.
//
// Die Farbfelder beschreiben die Pixelfigur: Rumpf, Arme, Stiefel, Haut,
// Kopf (ohne Helm), Metall (Waffe und Helm), dazu Schild und Umhang für
// die höheren Ränge.

export const RECKEN = [
  {
    id: 'bauer', name: 'Bauer', abWelle: 1,
    hoehe: 11, tempo: 20, lp: 20,
    blut: 3, gold: 1,
    rumpf: '#5e5138', arm: '#6d5f42', stiefel: '#33291f',
    haut: '#c39066', kopf: '#a9873f', metall: '#8a8f9f', helm: false
  },
  {
    id: 'soeldner', name: 'Söldner', abWelle: 3,
    hoehe: 12, tempo: 24, lp: 40,
    blut: 8, gold: 2,
    rumpf: '#523f2d', arm: '#634c37', stiefel: '#2d241b',
    haut: '#b07f57', kopf: '#2f2a24', metall: '#949aab', helm: false
  },
  {
    id: 'ritter', name: 'Ritter', abWelle: 7,
    hoehe: 14, tempo: 17, lp: 70,
    blut: 22, gold: 5,
    rumpf: '#5f6474', arm: '#787d8e', stiefel: '#3d404c',
    haut: '#c39066', kopf: null, metall: '#949aaa', helm: true,
    schild: '#4d4380'
  },
  {
    id: 'paladin', name: 'Paladin', abWelle: 12,
    hoehe: 16, tempo: 14, lp: 110,
    blut: 55, gold: 9,
    rumpf: '#7d8394', arm: '#969cad', stiefel: '#4c5060',
    haut: '#c39066', kopf: null, metall: '#b0b6c6', helm: true,
    schild: '#6558ab', umhang: '#584c96'
  },
  {
    id: 'meister', name: 'Großmeister', abWelle: 18,
    hoehe: 18, tempo: 12, lp: 160,
    blut: 140, gold: 16,
    rumpf: '#9aa0b0', arm: '#b4bac9', stiefel: '#5b5f6e',
    haut: '#c39066', kopf: null, metall: '#ccd2e0', helm: true,
    schild: '#8f81d6', umhang: '#7264bb'
  }
];

/** Leerer Zähler je Klasse — an mehreren Stellen gebraucht. */
export function proKlasseLeer() {
  const o = {};
  for (const r of RECKEN) o[r.id] = 0;
  return o;
}
