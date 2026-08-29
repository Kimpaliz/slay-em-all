// Die sieben Reckenklassen.
//
// `abWelle` ist die Welle, ab der eine Klasse überhaupt erscheinen kann.
//
// **Zwei getrennte Achsen, seit 0.10.0.** Vorher war `lp` beides zugleich:
// Zähigkeit auf der Brücke *und* Verdauzeit im Tor. Das koppelte zwei
// Dinge, die nichts miteinander zu tun haben, und ließ Bosse ins
// Unspielbare wachsen (Welle 20: 1.011 Sekunden reine Fresszeit).
//
//   `lp`        wie schwer er auf der Brücke zu töten ist —
//               Pfeile, Zauber, Klicks.
//   `fressZeit` wie lange er im Tor einen Platz blockiert, in Sekunden.
//               Von den Lebenspunkten völlig unabhängig.
//
// Normale Recken brauchen 2 Sekunden. Der Panzerritter ist die Ausnahme
// mit 7 — er ist der Verstopfer, nicht der Zähe.
//
// `blut` ist keine Währung, sondern reine Statistik: Liter, die im Tor
// geblieben sind.
//
// Die Farbfelder beschreiben die Pixelfigur: Rumpf, Arme, Stiefel, Haut,
// Kopf (ohne Helm), Metall (Waffe und Helm), dazu Schild und Umhang für
// die höheren Ränge.

/** Was ein gewöhnlicher Recke im Tor an Zeit kostet, in Sekunden. */
export const FRESSZEIT_NORMAL = 2;

export const RECKEN = [
  {
    id: 'bauer', name: 'Bauer', abWelle: 1,
    hoehe: 11, tempo: 20, lp: 20, fressZeit: FRESSZEIT_NORMAL,
    blut: 3, gold: 1,
    rumpf: '#5e5138', arm: '#6d5f42', stiefel: '#33291f',
    haut: '#c39066', kopf: '#a9873f', metall: '#8a8f9f', helm: false
  },
  {
    id: 'soeldner', name: 'Söldner', abWelle: 3,
    hoehe: 12, tempo: 24, lp: 40, fressZeit: FRESSZEIT_NORMAL,
    blut: 8, gold: 2,
    rumpf: '#523f2d', arm: '#634c37', stiefel: '#2d241b',
    haut: '#b07f57', kopf: '#2f2a24', metall: '#949aab', helm: false
  },
  {
    id: 'ritter', name: 'Ritter', abWelle: 7,
    hoehe: 14, tempo: 17, lp: 70, fressZeit: FRESSZEIT_NORMAL,
    blut: 22, gold: 5,
    rumpf: '#5f6474', arm: '#787d8e', stiefel: '#3d404c',
    haut: '#c39066', kopf: null, metall: '#949aaa', helm: true,
    schild: '#4d4380'
  },
  {
    // Der Verstopfer. Wenig gefährlich, aber er belegt das Maul
    // dreieinhalbmal so lange wie jeder andere — hinter ihm staut sich
    // die Welle. Dafür ist er langsam und ein dankbares Ziel für Pfeile.
    id: 'panzer', name: 'Panzerritter', abWelle: 9,
    hoehe: 15, tempo: 10, lp: 220, fressZeit: 7,
    blut: 40, gold: 8,
    breit: true,
    rumpf: '#4e5462', arm: '#5f6574', stiefel: '#33363f',
    haut: '#c39066', kopf: null, metall: '#7f8695', helm: true,
    schild: '#3d3a5c'
  },
  {
    id: 'paladin', name: 'Paladin', abWelle: 12,
    hoehe: 16, tempo: 14, lp: 110, fressZeit: FRESSZEIT_NORMAL,
    blut: 55, gold: 9,
    rumpf: '#7d8394', arm: '#969cad', stiefel: '#4c5060',
    haut: '#c39066', kopf: null, metall: '#b0b6c6', helm: true,
    schild: '#6558ab', umhang: '#584c96'
  },
  {
    // Kämpft nicht, heilt. Er trottet weit hinten und hält alles um sich
    // herum am Leben — wer ihn stehen lässt, kämpft gegen die Welle
    // zweimal. Selbst ist er dünn.
    id: 'heiler', name: 'Heilzauberer', abWelle: 14,
    hoehe: 15, tempo: 7, lp: 90, fressZeit: FRESSZEIT_NORMAL,
    blut: 30, gold: 12,
    heilt: { reichweite: 34, proSekunde: 9 },
    rumpf: '#2f6b4f', arm: '#3d8462', stiefel: '#24402f',
    haut: '#c39066', kopf: '#d8d2b8', metall: '#8fd39a', helm: false,
    umhang: '#2a5c44'
  },
  {
    id: 'meister', name: 'Großmeister', abWelle: 18,
    hoehe: 18, tempo: 12, lp: 160, fressZeit: FRESSZEIT_NORMAL,
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
