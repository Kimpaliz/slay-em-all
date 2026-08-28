// Die feste Bühne. Alle Zahlen sind Bildpunkte auf der 800×200-Leinwand.
//
// Das Spiel rechnet immer in diesen Maßen, egal wie groß die Leinwand im
// Browser gerade dargestellt wird. Das Skalieren übernimmt der Browser über
// CSS; deshalb bleibt die Pixelgrafik scharf und die Physik unabhängig von
// der Fenstergröße.
//
// Von links nach rechts: offenes Land — Klippe — Zugbrücke über dem
// Abgrund — Burgmauer mit dem Tor. Recken laufen von links an und
// verschwinden bei TOR_EINTRITT.
//
// **Seit 0.11.0 ist die Bühne 800 statt 480 Punkte breit.** Die
// Landmarken sind dieselben geblieben und alle um `VERSATZ` nach rechts
// gerückt; links davor liegt neues offenes Land. Der Weg vom Erscheinen
// bis ins Tor ist damit doppelt so lang (635 statt 315 Punkte) — es gibt
// mehr Fläche zum Kämpfen und mehr Zeit, jemanden aufzuhalten.
//
// Auf den Bildschirm passt das nicht mehr am Stück: Die Leinwand ist
// breiter als ihr Rahmen und wird gescrollt. Was dabei gerade zu sehen
// ist, bekommt `zeichnen()` als `sicht` mitgeteilt — nur die
// Einblendungen (Spruchband, Dämmerung, Randabdunklung) richten sich
// danach, alles andere steht fest in der Welt.

/** Um so viel sind alle Landmarken nach rechts gerückt. */
export const VERSATZ = 320;

export const MASSE = {
  BREITE: 800,
  HOEHE: 200,

  DECK: 146,                      // Oberkante der Planken — hier stehen alle Füße
  KLIPPE: 118 + VERSATZ,          // rechter Rand des festen Bodens links
  MAUER: 296 + VERSATZ,           // linke Kante der Burgmauer

  TOR_LINKS: 300 + VERSATZ,       // Torbogen: linke Kante
  TOR_RECHTS: 336 + VERSATZ,      // Torbogen: rechte Kante
  TOR_MITTE: 318 + VERSATZ,       // Mittelpunkt des Bogens
  TOR_RADIUS: 18,
  TOR_SCHEITEL: 108,
  TOR_EINTRITT: 307 + VERSATZ,    // ab hier ist ein Recke verschluckt

  // Die Mauer läuft bis zum rechten Bildrand; Fackeln und Schützen
  // sitzen relativ zum Tor, nicht auf festen Zahlen.
  FACKELN: [356 + VERSATZ, 402 + VERSATZ, 448 + VERSATZ],

  // Wo der erste Bogenschütze auf den Zinnen steht. Steht hier und
  // nicht in `szene.js`, weil die Simulation den Abschusspunkt braucht
  // — und die darf nicht vom Zeichnen abhängen.
  SCHUETZE_X: 306 + VERSATZ
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
