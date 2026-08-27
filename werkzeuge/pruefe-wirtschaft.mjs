// Prüft die Rechenregeln des Spiels — ohne Browser, ohne Zeichnen.
//
//   node werkzeuge/pruefe-wirtschaft.mjs
//
// Geprüft wird nicht, ob das Spiel Spaß macht, sondern ob die Zahlen sich
// so verhalten, wie sie sollen: Preise steigen, Deckel greifen, nichts
// wird negativ, nichts läuft ins Unendliche.

import {
  WAREN_GROMMSCH, WAREN_PIPS, ZAUBER, RITUAL_PREIS,
  STUFEN_GROMMSCH_LEER, STUFEN_PIPS_LEER, zauberStufenLeer,
  werte, wellenStaerke, spawnAbstand, verfuegbareKlassen, klassenGewichte,
  zauberWerte, ausbauPreis, rueckfall, zahl
} from './wirtschaft.mjs';
import { RECKEN } from '../spiel/daten/recken.js';

let geprueft = 0;
let fehler = 0;

function pruefe(bedingung, was) {
  geprueft++;
  if (bedingung) return;
  fehler++;
  console.log('  FEHLER: ' + was);
}

function gleich(a, b, was) {
  pruefe(a === b, was + ' — erwartet ' + b + ', bekommen ' + a);
}

function nahe(a, b, was, spielraum = 1e-9) {
  pruefe(Math.abs(a - b) <= spielraum, was + ' — erwartet ~' + b + ', bekommen ' + a);
}

/* ---------------- Preise ---------------- */

console.log('Preise der Händlerwaren');
for (const [name, waren] of [['Grommsch', WAREN_GROMMSCH], ['Pips', WAREN_PIPS]]) {
  for (const ware of waren) {
    let vorher = -1;
    for (let stufe = 0; stufe < 12; stufe++) {
      const preis = ware.preis(stufe);
      pruefe(Number.isFinite(preis), name + '/' + ware.k + ' Stufe ' + stufe + ': Preis ist eine Zahl');
      pruefe(Number.isInteger(preis), name + '/' + ware.k + ' Stufe ' + stufe + ': Preis ist ganzzahlig');
      pruefe(preis > 0, name + '/' + ware.k + ' Stufe ' + stufe + ': Preis ist positiv');
      pruefe(preis > vorher, name + '/' + ware.k + ' Stufe ' + stufe + ': Preis steigt');
      vorher = preis;
    }
    // Der erste Preis muss bezahlbar wirken
    pruefe(ware.preis(0) <= 40, name + '/' + ware.k + ': Einstiegspreis unter 40');
  }
}

console.log('Höchststufen und Bedingungen');
gleich(WAREN_GROMMSCH.find((w) => w.k === 'schuetze').max, 4, 'Höchstens 4 Bogenschützen');
gleich(WAREN_PIPS.find((w) => w.k === 'koeder').max, 3, 'Höchstens 3 Stufen Köder');
gleich(WAREN_PIPS.find((w) => w.k === 'sammler').max, 3, 'Höchstens 3 Drachlinge');
const pfeile = WAREN_GROMMSCH.find((w) => w.k === 'pfeile');
pruefe(pfeile.bedingung({ ...STUFEN_GROMMSCH_LEER }) === false, 'Pfeile ohne Schützen gesperrt');
pruefe(pfeile.bedingung({ ...STUFEN_GROMMSCH_LEER, schuetze: 1 }) === true, 'Pfeile mit Schütze frei');

/* ---------------- Abgeleitete Werte ---------------- */

console.log('Werte aus den Stufen');
const leer = werte({ ...STUFEN_GROMMSCH_LEER }, { ...STUFEN_PIPS_LEER });
gleich(leer.kapazitaet, 3, 'Grundkapazität ist 3');
nahe(leer.angriff, 1, 'Grundangriff ist 1');
gleich(leer.schuetzen, 0, 'Anfangs keine Schützen');
gleich(leer.pfeilSchaden, 1, 'Pfeilschaden ohne Ausbau ist 1');
nahe(leer.tempoFaktor, 1, 'Tempofaktor ohne Marschmusik ist 1');
nahe(leer.stolzFaktor, 1, 'Stolzfaktor ohne Ausbau ist 1');
nahe(leer.ernteFaktor, 1.5, 'Besondere Tode bringen von Haus aus das Anderthalbfache');

const voll = werte(
  { klauen: 3, hallen: 4, schuetze: 4, pfeile: 2 },
  { lockruf: 2, marsch: 2, koeder: 1, sammler: 1, stolz: 2, ernte: 1 }
);
gleich(voll.kapazitaet, 7, 'Vier Stufen Hallen ergeben Kapazität 7');
nahe(voll.angriff, Math.pow(1.28, 3), 'Angriff wächst mit 1,28 je Stufe');
gleich(voll.schuetzen, 4, 'Vier Schützen');
gleich(voll.pfeilSchaden, 3, 'Zwei Stufen Pfeile ergeben Schaden 3');
nahe(voll.tempoFaktor, 1.26, 'Zwei Stufen Marschmusik ergeben +26 %');
nahe(voll.stolzFaktor, 1.5, 'Zwei Stufen Stolz ergeben +50 %');

pruefe(werte({ ...STUFEN_GROMMSCH_LEER, klauen: 40 }, { ...STUFEN_PIPS_LEER }).angriff > 0,
  'Angriff bleibt auch bei Stufe 40 endlich und positiv');

/* ---------------- Wellen ---------------- */

console.log('Wellenstärke');
gleich(wellenStaerke(1), 5, 'Welle 1 bringt 5 Recken');
pruefe(wellenStaerke(2) > wellenStaerke(1), 'Welle 2 ist größer als Welle 1');
gleich(wellenStaerke(200), 80, 'Deckel bei 80 greift');
gleich(wellenStaerke(1000), 80, 'Deckel hält auch weit oben');
let vorherige = 0;
for (let w = 1; w <= 60; w++) {
  const n = wellenStaerke(w);
  pruefe(n >= vorherige, 'Welle ' + w + ': Stärke fällt nie');
  pruefe(n <= 80, 'Welle ' + w + ': Stärke bleibt unter dem Deckel');
  pruefe(Number.isInteger(n), 'Welle ' + w + ': Stärke ist ganzzahlig');
  vorherige = n;
}
pruefe(wellenStaerke(10, 3) > wellenStaerke(10, 0), 'Lockrufe vergrößern die Welle');

console.log('Abstand zwischen zwei Recken');
nahe(spawnAbstand(1), 2.64, 'Welle 1: knapp 2,6 Sekunden Abstand', 1e-9);
gleich(spawnAbstand(100), 0.85, 'Der Abstand fällt nie unter 0,85 Sekunden');
for (let w = 1; w <= 60; w++) {
  pruefe(spawnAbstand(w) >= 0.85, 'Welle ' + w + ': Abstand über dem Boden');
}

console.log('Verfügbare Klassen');
gleich(verfuegbareKlassen(RECKEN, 1).length, 1, 'In Welle 1 nur Bauern');
gleich(verfuegbareKlassen(RECKEN, 3).length, 2, 'Ab Welle 3 kommt der Söldner dazu');
gleich(verfuegbareKlassen(RECKEN, 18).length, 5, 'Ab Welle 18 sind alle fünf da');
pruefe(verfuegbareKlassen(RECKEN, 6, 3).length > verfuegbareKlassen(RECKEN, 6, 0).length,
  'Der Köder holt höhere Ränge früher');
for (let w = 1; w <= 40; w++) {
  const k = verfuegbareKlassen(RECKEN, w);
  pruefe(k.length >= 1, 'Welle ' + w + ': mindestens eine Klasse verfügbar');
  pruefe(k[0].id === 'bauer', 'Welle ' + w + ': der Bauer verschwindet nie');
}

console.log('Klassengewichte');
for (const w of [1, 5, 20, 60]) {
  const klassen = verfuegbareKlassen(RECKEN, w);
  const g = klassenGewichte(klassen, w);
  gleich(g.length, klassen.length, 'Welle ' + w + ': ein Gewicht je Klasse');
  pruefe(g.every((x) => x > 0 && Number.isFinite(x)), 'Welle ' + w + ': alle Gewichte positiv');
  for (let i = 1; i < g.length; i++) {
    pruefe(g[i] > g[i - 1], 'Welle ' + w + ': höherer Rang wiegt schwerer als Rang ' + i);
  }
}

/* ---------------- Zauber ---------------- */

console.log('Zauberwerte');
const stufenLeer = zauberStufenLeer();
gleich(Object.keys(stufenLeer).length, 4, 'Es gibt vier Zauber');
for (const z of ZAUBER) {
  const s0 = stufenLeer[z.k];
  const w0 = zauberWerte(z, s0);
  pruefe(w0.gelernt === false, z.name + ': anfangs nicht gelernt');
  gleich(w0.schaden, z.schaden, z.name + ': Grundschaden');
  nahe(w0.abklingzeit, z.abklingzeit, z.name + ': Grundabklingzeit');
  gleich(w0.wirkbereich, z.wirkbereich, z.name + ': Grundwirkbereich');

  // Schaden steigt gleichmäßig
  for (let st = 1; st <= 8; st++) {
    const w = zauberWerte(z, { ...s0, schaden: st });
    gleich(w.schaden, z.schaden + z.schadenSchritt * st, z.name + ': Schaden auf Stufe ' + st);
  }
  // Abklingzeit fällt, aber nur bis zum Boden
  let letzte = Infinity;
  for (let st = 0; st <= 30; st++) {
    const w = zauberWerte(z, { ...s0, abklingzeit: st });
    pruefe(w.abklingzeit <= letzte + 1e-9, z.name + ': Abklingzeit steigt nie, Stufe ' + st);
    pruefe(w.abklingzeit >= z.abklingzeit * 0.35 - 1e-9,
      z.name + ': Abklingzeit fällt nicht unter 35 %, Stufe ' + st);
    letzte = w.abklingzeit;
  }
  nahe(zauberWerte(z, { ...s0, abklingzeit: 99 }).abklingzeit, z.abklingzeit * 0.35,
    z.name + ': Boden der Abklingzeit wird erreicht');
  // Wirkbereich wächst
  let vorherB = 0;
  for (let st = 0; st <= 10; st++) {
    const w = zauberWerte(z, { ...s0, wirkbereich: st });
    pruefe(w.wirkbereich >= vorherB, z.name + ': Wirkbereich fällt nie, Stufe ' + st);
    pruefe(Number.isInteger(w.wirkbereich), z.name + ': Wirkbereich ist ganzzahlig, Stufe ' + st);
    vorherB = w.wirkbereich;
  }
}

console.log('Ausbaupreise');
for (const z of ZAUBER) {
  let vorherP = -1;
  for (let st = 0; st < 10; st++) {
    const p = ausbauPreis(z, st);
    pruefe(Number.isInteger(p) && p > 0, z.name + ': Ausbaupreis Stufe ' + st + ' ist positiv und ganzzahlig');
    pruefe(p > vorherP, z.name + ': Ausbaupreis steigt, Stufe ' + st);
    vorherP = p;
  }
  pruefe(ausbauPreis(z, 0) < z.preis, z.name + ': die erste Verbesserung kostet weniger als der Zauber selbst');
}

console.log('Reihenfolge der Zauber');
for (let i = 1; i < ZAUBER.length; i++) {
  pruefe(ZAUBER[i].preis > ZAUBER[i - 1].preis, ZAUBER[i].name + ' kostet mehr als ' + ZAUBER[i - 1].name);
}
gleich(ZAUBER.map((z) => z.taste).join(''), '1234', 'Die Tasten sind 1 bis 4');
pruefe(RITUAL_PREIS > 0, 'Das Morgenritual hat einen Preis');

/* ---------------- Rückfall ---------------- */

console.log('Rückfall nach einer Niederlage');
gleich(rueckfall(20), 15, 'Welle 20 fällt auf 15');
gleich(rueckfall(6), 1, 'Welle 6 fällt auf 1');
gleich(rueckfall(3), 1, 'Welle 3 fällt nicht unter 1');
gleich(rueckfall(1), 1, 'Welle 1 bleibt 1');
for (let w = 1; w <= 100; w++) {
  pruefe(rueckfall(w) >= 1, 'Welle ' + w + ': Rückfall nie unter 1');
  pruefe(rueckfall(w) <= w, 'Welle ' + w + ': Rückfall geht nie nach vorn');
}

/* ---------------- Zahlen ---------------- */

console.log('Zahlendarstellung');
gleich(zahl(0), '0', 'Null');
gleich(zahl(-5), '0', 'Negatives wird zu Null');
gleich(zahl(7), '7', 'Kleine Zahl');
gleich(zahl(999), '999', 'Knapp unter tausend');
gleich(zahl(1000), '1,00 k', 'Tausend');
gleich(zahl(1234), '1,23 k', 'Tausendertrennung mit Komma');
gleich(zahl(1e6), '1,00 Mio', 'Million');
gleich(zahl(1e9), '1,00 Mrd', 'Milliarde');
gleich(zahl(1e12), '1,00 Bio', 'Billion');
gleich(zahl(NaN), '0', 'Keine Zahl ergibt Null');
gleich(zahl(Infinity), '0', 'Unendlich ergibt Null');
pruefe(zahl(12345).indexOf('.') < 0, 'Kein englischer Dezimalpunkt');

/* ---------------- Reckenklassen ---------------- */

console.log('Reckenklassen');
gleich(RECKEN.length, 5, 'Fünf Klassen');
for (let i = 1; i < RECKEN.length; i++) {
  const a = RECKEN[i - 1];
  const b = RECKEN[i];
  pruefe(b.abWelle > a.abWelle, b.name + ' erscheint später als ' + a.name);
  pruefe(b.lp > a.lp, b.name + ' hat mehr Lebenspunkte als ' + a.name);
  pruefe(b.blut > a.blut, b.name + ' bringt mehr Blut als ' + a.name);
  pruefe(b.gold > a.gold, b.name + ' bringt mehr Gold als ' + a.name);
  pruefe(b.schrott > a.schrott, b.name + ' bringt mehr Schrott als ' + a.name);
  pruefe(b.hoehe > a.hoehe, b.name + ' ist größer als ' + a.name);
}

// Tempo: Der Söldner ist die bewusste Ausnahme — er ist mit 24 schneller
// als der Bauer mit 20 und rennt am eifrigsten ins Tor. Ab dem Söldner
// wird jede Klasse langsamer, weil die Rüstung schwerer wird.
gleich(RECKEN[0].tempo, 20, 'Bauer läuft mit Tempo 20');
gleich(RECKEN[1].tempo, 24, 'Der Söldner ist der schnellste Recke');
for (let i = 2; i < RECKEN.length; i++) {
  pruefe(RECKEN[i].tempo < RECKEN[i - 1].tempo,
    RECKEN[i].name + ' ist langsamer als ' + RECKEN[i - 1].name);
}
pruefe(RECKEN[RECKEN.length - 1].tempo < RECKEN[0].tempo,
  'Der Großmeister ist langsamer als der Bauer');
for (const k of RECKEN) {
  pruefe(k.helm || k.kopf, k.name + ': hat entweder Helm oder Kopffarbe');
  pruefe(k.lp > 0 && k.tempo > 0 && k.blut > 0, k.name + ': Grundwerte positiv');
}

/* ---------------- Ergebnis ---------------- */

console.log('');
console.log('  ' + geprueft + ' Prüfungen, ' + fehler + ' Fehler');
if (fehler > 0) process.exit(1);
console.log('  Alles in Ordnung.');
