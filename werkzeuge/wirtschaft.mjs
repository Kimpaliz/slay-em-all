// Die gesamte Rechnerei des Spiels an einer Stelle — ohne Browser, ohne
// Zeichnen, ohne Zufall.
//
// Warum getrennt: Alles hier ist eine reine Funktion. Gleiche Eingabe,
// gleiches Ergebnis. Dadurch lässt sich das Gleichgewicht des Spiels mit
// `pruefe-wirtschaft.mjs` prüfen und mit `balance.mjs` über viele Wellen
// durchrechnen, ohne dass ein Browser laufen muss.
//
// **Eine Währung: Gold.** Blut und Schrott waren einmal Währungen; jetzt
// ist Blut nur noch eine Statistik (die Seele des Spiels, aber niemand
// bezahlt damit) und Schrott ganz fort. Gold fällt als Münze auf die
// Brücke und muss aufgesammelt werden — deshalb ist der einzige Grund,
// überhaupt einzugreifen, dass besondere Tode mehr Gold abwerfen.
//
// **Alle Lebens- und Schadenswerte im Zehnermaßstab.** Das Monster frisst
// 10 LP je Sekunde, ein Bauer hat 20 — er braucht also weiterhin zwei
// Sekunden. Die Zeiten sind unverändert, nur die Zahlen sind größer.
// Grund: Große Zahlen tragen feine Modifikatoren (+1,5 % Klauen, ein
// 13er-Gift-Tick). Mit 2-LP-Bauern wäre all das nicht zu spüren.

/* ---------------- Schadensarten ---------------- */

/**
 * Jeder Schaden hat eine Art. Alles ohne besondere Art ist physisch.
 * Die schwebenden Schadenszahlen färben sich danach.
 */
export const SCHADENSARTEN = {
  physisch: { name: 'Physisch', farbe: '#e9e9ed' },
  feuer: { name: 'Feuer', farbe: '#ff7a2a' },
  blitz: { name: 'Blitz', farbe: '#cfc8ff' },
  eis: { name: 'Eis', farbe: '#9ecbff' },
  gift: { name: 'Gift', farbe: '#7fd48a' }
};

/** Farbe einer Schadenszahl — Krits sind immer golden. */
export function schadensFarbe(art, krit) {
  if (krit) return '#ffd08a';
  return (SCHADENSARTEN[art] || SCHADENSARTEN.physisch).farbe;
}

/* ---------------- Händlerwaren ---------------- */

/** Ab dieser Welle lassen sich Tiefere Hallen überhaupt kaufen. */
export const HALLEN_AB_WELLE = 8;

const prozent = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',') + ' %';
const prozentFein = (n) => (Math.round(n * 100) / 100).toString().replace('.', ',') + ' %';

/**
 * Grommsch, Zeugmeister — bezahlt wird in Gold.
 * Er baut die Burg aus: schneller fressen, mehr Platz, Schützen auf die Zinnen.
 *
 * `wertJetzt` und `wertNaechste` liefern die Wirkung als Text. Die
 * Warenbeschreibung zeigt den aktuellen Gesamtwert, der Tooltip am
 * Kaufknopf den Zugewinn der nächsten Stufe.
 */
export const WAREN_GROMMSCH = [
  {
    k: 'klauen', name: 'Scharfe Klauen',
    text: 'Das Monster frisst schneller',
    // Flach und ohne Deckel: die verlässliche Dauersenke für Gold, die
    // ein Idle-Spiel braucht.
    preis: (st) => Math.round(6 * Math.pow(1.35, st)),
    wertJetzt: (st) => st > 0 ? 'frisst ' + prozent(st * 1.5) + ' schneller' : 'frisst mit Grundtempo',
    wertNaechste: (st) => '+' + prozent(1.5) + ' → ' + prozent((st + 1) * 1.5)
  },
  {
    k: 'hallen', name: 'Tiefere Hallen',
    text: '+1 Recke passt in die Burg',
    preis: (st) => Math.round(400 * Math.pow(2.5, st)),
    bedingung: (stufen, welle) => (welle || 1) >= HALLEN_AB_WELLE,
    gesperrtText: 'ab Welle ' + HALLEN_AB_WELLE,
    wertJetzt: (st) => 'Burg fasst ' + (3 + st) + ' Recken',
    wertNaechste: (st) => '+1 Platz → ' + (4 + st) + ' Recken'
  },
  {
    k: 'putztrupp', name: 'Putztrupp',
    text: '+1 Goblin wischt Blut auf und bringt es heim',
    preis: (st) => Math.round(30 * Math.pow(1.9, st)), max: 5,
    wertJetzt: (st) => (1 + st) + ' Goblin' + (st ? 'snd' : '') === '1 Goblin'
      ? '1 Goblin' : (1 + st) + ' Goblins',
    wertNaechste: (st) => (2 + st) + ' Goblins, ' + (10 + 3 * (st + 1)) + ' Tempo'
  },
  {
    k: 'schlund', name: 'Zweiter Schlund',
    text: '+1 Recke wird gleichzeitig gefressen',
    preis: (st) => Math.round(25 * Math.pow(2.3, st)), max: 4,
    wertJetzt: (st) => 'frisst ' + (1 + st) + ' zugleich',
    wertNaechste: (st) => '+1 Maul → ' + (2 + st) + ' zugleich'
  },
  {
    k: 'schuetze', name: 'Goblin-Bogenschütze',
    text: '+1 Schütze auf den Zinnen',
    preis: (st) => Math.round(15 * Math.pow(2.1, st)), max: 4,
    wertJetzt: (st) => st > 0 ? st + ' Schütze' + (st > 1 ? 'n' : '') + ' auf den Zinnen' : 'keine Schützen',
    wertNaechste: (st) => '+1 Schütze → ' + (st + 1)
  },
  {
    k: 'pfeile', name: 'Widerhaken-Pfeile',
    text: '+10 Pfeilschaden (braucht Schützen)',
    preis: (st) => Math.round(30 * Math.pow(2.2, st)),
    bedingung: (stufen) => stufen.schuetze > 0,
    gesperrtText: 'braucht Schützen',
    wertJetzt: (st) => 'Pfeile machen ' + (10 + st * 10) + ' Schaden',
    wertNaechste: (st) => '+10 → ' + (20 + st * 10) + ' Schaden'
  },
  {
    k: 'krit', name: 'Zielwasser',
    text: 'Kritische Pfeile (braucht Schützen)',
    preis: (st) => Math.round(20 * Math.pow(1.9, st)), max: 5,
    bedingung: (stufen) => stufen.schuetze > 0,
    gesperrtText: 'braucht Schützen',
    wertJetzt: (st) => st > 0 ? prozent(st * 6) + ' kritische Pfeile' : 'keine kritischen Pfeile',
    wertNaechste: (st) => '+' + prozent(6) + ' → ' + prozent((st + 1) * 6)
  }
];

/**
 * Pips, Hortdrachling — bezahlt wird in Gold.
 * Er sorgt dafür, dass weniger Beute liegen bleibt und mehr davon zählt.
 *
 * Lockrufe, Marschmusik und Edler Köder sind ersatzlos gestrichen: Menge,
 * Tempo und Rangfolge steigern die Wellen jetzt von selbst (siehe
 * `wellenSkalierung`) — ein Kauf, der dasselbe täte, wäre doppelt.
 */
export const WAREN_PIPS = [
  {
    k: 'sammler', name: 'Sammel-Drachling',
    text: 'Fliegt nachts und zieht Gold an',
    preis: (st) => Math.round(40 * Math.pow(2.3, st)), max: 10,
    wertJetzt: (st) => st > 0
      ? 'sammelt nachts ein, ' + prozent(st) + ' Chance auf doppeltes Gold'
      : 'du sammelst noch selbst',
    wertNaechste: (st) => st === 0
      ? 'er fliegt nachts und sammelt für dich'
      : '+1 % doppelt → ' + prozent(st + 1) + ', größerer Radius'
  },
  {
    k: 'schatzjaeger', name: 'Schatzjäger',
    text: 'Höhere Chance, dass ein Artefakt fällt',
    preis: (st) => Math.round(50 * Math.pow(2.0, st)), max: 10,
    wertJetzt: (st) => 'Fundchance ' + prozentFein(0.05 + 0.1 * st),
    wertNaechste: (st) => '+' + prozentFein(0.1) + ' → ' + prozentFein(0.05 + 0.1 * (st + 1))
  },
  {
    k: 'stolz', name: 'Sammlerstolz',
    text: 'Mehr Gold beim Selbst-Aufsammeln',
    preis: (st) => Math.round(25 * Math.pow(1.8, st)),
    wertJetzt: (st) => st > 0 ? '+' + prozent(st * 25) + ' beim Aufsammeln von Hand' : 'Münzen zählen einfach',
    wertNaechste: (st) => '+' + prozent(25) + ' → +' + prozent((st + 1) * 25)
  },
  {
    k: 'ernte', name: 'Makabre Ernte',
    text: 'Mehr Gold aus besonderen Toden',
    preis: (st) => Math.round(35 * Math.pow(1.9, st)),
    wertJetzt: (st) => 'besondere Tode werfen ×' + faktorText(1.5 * (1 + 0.5 * st)) + ' Gold ab',
    wertNaechste: (st) => '×' + faktorText(1.5 * (1 + 0.5 * st)) + ' → ×' + faktorText(1.5 * (1 + 0.5 * (st + 1)))
  }
];

function faktorText(f) {
  return (Math.round(f * 100) / 100).toString().replace('.', ',');
}

/* ---------------- Zauber ---------------- */

/**
 * Malvinas Zauber — bezahlt wird in Gold.
 *
 * `schadenSchritt` ist der Zuwachs je Stufe der Schadensachse. Die drei
 * Achsen (Schaden, Abklingzeit, Wirkbereich) kosten alle nach derselben
 * Formel, siehe `ausbauPreis`. `art` ist die Schadensart.
 */
export const ZAUBER = [
  {
    k: 'pranke', name: 'Drachenpranke', taste: '1', art: 'physisch',
    preis: 40, schaden: 100, abklingzeit: 22, wirkbereich: 70,
    schadenSchritt: 50, einheit: 'px Brücke',
    kurz: 'Pranke stößt aus dem Tor',
    lang: 'Stößt aus dem Tor, zermalmt alles auf der Brücke und schleift die Reste hinein.'
  },
  {
    k: 'donner', name: 'Donnerschlag', taste: '2', art: 'blitz',
    preis: 90, schaden: 60, abklingzeit: 16, wirkbereich: 15,
    schadenSchritt: 30, einheit: 'px Umkreis',
    kurz: 'Blitz auf Mausklick',
    lang: 'Blitz auf Mausklick — trifft alles im Umkreis des Einschlags.'
  },
  {
    k: 'flamme', name: 'Flammenstoß', taste: '3', art: 'feuer',
    preis: 250, schaden: 90, abklingzeit: 30, wirkbereich: 112,
    schadenSchritt: 40, einheit: 'px Reichweite',
    kurz: 'Feuerzunge aus dem Tor',
    lang: 'Feuerzunge über die Brücke. Getroffene verbrennen zu Asche und qualmen nach.'
  },
  {
    k: 'meteor', name: 'Meteoritenschauer', taste: '4', art: 'feuer',
    preis: 600, schaden: 50, abklingzeit: 50, wirkbereich: 11,
    schadenSchritt: 30, einheit: 'px Einschlag',
    kurz: '6 Sekunden Steinregen',
    lang: 'Sechs Sekunden Steinregen über der Brücke. Getroffene verbrennen zu Asche.'
  }
];

/** Preis des Morgenrituals — startet die Welle nachts von selbst. */
export const RITUAL_PREIS = 400;

/** Kürzeste erreichbare Abklingzeit, als Anteil des Grundwerts. */
const ABKLING_BODEN = 0.35;

/* ---------------- Leere Stufen ---------------- */

export const STUFEN_GROMMSCH_LEER = { klauen: 0, hallen: 0, schuetze: 0, pfeile: 0, schlund: 0, krit: 0, putztrupp: 0 };
export const STUFEN_PIPS_LEER = { sammler: 0, schatzjaeger: 0, stolz: 0, ernte: 0 };

export function zauberStufenLeer() {
  const o = {};
  for (const z of ZAUBER) o[z.k] = { gelernt: 0, schaden: 0, abklingzeit: 0, wirkbereich: 0 };
  return o;
}

/* ---------------- Abgeleitete Werte ---------------- */

/**
 * Wie schnell die Fresszeit abläuft, als Faktor.
 *
 * Seit 0.10.0 zählt nicht mehr Leben herunter, sondern eine **Zeit**:
 * Jede Klasse bringt ihre eigene `fressZeit` mit (siehe
 * `spiel/daten/recken.js`), und dieser Faktor bestimmt, wie schnell sie
 * abläuft. 1 heißt Sekunde für Sekunde, 2 doppelt so schnell.
 *
 * Vorher hing die Verdauzeit an den Lebenspunkten. Das koppelte
 * Zähigkeit und Durchsatz aneinander und ließ Bosse ins Unspielbare
 * wachsen — gemessen am 28.08.2026 brauchte ein Boss auf Welle 20
 * 1.011 Sekunden reine Fresszeit.
 */
export const FRESSTEMPO = 1;

/**
 * Alles, was sich aus den gekauften Stufen ergibt.
 *
 * `fressTempo` ist der Faktor auf die Fresszeit — höher heißt schneller
 * durch; `kapazitaet` die Zahl der Recken, die gleichzeitig in der Burg
 * sein dürfen. Wird sie überschritten, ist die Welle verloren.
 *
 * `wirkung` ist die Summe der ausgerüsteten Artefakte (siehe
 * `spiel/artefakte.js`) und optional — ohne Regal rechnet alles wie
 * vorher.
 */
export function werte(stufenG, stufenP, wirkung) {
  const a = wirkung || null;
  const fress = 1 + 0.015 * stufenG.klauen + (a ? a.fressBonus / 100 : 0);
  return {
    fressTempo: FRESSTEMPO * fress,
    kapazitaet: 3 + stufenG.hallen + (a ? a.kapazitaet : 0),
    // Wie viele Recken gleichzeitig gefressen werden. Der Rest wartet in
    // der Schlange — Kapazität ist der Puffer, der Schlund der Durchsatz.
    schlund: 1 + (stufenG.schlund || 0) + (a ? a.schlund : 0),
    schuetzen: stufenG.schuetze,
    // Wie viele Goblins wischen und wie flink sie sind.
    wischer: 1 + (stufenG.putztrupp || 0),
    wischTempo: 34 + 12 * (stufenG.putztrupp || 0),
    pfeilSchaden: 10 + 10 * stufenG.pfeile,
    schuetzenKrit: 0.06 * (stufenG.krit || 0),
    stolzFaktor: 1 + 0.25 * stufenP.stolz,
    ernteFaktor: 1.5 * (1 + 0.5 * stufenP.ernte),
    // Chance des Drachlings, eine Münze doppelt zu werten.
    doppelGold: 0.01 * stufenP.sammler,
    // Gierschimmer macht jede Münze mehr wert.
    muenzFaktor: 1 + (a ? a.muenzWert / 100 : 0),
    // Chance in Prozent, dass ein Toter ein Artefakt fallen lässt.
    fundchance: 0.05 + 0.1 * (stufenP.schatzjaeger || 0) + (a ? a.fundchance : 0),
    wirkung: a
  };
}

/* ---------------- Wie die Wellen von selbst wachsen ---------------- */

/** Deckel, damit das Spiel nicht mechanisch unspielbar wird. */
export const TEMPO_DECKEL = 1.5;

/**
 * Was die Welle selbst mitbringt — ohne dass der Spieler etwas kauft.
 *
 * Vier Schrauben zugleich: mehr Gegner, zäher, schneller, und alle fünf
 * Wellen kommen sie im Trupp statt einzeln. Die Truppgröße ist die
 * eigentliche Härte und hat **keinen Deckel**: Der Spawn-Abstand wächst
 * mit, die Gesamtmenge bleibt also gleich — aber die Spitzenlast am Tor
 * steigt ohne Ende. Genau das macht Schlund und Kapazität wertvoll.
 */
export function wellenSkalierung(welle) {
  return {
    lpFaktor: Math.pow(1.05, welle - 1),
    tempoFaktor: Math.min(TEMPO_DECKEL, 1 + 0.01 * (welle - 1)),
    truppGroesse: 1 + Math.floor(welle / 5)
  };
}

/**
 * Wie viele Recken eine Welle mitbringt.
 *
 * Wächst um 16 % je Welle und ist bei 80 gedeckelt — sonst würde die
 * Bildfläche irgendwann sinnlos volllaufen, ohne dass das Spiel dadurch
 * interessanter wird. In einer Bosswelle kommt nur halbes Gefolge, dafür
 * der Boss.
 */
export function wellenStaerke(welle) {
  const roh = Math.min(80, Math.round(5 * Math.pow(1.16, welle - 1)));
  return istBosswelle(welle) ? Math.max(2, Math.round(roh / 2)) : roh;
}

/** Abstand zwischen zwei Trupps derselben Welle, in Sekunden. */
export function spawnAbstand(welle) {
  const grund = Math.max(0.85, 2.7 - welle * 0.06);
  // Der Abstand wächst mit der Truppgröße, damit die Gesamtmenge stimmt.
  return grund * wellenSkalierung(welle).truppGroesse;
}

/** Welche Klassen in dieser Welle überhaupt auftauchen können. */
export function verfuegbareKlassen(recken, welle) {
  return recken.filter((c) => welle >= c.abWelle);
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

/* ---------------- Bosse ---------------- */

/**
 * Wie selten ein Boss kommt.
 *
 * Alle zehn Wellen. Die Zahl steht bewusst als eine einzige Konstante
 * hier — sie ist der Taktgeber des ganzen Spiels und soll sich an einer
 * Stelle ändern lassen.
 */
export const BOSS_ABSTAND = 10;

export function istBosswelle(welle) {
  return welle >= BOSS_ABSTAND && welle % BOSS_ABSTAND === 0;
}

/**
 * Der Boss ist keine Mahlzeit mehr, sondern eine Frist.
 *
 * **Betritt er das Tor, ist die Burg sofort verloren.** Er wird also
 * nicht verdaut, er muss auf der Brücke sterben. Damit hängt seine
 * Schwierigkeit nicht mehr an Kapazität und Schlund, sondern allein an
 * der Frage: Reicht der Schaden, bevor er ankommt?
 *
 * Daraus folgt die Auslegung:
 *
 * - **Er geht langsam** (ein Drittel des Grundtempos). Über die knapp
 *   320 Bildpunkte der Brücke bleiben so gut 45 Sekunden Zeit.
 * - **Sein Leben ist an die Welle gekoppelt, nicht an eine Klasse.**
 *   `lpFaktor` mal dem Leben eines gewöhnlichen Recken derselben Welle.
 *   Vorher waren es 25 mal dem *stärksten* Rang, was mit jeder
 *   Klassenfreischaltung zusätzlich sprang — bei Welle 20 kamen so
 *   10.108 Lebenspunkte zusammen. Jetzt wächst er mit derselben Kurve
 *   wie alles andere und bleibt im Verhältnis gleich schwer.
 * - **Er wirft viel ab**, weil er der einzige seiner Art ist.
 */
export const BOSS = {
  // Fünf mal dem stärksten Rang sind rund 40 Bauern derselben Welle.
  // Bei 80 Sekunden Laufzeit muss der Spieler also etwa einen halben
  // Bauern je Sekunde umlegen — das schafft, wer die Welle davor
  // überstanden hat, und es ist keine Formsache.
  lpFaktor: 5,
  // Auf der breiteren Bühne (635 px Weg) ergeben 0,6 des Grundtempos
  // rund 88 Sekunden Zeit zum Töten. Mit dem alten Drittel wären es
  // 160 Sekunden gewesen — zu träge, um spannend zu bleiben.
  tempoFaktor: 0.6,
  goldFaktor: 40,
  groesse: 2
};

/* ---------------- Zauberwerte ---------------- */

/** Werte eines Zaubers auf seinen aktuellen Stufen. */
export function zauberWerte(zauber, stufe) {
  return {
    gelernt: stufe.gelernt >= 1,
    art: zauber.art,
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
 * Genau eine Fassung, keine Spielarten mehr. Er wird bei Malvina gekauft
 * und verhält sich wie ein Zauber — Abklingzeit, Schaden, kritische
 * Treffer. Drei Achsen: Schaden, Abklingzeit, Krit.
 */
export const KLICK = {
  name: 'Berührung des Bösen',
  preis: 10,
  art: 'physisch',
  schaden: 10,       // je Schadensstufe +10
  schadenSchritt: 10,
  abklingzeit: 2,
  krit: 0.05,        // je Kritstufe +4 %
  kritSchritt: 0.04,
  kurz: 'Dein Klick verwundet Recken',
  lang: 'Ein Klick auf einen Recken verwundet ihn. Kritische Treffer machen doppelten Schaden.'
};

export function klickStufenLeer() {
  return { gekauft: 0, schaden: 0, abklingzeit: 0, krit: 0 };
}

/** Die Werte des Klicks auf seinen aktuellen Stufen. */
export function klickWerte(klick, wirkung) {
  const a = wirkung || null;
  const abkling = Math.max(
    KLICK.abklingzeit * ABKLING_BODEN,
    KLICK.abklingzeit * Math.pow(0.88, klick.abklingzeit)
  ) * (a ? 1 - Math.min(0.6, a.klickAbkling / 100) : 1);
  return {
    gekauft: klick.gekauft >= 1,
    art: KLICK.art,
    schaden: KLICK.schaden + KLICK.schadenSchritt * klick.schaden,
    abklingzeit: abkling,
    krit: Math.min(0.9, KLICK.krit + KLICK.kritSchritt * klick.krit + (a ? a.krit / 100 : 0))
  };
}

/** Preis der nächsten Stufe auf einer Klick-Achse. */
export function klickAusbauPreis(stufe) {
  return Math.round(4 * Math.pow(1.6, stufe));
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
