// Die gesamte Rechnerei des Spiels — und sonst nichts.
//
// Diese Datei kennt weder Browser noch Bildschirm. Dadurch kann Node sie
// prüfen (siehe pruefe-wirtschaft.mjs) und der Browser sie gleichzeitig
// benutzen. Wer an Balance schrauben will, tut es hier.

import { RECKEN } from '../spiel/daten/recken.js';

/** Wie schnell das Haus sich selbst ausbaut (in Spielsekunden). */
export const KAUF_ABSTAND_START = 16;
export const KAUF_ABSTAND_MINIMUM = 4.5;
export const KAUF_ABSTAND_PRO_KAUF = 0.35;

/** Neigung des Hauses, eine bestimmte Ausbaustufe zu wählen. */
export const KAUF_NEIGUNG = { lockruf: 3, klinge: 3, presse: 2.2, tor: 1.4, kobold: 1 };

export const STUFEN_LEER = { lockruf: 0, klinge: 0, tor: 0, presse: 0, kobold: 0 };

/**
 * Die fünf Kennzahlen, aus denen sich alles andere ergibt.
 *
 *  zulauf        Recken je Sekunde, die sich auf den Weg machen
 *  verweildauer  Sekunden, die ein Recke im Tor verbringt
 *  torplaetze    wie viele gleichzeitig bedient werden
 *  beute         Faktor auf alle Beute
 *  kobold        Blut je Sekunde ohne jeden Recken
 */
export function raten(stufen) {
  const s = { ...STUFEN_LEER, ...stufen };
  return {
    zulauf: 0.42 * Math.pow(1.22, s.lockruf),
    verweildauer: Math.max(0.14, 2.4 / Math.pow(1.3, s.klinge)),
    torplaetze: 1 + s.tor * 2,
    beute: Math.pow(1.3, s.presse),
    kobold: s.kobold === 0 ? 0 : 0.9 * Math.pow(2.3, s.kobold - 1)
  };
}

/** Welche Reckenklassen bei diesem Stand überhaupt auftauchen. */
export function freigeschaltet(erledigte) {
  return RECKEN.filter((r) => erledigte >= r.ab);
}

/**
 * Wie wahrscheinlich jede freigeschaltete Klasse auftaucht.
 * Später Freigeschaltete sind häufiger — die jeweils neueste bekommt
 * zusätzlich einen kleinen Aufschlag, damit sie sofort auffällt.
 */
export function klassenGewichte(erledigte) {
  const frei = freigeschaltet(erledigte);
  const n = frei.length;
  const gewichte = frei.map((_, i) => Math.pow(1.5, i) * (i === n - 1 ? 1.1 : 1));
  const summe = gewichte.reduce((a, b) => a + b, 0);
  return frei.map((klasse, i) => ({ klasse, gewicht: gewichte[i], anteil: gewichte[i] / summe }));
}

/** Zieht eine Klasse. `zufall` ist austauschbar, damit Prüfungen reproduzierbar sind. */
export function klasseWaehlen(erledigte, zufall = Math.random) {
  const verteilung = klassenGewichte(erledigte);
  let rest = zufall();
  for (const eintrag of verteilung) {
    rest -= eintrag.anteil;
    if (rest <= 0) return eintrag.klasse;
  }
  return verteilung[verteilung.length - 1].klasse;
}

/** Mittleres Blut je erledigtem Recken, Ausbauten eingerechnet. */
export function mittleresBlut(erledigte, stufen) {
  const r = raten(stufen);
  let summe = 0;
  for (const { klasse, anteil } of klassenGewichte(erledigte)) summe += anteil * klasse.blut;
  return summe * r.beute;
}

/**
 * Erledigte Recken je Sekunde im eingeschwungenen Zustand.
 * Es ist immer der Engpass, der zählt: entweder kommen zu wenige (Zulauf),
 * oder das Tor kommt nicht hinterher (Plätze geteilt durch Verweildauer).
 */
export function durchsatz(stufen) {
  const r = raten(stufen);
  return Math.min(r.zulauf, r.torplaetze / r.verweildauer);
}

/** Welcher der beiden Engpässe gerade bremst — für die Anzeige und die Balance. */
export function engpass(stufen) {
  const r = raten(stufen);
  return r.zulauf <= r.torplaetze / r.verweildauer ? 'zulauf' : 'tor';
}

/** Blut je Sekunde: aus erledigten Recken plus dem, was die Kobolde einbringen. */
export function blutProSekunde(erledigte, stufen) {
  const r = raten(stufen);
  return mittleresBlut(erledigte, stufen) * durchsatz(stufen) + r.kobold * r.beute;
}

/** Abstand zwischen zwei Selbstkäufen des Hauses, in Spielsekunden. */
export function kaufAbstand(kaeufe) {
  return Math.max(KAUF_ABSTAND_MINIMUM, KAUF_ABSTAND_START - kaeufe * KAUF_ABSTAND_PRO_KAUF);
}

/**
 * Welche Ausbaustufe das Haus als Nächstes kauft.
 * Je höher eine Stufe schon ist, desto unattraktiver wird sie; der Zufall
 * sorgt dafür, dass die Reihenfolge nicht jedes Mal gleich aussieht.
 */
export function hausWaehltAusbau(stufen, zufall = Math.random) {
  const s = { ...STUFEN_LEER, ...stufen };
  let beste = null;
  let besterWert = -1;
  for (const id of Object.keys(KAUF_NEIGUNG)) {
    const wert = (KAUF_NEIGUNG[id] / (1 + s[id])) * (0.6 + zufall() * 0.8);
    if (wert > besterWert) { besterWert = wert; beste = id; }
  }
  return beste;
}

/** Zahlen fürs Auge: 1234 wird zu "1,23 k", 5600000 zu "5,60 Mio". */
export function zahl(n) {
  if (!isFinite(n) || n <= 0) return '0';
  if (n < 1000) return (n < 10 && n % 1 ? n.toFixed(1) : String(Math.floor(n))).replace('.', ',');
  const stufen = [['Bio', 1e12], ['Mrd', 1e9], ['Mio', 1e6], ['k', 1e3]];
  for (const [kuerzel, wert] of stufen) {
    if (n >= wert) {
      const q = n / wert;
      const text = q < 10 ? q.toFixed(2) : q < 100 ? q.toFixed(1) : String(Math.floor(q));
      return text.replace('.', ',') + ' ' + kuerzel;
    }
  }
  return String(Math.floor(n));
}
