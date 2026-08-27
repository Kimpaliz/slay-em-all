// Die gesamte Rechnerei des Spiels an einer Stelle — ohne Browser, ohne
// Zeichnen, ohne Zufall.
//
// Warum getrennt: Alles hier ist eine reine Funktion. Gleiche Eingabe,
// gleiches Ergebnis. Dadurch lässt sich das Gleichgewicht des Spiels mit
// `pruefe-wirtschaft.mjs` prüfen und mit `balance.mjs` über viele Wellen
// durchrechnen, ohne dass ein Browser laufen muss.
//
// Drei Währungen mit drei verschiedenen Aufgaben:
//   Blut    — fällt bei jedem Tod an, kauft ausschließlich Zauber (Malvina)
//   Gold    — fällt als Münze auf die Brücke und muss aufgesammelt werden,
//             kauft Zulauf und Bequemlichkeit (Pips)
//   Schrott — fällt anteilig an, kauft die Burg selbst aus (Grommsch)

/* ---------------- Händlerwaren ---------------- */

/**
 * Grommsch, Zeugmeister — bezahlt wird in Schrott.
 * Er baut die Burg aus: schneller fressen, mehr Platz, Schützen auf die Zinnen.
 */
export const WAREN_GROMMSCH = [
  {
    k: 'klauen', name: 'Scharfe Klauen',
    text: 'Das Monster frisst 28 % schneller',
    preis: (st) => Math.round(6 * Math.pow(1.75, st))
  },
  {
    k: 'hallen', name: 'Tiefere Hallen',
    text: '+1 Recke passt in die Burg',
    preis: (st) => Math.round(10 * Math.pow(1.85, st))
  },
  {
    k: 'schuetze', name: 'Goblin-Bogenschütze',
    text: '+1 Schütze auf den Zinnen',
    preis: (st) => Math.round(12 * Math.pow(2.1, st)), max: 4
  },
  {
    k: 'pfeile', name: 'Widerhaken-Pfeile',
    text: '+1 Pfeilschaden (braucht Schützen)',
    preis: (st) => Math.round(24 * Math.pow(2.2, st)),
    bedingung: (stufen) => stufen.schuetze > 0
  },
  {
    k: 'schlund', name: 'Zweiter Schlund',
    text: '+1 Recke wird gleichzeitig gefressen',
    preis: (st) => Math.round(18 * Math.pow(2.15, st)), max: 4
  },
  {
    k: 'krit', name: 'Zielwasser',
    text: '+6 % kritische Treffer für Schützen (braucht Schützen)',
    preis: (st) => Math.round(15 * Math.pow(1.9, st)), max: 5,
    bedingung: (stufen) => stufen.schuetze > 0
  }
];

/**
 * Pips, Hortdrachling — bezahlt wird in Gold.
 * Er sorgt für Nachschub und dafür, dass weniger Beute liegen bleibt.
 */
export const WAREN_PIPS = [
  {
    k: 'lockruf', name: 'Lockrufe im Tal',
    text: '+8 % Recken pro Welle — mehr Beute',
    preis: (st) => Math.round(12 * Math.pow(1.7, st))
  },
  {
    k: 'marsch', name: 'Marschmusik',
    text: 'Recken laufen 13 % schneller',
    preis: (st) => Math.round(10 * Math.pow(1.7, st))
  },
  {
    k: 'koeder', name: 'Edler Köder',
    text: 'Hohe Ränge erscheinen eine Welle früher',
    preis: (st) => Math.round(25 * Math.pow(1.95, st)), max: 3
  },
  {
    k: 'sammler', name: 'Sammel-Drachling',
    text: 'Fliegt nachts, zieht Gold an — je Stufe +1 % Chance auf doppeltes Gold',
    preis: (st) => Math.round(40 * Math.pow(2.3, st)), max: 10
  },
  {
    k: 'stolz', name: 'Sammlerstolz',
    text: '+25 % Gold beim Selbst-Aufsammeln',
    preis: (st) => Math.round(20 * Math.pow(1.8, st))
  },
  {
    k: 'ernte', name: 'Makabre Ernte',
    text: '+50 % Gold aus besonderen Toden',
    preis: (st) => Math.round(30 * Math.pow(1.9, st))
  }
];

/* ---------------- Zauber ---------------- */

/**
 * Malvinas Zauber — bezahlt wird in Blut.
 *
 * `schadenSchritt` ist der Zuwachs je Stufe der Schadensachse. Die drei
 * Achsen (Schaden, Abklingzeit, Wirkbereich) kosten alle nach derselben
 * Formel, siehe `ausbauPreis`.
 */
export const ZAUBER = [
  {
    k: 'pranke', name: 'Drachenpranke', taste: '1',
    preis: 30, schaden: 10, abklingzeit: 22, wirkbereich: 70,
    schadenSchritt: 5, einheit: 'px Brücke',
    kurz: 'Pranke stößt aus dem Tor',
    lang: 'Stößt aus dem Tor, zermalmt alles auf der Brücke und schleift die Reste hinein.'
  },
  {
    k: 'donner', name: 'Donnerschlag', taste: '2',
    preis: 80, schaden: 6, abklingzeit: 16, wirkbereich: 15,
    schadenSchritt: 3, einheit: 'px Umkreis',
    kurz: 'Blitz auf Mausklick',
    lang: 'Blitz auf Mausklick — trifft alles im Umkreis des Einschlags.'
  },
  {
    k: 'flamme', name: 'Flammenstoß', taste: '3',
    preis: 260, schaden: 9, abklingzeit: 30, wirkbereich: 112,
    schadenSchritt: 4, einheit: 'px Reichweite',
    kurz: 'Feuerzunge aus dem Tor',
    lang: 'Feuerzunge über die Brücke. Getroffene verbrennen zu Asche.'
  },
  {
    k: 'meteor', name: 'Meteoritenschauer', taste: '4',
    preis: 700, schaden: 5, abklingzeit: 50, wirkbereich: 11,
    schadenSchritt: 3, einheit: 'px Einschlag',
    kurz: '6 Sekunden Steinregen',
    lang: 'Sechs Sekunden Steinregen über der Brücke. Getroffene verbrennen zu Asche.'
  }
];

/** Preis des Morgenrituals — startet die Welle nachts von selbst. */
export const RITUAL_PREIS = 420;

/** Kürzeste erreichbare Abklingzeit, als Anteil des Grundwerts. */
const ABKLING_BODEN = 0.35;

/* ---------------- Leere Stufen ---------------- */

export const STUFEN_GROMMSCH_LEER = { klauen: 0, hallen: 0, schuetze: 0, pfeile: 0, schlund: 0, krit: 0 };
export const STUFEN_PIPS_LEER = { lockruf: 0, marsch: 0, koeder: 0, sammler: 0, stolz: 0, ernte: 0 };

export function zauberStufenLeer() {
  const o = {};
  for (const z of ZAUBER) o[z.k] = { gelernt: 0, schaden: 0, abklingzeit: 0, wirkbereich: 0 };
  return o;
}

/* ---------------- Abgeleitete Werte ---------------- */

/**
 * Alles, was sich aus den gekauften Stufen ergibt.
 *
 * `angriff` ist der Faktor auf die Fressgeschwindigkeit; `kapazitaet` die
 * Zahl der Recken, die gleichzeitig in der Burg sein dürfen. Wird sie
 * überschritten, ist die Welle verloren.
 */
export function werte(stufenG, stufenP) {
  return {
    angriff: Math.pow(1.28, stufenG.klauen),
    kapazitaet: 3 + stufenG.hallen,
    // Wie viele Recken gleichzeitig gefressen werden. Der Rest wartet in
    // der Schlange — Kapazität ist der Puffer, der Schlund der Durchsatz.
    schlund: 1 + (stufenG.schlund || 0),
    schuetzen: stufenG.schuetze,
    pfeilSchaden: 1 + stufenG.pfeile,
    schuetzenKrit: 0.06 * (stufenG.krit || 0),
    tempoFaktor: 1 + 0.13 * stufenP.marsch,
    stolzFaktor: 1 + 0.25 * stufenP.stolz,
    ernteFaktor: 1.5 * (1 + 0.5 * stufenP.ernte),
    // Chance des Drachlings, eine Münze doppelt zu werten.
    doppelGold: 0.01 * stufenP.sammler
  };
}

/**
 * Wie viele Recken eine Welle mitbringt.
 *
 * Wächst um 16 % je Welle und ist bei 80 gedeckelt — sonst würde die
 * Bildfläche irgendwann sinnlos volllaufen, ohne dass das Spiel dadurch
 * interessanter wird.
 */
export function wellenStaerke(welle, stufeLockruf = 0) {
  return Math.min(80, Math.round(5 * Math.pow(1.16, welle - 1) * (1 + 0.08 * stufeLockruf)));
}

/** Abstand zwischen zwei Recken derselben Welle, in Sekunden. */
export function spawnAbstand(welle) {
  return Math.max(0.85, 2.7 - welle * 0.06);
}

/** Welche Klassen in dieser Welle überhaupt auftauchen können. */
export function verfuegbareKlassen(recken, welle, stufeKoeder = 0) {
  return recken.filter((c) => c.abWelle <= 1 || welle >= Math.max(2, c.abWelle - stufeKoeder));
}

/**
 * Gewichte für die Klassenauswahl.
 *
 * Späte Wellen verschieben das Gewicht zu den hohen Rängen: Der Exponent
 * wächst mit der Wellenzahl. Aus "meistens Bauern" wird mit der Zeit
 * "meistens Ritter und besser", ohne dass die Bauern ganz verschwinden.
 */
export function klassenGewichte(klassen, welle) {
  return klassen.map((_, i) => Math.pow(1.32 + welle * 0.012, i));
}

/** Werte eines Zaubers auf seinen aktuellen Stufen. */
export function zauberWerte(zauber, stufe) {
  return {
    gelernt: stufe.gelernt >= 1,
    schaden: zauber.schaden + zauber.schadenSchritt * stufe.schaden,
    abklingzeit: Math.max(
      zauber.abklingzeit * ABKLING_BODEN,
      zauber.abklingzeit * Math.pow(0.88, stufe.abklingzeit)
    ),
    wirkbereich: Math.round(zauber.wirkbereich * (1 + 0.12 * stufe.wirkbereich))
  };
}

/** Preis der nächsten Stufe auf einer der drei Zauberachsen. */
export function ausbauPreis(zauber, stufe) {
  return Math.round(zauber.preis * 0.4 * Math.pow(1.6, stufe));
}

/** Wohin die Welle nach einer Niederlage zurückfällt. */
export function rueckfall(welle) {
  return Math.max(1, welle - 5);
}

/* ---------------- Der Klick als Fähigkeit ---------------- */

/**
 * Der eigene Angriff: ein Klick auf einen Recken.
 *
 * Er wird bei Malvina gekauft und verhält sich wie ein Zauber — mit
 * Abklingzeit, Schaden und einer Trefferchance für kritische Schläge.
 * Drei Achsen: Schaden, Abklingzeit, kritische Treffer.
 */
export const KLICK = {
  name: 'Berührung des Bösen',
  preis: 15,
  schaden: 1,        // je Schadensstufe +1
  abklingzeit: 2,
  krit: 0.05,        // je Kritstufe +4 %
  kritSchritt: 0.04,
  kurz: 'Dein Klick verwundet Recken',
  lang: 'Ein Klick auf einen Recken verwundet ihn. Kritische Treffer machen doppelten Schaden.'
};

/**
 * Die drei kaufbaren Spielarten des Klicks. Gekaufte lassen sich
 * jederzeit umschalten; es ist immer genau eine aktiv.
 */
export const KLICK_VARIANTEN = [
  {
    k: 'midas', name: 'Midas-Berührung', preis: 350,
    text: 'Stirbt ein Recke am Klick, wird er zur Goldstatue — aufsammeln lohnt sich'
  },
  {
    k: 'inferno', name: 'Infernale Berührung', preis: 500,
    text: 'Das Ziel brennt (1 Schaden je Sekunde); stirbt es brennend, explodiert es'
  },
  {
    k: 'titan', name: 'Faust des Titanen', preis: 900,
    text: 'Flächenschlag mit massivem Schaden und langer Abklingzeit'
  }
];

export function klickStufenLeer() {
  return {
    gekauft: 0,
    schaden: 0, abklingzeit: 0, krit: 0,
    varianten: { midas: 0, inferno: 0, titan: 0 },
    aktiv: 'normal'
  };
}

/** Die Werte des Klicks auf seinen aktuellen Stufen. */
export function klickWerte(klick) {
  const schaden = KLICK.schaden + klick.schaden;
  const abkling = Math.max(
    KLICK.abklingzeit * 0.35,
    KLICK.abklingzeit * Math.pow(0.88, klick.abklingzeit)
  );
  const werte = {
    gekauft: klick.gekauft >= 1,
    variante: klick.aktiv,
    schaden,
    abklingzeit: abkling,
    krit: Math.min(0.6, KLICK.krit + KLICK.kritSchritt * klick.krit),
    // Nur die Faust weicht ab: achtfacher Schaden plus Sockel, dafür
    // eine lange eigene Abklingzeit und ein Wirkbereich.
    titanSchaden: schaden * 8 + 10,
    titanAbklingzeit: Math.max(30 * 0.35, 30 * Math.pow(0.88, klick.abklingzeit)),
    titanBereich: 36,
    brandSchaden: 1,
    brandDauer: 4,
    explosionSchaden: 2,
    explosionBereich: 14
  };
  return werte;
}

/** Preis der nächsten Stufe auf einer Klick-Achse. */
export function klickAusbauPreis(stufe) {
  return Math.round(KLICK.preis * 0.4 * Math.pow(1.6, stufe));
}

/* ---------------- Anzeige ---------------- */

/** Große Zahlen kurz und deutsch: 1234 wird zu "1,23 k". */
export function zahl(n) {
  if (!isFinite(n) || n <= 0) return '0';
  if (n < 1000) return String(Math.floor(n));
  const einheiten = [['Bio', 1e12], ['Mrd', 1e9], ['Mio', 1e6], ['k', 1e3]];
  for (const [kuerzel, wert] of einheiten) {
    if (n >= wert) {
      const q = n / wert;
      const s = q < 10 ? q.toFixed(2) : q < 100 ? q.toFixed(1) : String(Math.floor(q));
      return s.replace('.', ',') + ' ' + kuerzel;
    }
  }
  return String(Math.floor(n));
}
