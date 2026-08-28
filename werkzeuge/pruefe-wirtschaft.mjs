// Prüft die Rechenregeln des Spiels — ohne Browser, ohne Zeichnen.
//
//   node werkzeuge/pruefe-wirtschaft.mjs
//
// Geprüft wird nicht, ob das Spiel Spaß macht, sondern ob die Zahlen sich
// so verhalten, wie sie sollen: Preise steigen, Deckel greifen, nichts
// wird negativ, nichts läuft ins Unendliche.

import {
  WAREN_GROMMSCH, WAREN_PIPS, ZAUBER, RITUAL_PREIS, KLICK,
  STUFEN_GROMMSCH_LEER, STUFEN_PIPS_LEER, zauberStufenLeer, klickStufenLeer,
  werte, wellenStaerke, spawnAbstand, verfuegbareKlassen, klassenGewichte,
  zauberWerte, ausbauPreis, klickWerte, klickAusbauPreis, rueckfall, zahl,
  SCHADENSARTEN, schadensFarbe, HALLEN_AB_WELLE, FRESSTEMPO, TEMPO_DECKEL,
  wellenSkalierung, istBosswelle, BOSS
} from './wirtschaft.mjs';
import { leereWirkung } from '../spiel/artefakte.js';
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
    // Der erste Preis muss bezahlbar wirken -- mit zwei gewollten Ausnahmen.
    // "Weite Hallen" ist seit 0.7.0 bewusst teuer und erst ab Welle 8 zu
    // haben (400 G); "Schatzjaeger" ist Luxus und darf spaet kommen (50 G).
    const teuerErlaubt = ware.k === 'hallen' || ware.k === 'schatzjaeger';
    pruefe(ware.preis(0) <= (teuerErlaubt ? 400 : 40),
      name + '/' + ware.k + ': Einstiegspreis im Rahmen (' + ware.preis(0) + ')');
  }
}

console.log('Höchststufen und Bedingungen');
gleich(WAREN_GROMMSCH.find((w) => w.k === 'schuetze').max, 4, 'Höchstens 4 Bogenschützen');
gleich(WAREN_PIPS.find((w) => w.k === 'schatzjaeger').max, 10, 'Schatzjäger geht bis Stufe 10');
gleich(WAREN_PIPS.find((w) => w.k === 'sammler').max, 10, 'Drachling geht bis Stufe 10');
gleich(WAREN_GROMMSCH.find((w) => w.k === 'schlund').max, 4, 'Höchstens 4 Stufen Schlund');
gleich(WAREN_GROMMSCH.find((w) => w.k === 'krit').max, 5, 'Höchstens 5 Stufen Zielwasser');
const zielwasser = WAREN_GROMMSCH.find((w) => w.k === 'krit');
pruefe(zielwasser.bedingung({ ...STUFEN_GROMMSCH_LEER }) === false, 'Zielwasser ohne Schützen gesperrt');
pruefe(zielwasser.bedingung({ ...STUFEN_GROMMSCH_LEER, schuetze: 1 }) === true, 'Zielwasser mit Schütze frei');
const pfeile = WAREN_GROMMSCH.find((w) => w.k === 'pfeile');
pruefe(pfeile.bedingung({ ...STUFEN_GROMMSCH_LEER }) === false, 'Pfeile ohne Schützen gesperrt');
pruefe(pfeile.bedingung({ ...STUFEN_GROMMSCH_LEER, schuetze: 1 }) === true, 'Pfeile mit Schütze frei');

// Hallen sind teuer und kommen bewusst spaet (0.7.0): vor Welle 8 gesperrt.
const hallen = WAREN_GROMMSCH.find((w) => w.k === 'hallen');
gleich(HALLEN_AB_WELLE, 8, 'Hallen erst ab Welle 8');
if (typeof hallen.bedingung === 'function') {
  pruefe(hallen.bedingung({ ...STUFEN_GROMMSCH_LEER }, 1) === false, 'Hallen in Welle 1 gesperrt');
  pruefe(hallen.bedingung({ ...STUFEN_GROMMSCH_LEER }, HALLEN_AB_WELLE) === true,
    'Hallen ab Welle ' + HALLEN_AB_WELLE + ' frei');
}

/* ---------------- Abgeleitete Werte ---------------- */

console.log('Werte aus den Stufen');
const leer = werte({ ...STUFEN_GROMMSCH_LEER }, { ...STUFEN_PIPS_LEER });
gleich(leer.kapazitaet, 3, 'Grundkapazität ist 3');
gleich(FRESSTEMPO, 10, 'Grundfresstempo ist 10 LP/s (Rebasierung mal 10)');
nahe(leer.angriff, 10, 'Grundangriff ist 10 LP/s');
gleich(leer.schuetzen, 0, 'Anfangs keine Schützen');
gleich(leer.pfeilSchaden, 10, 'Pfeilschaden ohne Ausbau ist 10');
nahe(leer.stolzFaktor, 1, 'Stolzfaktor ohne Ausbau ist 1');
nahe(leer.ernteFaktor, 1.5, 'Besondere Tode bringen von Haus aus das Anderthalbfache');
nahe(leer.muenzFaktor, 1, 'Ohne Artefakte ist jede Münze normal wert');
nahe(leer.fundchance, 0.05, 'Grundfundchance ist 0,05 %');

const voll = werte(
  { ...STUFEN_GROMMSCH_LEER, klauen: 3, hallen: 4, schuetze: 4, pfeile: 2 },
  { ...STUFEN_PIPS_LEER, sammler: 1, stolz: 2, ernte: 1 }
);
gleich(voll.kapazitaet, 7, 'Vier Stufen Hallen ergeben Kapazität 7');
nahe(voll.angriff, FRESSTEMPO * (1 + 0.015 * 3), 'Klauen geben 1,5 % je Stufe');
gleich(voll.schuetzen, 4, 'Vier Schützen');
gleich(voll.pfeilSchaden, 30, 'Zwei Stufen Pfeile ergeben Schaden 30');
nahe(voll.stolzFaktor, 1.5, 'Zwei Stufen Stolz ergeben +50 %');

pruefe(werte({ ...STUFEN_GROMMSCH_LEER, klauen: 40 }, { ...STUFEN_PIPS_LEER }).angriff > 0,
  'Angriff bleibt auch bei Stufe 40 endlich und positiv');

gleich(leer.schlund, 1, 'Ohne Ausbau frisst das Monster einen zugleich');
gleich(werte({ ...STUFEN_GROMMSCH_LEER, schlund: 3 }, { ...STUFEN_PIPS_LEER }).schlund, 4,
  'Drei Stufen Schlund ergeben vier Mäuler');
nahe(leer.schuetzenKrit, 0, 'Ohne Zielwasser kein Schützen-Krit');
nahe(werte({ ...STUFEN_GROMMSCH_LEER, krit: 5 }, { ...STUFEN_PIPS_LEER }).schuetzenKrit, 0.3,
  'Fünf Stufen Zielwasser ergeben 30 % Krit');
nahe(leer.doppelGold, 0, 'Ohne Drachling kein Doppelgold');
nahe(werte({ ...STUFEN_GROMMSCH_LEER }, { ...STUFEN_PIPS_LEER, sammler: 10 }).doppelGold, 0.1,
  'Zehn Drachling-Stufen ergeben 10 % Doppelgold');
nahe(werte({ ...STUFEN_GROMMSCH_LEER }, { ...STUFEN_PIPS_LEER, schatzjaeger: 10 }).fundchance, 1.05,
  'Zehn Schatzjäger-Stufen ergeben 1,05 % Fundchance');

// Eine Waehrung: Blut und Schrott sind seit 0.7.0 keine Zahlungsmittel mehr,
// Lockruf und Marschmusik gestrichen. Die Felder duerfen nicht zurueckkehren.
for (const feld of ['blut', 'schrott', 'blutFaktor', 'schrottFaktor', 'tempoFaktor']) {
  pruefe(leer[feld] === undefined, 'werte() kennt kein Feld "' + feld + '" mehr');
}
for (const weg of ['lockruf', 'marsch', 'koeder']) {
  pruefe(!WAREN_PIPS.some((w) => w.k === weg), 'Ware "' + weg + '" ist gestrichen');
}

console.log('Artefakt-Wirkung fliesst in die Werte ein');
{
  const w = leereWirkung();
  w.kapazitaet = 2; w.schlund = 1; w.fressBonus = 50; w.muenzWert = 20; w.fundchance = 0.5;
  const mit = werte({ ...STUFEN_GROMMSCH_LEER }, { ...STUFEN_PIPS_LEER }, w);
  gleich(mit.kapazitaet, 5, 'Artefakte erhöhen die Kapazität');
  gleich(mit.schlund, 2, 'Artefakte geben ein zweites Maul');
  nahe(mit.angriff, FRESSTEMPO * 1.5, 'Eisenmagen wirkt auf das Fresstempo');
  nahe(mit.muenzFaktor, 1.2, 'Gierschimmer macht Münzen wertvoller');
  nahe(mit.fundchance, 0.55, 'Spürnase erhöht die Fundchance');
  pruefe(mit.wirkung === w, 'Die Wirkung wird durchgereicht');
  const ohne = werte({ ...STUFEN_GROMMSCH_LEER }, { ...STUFEN_PIPS_LEER });
  nahe(ohne.angriff, FRESSTEMPO, 'Ohne Artefakte bleibt der Grundwert');
  gleich(ohne.wirkung, null, 'Ohne Regal ist die Wirkung null');
}

console.log('Schadensarten');
gleich(Object.keys(SCHADENSARTEN).length, 5, 'Fünf Schadensarten');
for (const art of ['physisch', 'feuer', 'eis', 'gift', 'blitz']) {
  pruefe(Boolean(SCHADENSARTEN[art]), 'Schadensart ' + art + ' gibt es');
  pruefe(typeof schadensFarbe(art, false) === 'string', 'Schadensart ' + art + ' hat eine Farbe');
  pruefe(schadensFarbe(art, true) !== schadensFarbe(art, false),
    'Krit sieht anders aus als ein normaler Treffer (' + art + ')');
}

/* ---------------- Der Klick ---------------- */

console.log('Der Klick als Fähigkeit');
{
  const leer0 = klickStufenLeer();
  gleich(leer0.gekauft, 0, 'Anfangs nicht gekauft');

  // Seit 0.7.0 gibt es genau EINE Fassung. Midas, Inferno und Faust des
  // Titanen sind gestrichen und kommen nicht zurueck (Entscheidung Jannik).
  pruefe(leer0.aktiv === undefined, 'Keine Spielart mehr im Stufenobjekt');
  gleich(Object.keys(leer0).sort().join(','), 'abklingzeit,gekauft,krit,schaden',
    'Drei Achsen plus gekauft, sonst nichts');

  const w0 = klickWerte(leer0);
  gleich(w0.gekauft, false, 'Werte melden: nicht gekauft');
  gleich(w0.schaden, 10, 'Grundschaden ist 10 (Rebasierung mal 10)');
  nahe(w0.abklingzeit, 2, 'Grundabklingzeit ist 2 s');
  nahe(w0.krit, 0.05, 'Grundkrit ist 5 %');
  gleich(w0.art, 'physisch', 'Der Klick schlägt physisch zu');
  for (const weg of ['titanSchaden', 'titanAbklingzeit', 'midasGold', 'infernoSchaden']) {
    pruefe(w0[weg] === undefined, 'klickWerte kennt kein Feld "' + weg + '" mehr');
  }

  // Schaden steigt um 10 je Stufe
  for (let st = 1; st <= 8; st++) {
    const w = klickWerte({ ...leer0, schaden: st });
    gleich(w.schaden, 10 + 10 * st, 'Klickschaden Stufe ' + st);
  }
  // Abklingzeit faellt bis zum Boden
  let letzteCd = Infinity;
  for (let st = 0; st <= 30; st++) {
    const w = klickWerte({ ...leer0, abklingzeit: st });
    pruefe(w.abklingzeit <= letzteCd + 1e-9, 'Klick-Abklingzeit steigt nie, Stufe ' + st);
    pruefe(w.abklingzeit >= 2 * 0.35 - 1e-9, 'Klick-Abklingzeit hält den Boden, Stufe ' + st);
    letzteCd = w.abklingzeit;
  }
  // Krit steigt und ist gedeckelt
  let letzterKrit = 0;
  for (let st = 0; st <= 30; st++) {
    const w = klickWerte({ ...leer0, krit: st });
    pruefe(w.krit >= letzterKrit - 1e-9, 'Klick-Krit fällt nie, Stufe ' + st);
    pruefe(w.krit <= 0.9 + 1e-9, 'Klick-Krit ist bei 90 % gedeckelt, Stufe ' + st);
    letzterKrit = w.krit;
  }
  nahe(klickWerte({ ...leer0, krit: 99 }).krit, 0.9, 'Der Krit-Deckel wird erreicht');

  // Artefakte greifen auch am Klick an
  {
    const w = leereWirkung();
    w.klickAbkling = 30; w.krit = 20;
    const mit = klickWerte(leer0, w);
    nahe(mit.abklingzeit, 2 * 0.7, 'Schnelle Hand kürzt die Abklingzeit');
    nahe(mit.krit, 0.25, 'Kalte Präzision erhöht den Krit');
    const stark = leereWirkung();
    stark.klickAbkling = 999;
    pruefe(klickWerte(leer0, stark).abklingzeit >= 2 * 0.35 * 0.4 - 1e-9,
      'Auch mit Artefakten bleibt eine Restabklingzeit');
    const vielKrit = leereWirkung();
    vielKrit.krit = 999;
    nahe(klickWerte({ ...leer0, krit: 30 }, vielKrit).krit, 0.9,
      'Der Krit-Deckel gilt auch mit Artefakten');
  }

  // Ausbaupreise steigen
  let letzterPreis = -1;
  for (let st = 0; st < 10; st++) {
    const preis = klickAusbauPreis(st);
    pruefe(Number.isInteger(preis) && preis > 0, 'Klick-Ausbaupreis Stufe ' + st + ' positiv und ganz');
    pruefe(preis > letzterPreis, 'Klick-Ausbaupreis steigt, Stufe ' + st);
    letzterPreis = preis;
  }
  pruefe(klickAusbauPreis(0) < KLICK.preis, 'Die erste Stufe kostet weniger als der Kauf');
}

/* ---------------- Wellenskalierung und Bosse ---------------- */

console.log('Wie die Wellen von selbst wachsen');
{
  const s1 = wellenSkalierung(1);
  nahe(s1.lpFaktor, 1, 'Welle 1 hat keinen Lebensaufschlag');
  nahe(s1.tempoFaktor, 1, 'Welle 1 hat kein Tempoplus');
  gleich(s1.truppGroesse, 1, 'Welle 1 kommt einzeln');

  nahe(wellenSkalierung(11).lpFaktor, Math.pow(1.05, 10), 'Leben wachsen mit 1,05 je Welle');

  // Tempo ist gedeckelt, Truppgroesse bewusst NICHT.
  gleich(TEMPO_DECKEL, 1.5, 'Tempodeckel liegt bei +50 %');
  for (const w of [50, 200, 1000]) {
    pruefe(wellenSkalierung(w).tempoFaktor <= TEMPO_DECKEL + 1e-9,
      'Tempo bleibt gedeckelt, Welle ' + w);
  }
  gleich(wellenSkalierung(5).truppGroesse, 2, 'Ab Welle 5 kommen sie zu zweit');
  gleich(wellenSkalierung(50).truppGroesse, 11, 'Welle 50: elf auf einmal');
  pruefe(wellenSkalierung(500).truppGroesse > wellenSkalierung(100).truppGroesse,
    'Die Truppgröße hat bewusst KEINEN Deckel');

  // Lebenspunkte und Tempo duerfen nie fallen.
  for (let w = 1; w < 120; w++) {
    pruefe(wellenSkalierung(w + 1).lpFaktor >= wellenSkalierung(w).lpFaktor, 'Leben fallen nie, Welle ' + w);
    pruefe(wellenSkalierung(w + 1).truppGroesse >= wellenSkalierung(w).truppGroesse,
      'Truppgröße fällt nie, Welle ' + w);
  }

  // Der Spawn-Abstand waechst mit der Truppgroesse -- die Gesamtmenge bleibt
  // gleich, nur die Spitzenlast am Tor steigt. Genau das ist die Absicht.
  for (const w of [4, 5, 9, 10, 24, 25]) {
    const proSekunde = wellenSkalierung(w).truppGroesse / spawnAbstand(w);
    pruefe(proSekunde > 0 && isFinite(proSekunde), 'Zulauf je Sekunde ist endlich, Welle ' + w);
  }
  pruefe(spawnAbstand(5) > spawnAbstand(4),
    'Bei Truppgröße 2 waechst der Abstand mit');
}

console.log('Bosswellen');
{
  for (const w of [5, 10, 15, 20, 100]) pruefe(istBosswelle(w), 'Welle ' + w + ' ist eine Bosswelle');
  for (const w of [1, 2, 4, 6, 9, 11, 99]) pruefe(!istBosswelle(w), 'Welle ' + w + ' ist keine Bosswelle');
  pruefe(!istBosswelle(0), 'Welle 0 ist keine Bosswelle');

  gleich(BOSS.lpFaktor, 25, 'Der Boss hat 25-faches Leben');
  gleich(BOSS.goldFaktor, 10, 'Der Boss bringt zehnfaches Gold');
  gleich(BOSS.groesse, 2, 'Der Boss ist doppelt so groß');
  pruefe(BOSS.tempoFaktor < 1, 'Der Boss ist langsamer als ein normaler Recke');

  // Halbes Gefolge, aber nie weniger als zwei.
  for (const w of [5, 10, 20, 40, 60]) {
    const boss = wellenStaerke(w);
    const normal = wellenStaerke(w - 1);
    pruefe(boss < normal, 'Bosswelle ' + w + ' hat weniger Gefolge als Welle ' + (w - 1));
    pruefe(boss >= 2, 'Bosswelle ' + w + ' hat mindestens zwei Recken');
  }
}

/* ---------------- Wellen ---------------- */

console.log('Wellenstärke');
gleich(wellenStaerke(1), 5, 'Welle 1 bringt 5 Recken');
pruefe(wellenStaerke(2) > wellenStaerke(1), 'Welle 2 ist größer als Welle 1');
// Bewusst UNGERADE Wellen: 200 und 1000 sind Bosswellen (durch 5 teilbar)
// und bringen dort nur halbes Gefolge. Der Deckel gilt fuer normale Wellen.
gleich(wellenStaerke(199), 80, 'Deckel bei 80 greift');
gleich(wellenStaerke(1001), 80, 'Deckel hält auch weit oben');
gleich(wellenStaerke(200), 40, 'Bosswelle 200 bringt halbes Gefolge');
// Die Monotonie gilt nur unter NORMALEN Wellen. Bosswellen bringen
// absichtlich halbes Gefolge -- dort faellt die Zahl, und das ist richtig.
let vorherige = 0;
for (let w = 1; w <= 60; w++) {
  const n = wellenStaerke(w);
  if (!istBosswelle(w)) {
    pruefe(n >= vorherige, 'Welle ' + w + ': Stärke fällt nie unter normalen Wellen');
    vorherige = n;
  }
  pruefe(n <= 80, 'Welle ' + w + ': Stärke bleibt unter dem Deckel');
  pruefe(n >= 2, 'Welle ' + w + ': mindestens zwei Recken');
  pruefe(Number.isInteger(n), 'Welle ' + w + ': Stärke ist ganzzahlig');
}
// Lockrufe sind gestrichen (0.7.0): wellenStaerke nimmt nur noch die Welle.
gleich(wellenStaerke.length, 1, 'wellenStaerke hat nur noch einen Parameter');
gleich(wellenStaerke(10), wellenStaerke(10, 3),
  'Ein zweites Argument wird ignoriert -- kein Lockruf mehr');

console.log('Abstand zwischen zwei Recken');
nahe(spawnAbstand(1), 2.64, 'Welle 1: knapp 2,6 Sekunden Abstand', 1e-9);

// Seit 0.7.0 ist der Abstand der Abstand zwischen TRUPPS, nicht zwischen
// einzelnen Recken -- er waechst mit der Truppgroesse mit, damit die
// Gesamtmenge gleich bleibt. Der Boden von 0,85 s gilt darum je Recke.
for (let w = 1; w <= 60; w++) {
  const trupp = wellenSkalierung(w).truppGroesse;
  const jeRecke = spawnAbstand(w) / trupp;
  pruefe(jeRecke >= 0.85 - 1e-9, 'Welle ' + w + ': Abstand je Recke über dem Boden');
  pruefe(spawnAbstand(w) > 0 && isFinite(spawnAbstand(w)),
    'Welle ' + w + ': Abstand ist endlich und positiv');
}
nahe(spawnAbstand(100) / wellenSkalierung(100).truppGroesse, 0.85,
  'Weit oben liegt der Abstand je Recke genau auf dem Boden');

console.log('Verfügbare Klassen');
gleich(verfuegbareKlassen(RECKEN, 1).length, 1, 'In Welle 1 nur Bauern');
gleich(verfuegbareKlassen(RECKEN, 3).length, 2, 'Ab Welle 3 kommt der Söldner dazu');
gleich(verfuegbareKlassen(RECKEN, 18).length, 5, 'Ab Welle 18 sind alle fünf da');
// Der Koeder ist gestrichen (0.7.0): Die Klassen kommen allein nach Welle.
gleich(verfuegbareKlassen(RECKEN, 6).length, verfuegbareKlassen(RECKEN, 6, 3).length,
  'Ein zweites Argument wird ignoriert -- kein Köder mehr');
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

console.log('Abklingzeit der Pranke');
gleich(ZAUBER.find((z) => z.k === 'pranke').abklingzeit, 22,
  'Die Pranke startet bewusst träge mit 22 s');

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
  // Schrott ist seit 0.7.0 keine Waehrung mehr und darf nicht zurueckkehren.
  pruefe(b.schrott === undefined, b.name + ' hat kein Schrott-Feld mehr');
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
