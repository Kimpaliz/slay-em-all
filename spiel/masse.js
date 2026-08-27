// Die feste Bühne. Alle Zahlen sind Bildpunkte auf der 480×200-Leinwand.
//
// Das Spiel rechnet immer in diesen Maßen, egal wie groß die Leinwand im
// Browser gerade dargestellt wird. Das Skalieren übernimmt der Browser über
// CSS; deshalb bleibt die Pixelgrafik scharf und die Physik unabhängig von
// der Fenstergröße.
//
// Von links nach rechts: Klippe — Zugbrücke über dem Abgrund — Burgmauer
// mit dem Tor. Recken laufen von links an und verschwinden bei TOR_EINTRITT.

export const MASSE = {
  BREITE: 480,
  HOEHE: 200,

  DECK: 146,        // Oberkante der Brückenplanken — hier stehen alle Füße
  KLIPPE: 118,      // rechter Rand des festen Bodens links
  MAUER: 296,       // linke Kante der Burgmauer

  TOR_LINKS: 300,   // Torbogen: linke Kante
  TOR_RECHTS: 336,  // Torbogen: rechte Kante
  TOR_MITTE: 318,   // Mittelpunkt des Bogens
  TOR_RADIUS: 18,
  TOR_SCHEITEL: 108,
  TOR_EINTRITT: 307 // ab hier ist ein Recke verschluckt
};

/**
 * Fester Boden? Alles dazwischen ist Abgrund.
 *
 * Wichtig für Münzen und Körperteile: Was daneben fällt, ist verloren.
 * Genau das macht den Unterschied zwischen Beute und Aussicht.
 */
export function festerBoden(x) {
  const m = MASSE;
  return x < m.KLIPPE - 2 || (x > m.KLIPPE - 4 && x < m.TOR_RECHTS) || x > m.MAUER - 2;
}

/** Höhe des Torbogens an der Stelle x — für das Zeichnen der Rundung. */
export function bogenHoehe(x) {
  const m = MASSE;
  const d = x - m.TOR_MITTE;
  const v = m.TOR_RADIUS * m.TOR_RADIUS - d * d;
  return v <= 0 ? m.DECK : m.TOR_SCHEITEL - Math.floor(Math.sqrt(v));
}

/** Immer gleiches Rauschen für eine Zahl — ersetzt Zufall, wo es ruhig bleiben soll. */
export function streu(i) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/** Weich auslaufende Bewegung von 0 auf 1. */
export function ausklang(k) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
}
