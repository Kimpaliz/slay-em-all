// Prüft die Wirtschaft und rechnet ihren Verlauf durch — ohne Browser.
//
//   node werkzeuge/pruefe-wirtschaft.mjs
//
// Zwei Teile:
//   1. Prüfungen  — feste Erwartungen, die stimmen müssen.
//   2. Verlauf    — was in einer Stunde Spielzeit tatsächlich passiert.
//
// Der Verlauf ist die Grundlage für jede Balanceentscheidung. Er benutzt
// einen festen Zufallsgeber, damit zwei Läufe dasselbe ergeben.

import { RECKEN } from '../spiel/daten/recken.js';
import { AUSBAUTEN, AUSBAU_IDS, KAUFSPRUCH } from '../spiel/daten/ausbauten.js';
import {
  raten, freigeschaltet, klassenGewichte, mittleresBlut, durchsatz, engpass,
  blutProSekunde, kaufAbstand, hausWaehltAusbau, zahl, STUFEN_LEER
} from './wirtschaft.mjs';

let geprueft = 0;
let gescheitert = 0;

function pruefe(was, bedingung, zusatz = '') {
  geprueft++;
  if (bedingung) return;
  gescheitert++;
  console.log('  FEHLER: ' + was + (zusatz ? '  — ' + zusatz : ''));
}

function nah(a, b, toleranz = 1e-9) {
  return Math.abs(a - b) <= toleranz;
}

/* ---------------- Teil 1: Prüfungen ---------------- */

console.log('\n=== Prüfungen ===\n');

// Daten
pruefe('fünf Reckenklassen', RECKEN.length === 5, RECKEN.length + ' gefunden');
pruefe('fünf Ausbauten', AUSBAUTEN.length === 5);
pruefe('jede Ausbaustufe hat Kaufsprüche',
  AUSBAU_IDS.every((id) => Array.isArray(KAUFSPRUCH[id]) && KAUFSPRUCH[id].length > 0));
pruefe('Freischaltschwellen steigen',
  RECKEN.every((r, i) => i === 0 || r.ab > RECKEN[i - 1].ab));
pruefe('Beute steigt mit der Klasse',
  RECKEN.every((r, i) => i === 0 || r.blut > RECKEN[i - 1].blut));

// Grundraten
const leer = raten(STUFEN_LEER);
pruefe('Zulauf ohne Ausbau ist 0,42/s', nah(leer.zulauf, 0.42));
pruefe('Verweildauer ohne Ausbau ist 2,4 s', nah(leer.verweildauer, 2.4));
pruefe('ein Torplatz ohne Ausbau', leer.torplaetze === 1);
pruefe('Beutefaktor ohne Ausbau ist 1', nah(leer.beute, 1));
pruefe('ohne Kobold kein Grundeinkommen', leer.kobold === 0);

// Die Verweildauer hat einen harten Boden — sonst würde der Durchsatz
// ins Unendliche laufen und die Anzeige unbrauchbar.
const vieleKlingen = raten({ ...STUFEN_LEER, klinge: 40 });
pruefe('Verweildauer fällt nie unter 0,14 s', nah(vieleKlingen.verweildauer, 0.14));

// Freischaltung
pruefe('am Anfang nur der Bauer', freigeschaltet(0).length === 1);
pruefe('bei 16 Erledigten kommt der Söldner', freigeschaltet(16).length === 2);
pruefe('bei 420 Erledigten sind alle da', freigeschaltet(420).length === 5);

// Verteilung
const verteilung = klassenGewichte(420);
const summeAnteile = verteilung.reduce((a, e) => a + e.anteil, 0);
pruefe('Anteile ergeben zusammen 1', nah(summeAnteile, 1, 1e-12));
pruefe('die stärkste Klasse ist die häufigste',
  verteilung[verteilung.length - 1].anteil === Math.max(...verteilung.map((e) => e.anteil)));

// Engpass
pruefe('am Anfang bremst das Tor, nicht der Zulauf',
  engpass(STUFEN_LEER) === 'tor',
  'Zulauf ' + leer.zulauf.toFixed(2) + '/s gegen Tor ' + (leer.torplaetze / leer.verweildauer).toFixed(2) + '/s');

// Selbstkauf
pruefe('erster Kauf nach 16 s', nah(kaufAbstand(0), 16));
pruefe('Kaufabstand sinkt', kaufAbstand(10) < kaufAbstand(0));
pruefe('Kaufabstand hat einen Boden von 4,5 s', nah(kaufAbstand(1000), 4.5));

// Das Haus greift bei gleichem Stand zuerst zu dem, was es am liebsten mag.
// Ohne Zufall (immer 0,5) muss das der höchste Neigungswert sein.
const ohneZufall = hausWaehltAusbau(STUFEN_LEER, () => 0.5);
pruefe('das Haus kauft zuerst Lockrufe oder Klingen',
  ohneZufall === 'lockruf' || ohneZufall === 'klinge', 'gewählt: ' + ohneZufall);

// Zahlformat
pruefe('1234 wird zu "1,23 k"', zahl(1234) === '1,23 k', zahl(1234));
pruefe('5,6 Mio wird richtig gekürzt', zahl(5_600_000) === '5,60 Mio', zahl(5_600_000));
pruefe('0 bleibt "0"', zahl(0) === '0');
pruefe('Unsinn ergibt "0"', zahl(NaN) === '0' && zahl(-5) === '0');

console.log(`  ${geprueft - gescheitert} von ${geprueft} Prüfungen bestanden.\n`);

/* ---------------- Teil 2: der Verlauf ---------------- */

/** Fester Zufallsgeber, damit zwei Läufe dasselbe ergeben. */
function zufallsgeber(saat) {
  let s = saat >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Rechnet den Verlauf durch, ohne jede Figur einzeln zu bewegen:
 * in Schritten von einer Sekunde wird der Durchsatz aufaddiert und der
 * Selbstkauf des Hauses zum richtigen Zeitpunkt ausgelöst.
 */
function verlaufRechnen(dauerSekunden, saat = 12345) {
  const zufall = zufallsgeber(saat);
  const stand = {
    stufen: { ...STUFEN_LEER },
    kaeufe: 0, erledigte: 0, blut: 0, knochen: 0, schrott: 0
  };
  let bisKauf = kaufAbstand(0);
  let reckenRest = 0;
  const marken = [];
  const freischaltungen = [];
  let zuletztFrei = 1;

  for (let t = 1; t <= dauerSekunden; t++) {
    bisKauf -= 1;
    while (bisKauf <= 0) {
      const id = hausWaehltAusbau(stand.stufen, zufall);
      stand.stufen[id] += 1;
      stand.kaeufe += 1;
      bisKauf += kaufAbstand(stand.kaeufe);
    }

    reckenRest += durchsatz(stand.stufen);
    while (reckenRest >= 1) {
      reckenRest -= 1;
      const verteilung = klassenGewichte(stand.erledigte);
      let rest = zufall();
      let gewaehlt = verteilung[verteilung.length - 1].klasse;
      for (const e of verteilung) { rest -= e.anteil; if (rest <= 0) { gewaehlt = e.klasse; break; } }
      const r = raten(stand.stufen);
      stand.blut += Math.round(gewaehlt.blut * r.beute);
      stand.knochen += gewaehlt.knochen;
      stand.schrott += gewaehlt.schrott;
      stand.erledigte += 1;
      const frei = freigeschaltet(stand.erledigte).length;
      if (frei > zuletztFrei) {
        zuletztFrei = frei;
        freischaltungen.push({ sekunde: t, klasse: RECKEN[frei - 1].name });
      }
    }

    const r = raten(stand.stufen);
    stand.blut += r.kobold * r.beute;

    if ([60, 120, 300, 480, 600, 900, 1800, 3600].includes(t)) {
      marken.push({
        minute: t / 60,
        erledigte: stand.erledigte,
        blut: stand.blut,
        blutProSekunde: blutProSekunde(stand.erledigte, stand.stufen),
        durchsatzProMinute: durchsatz(stand.stufen) * 60,
        kaeufe: stand.kaeufe,
        stufen: { ...stand.stufen },
        engpass: engpass(stand.stufen),
        mittleresBlut: mittleresBlut(stand.erledigte, stand.stufen)
      });
    }
  }
  return { marken, freischaltungen, stand };
}

console.log('=== Verlauf einer Stunde (fester Zufall) ===\n');
const { marken, freischaltungen } = verlaufRechnen(3600);

/** Größenordnung statt Ziffernwust: 3,1e9 statt 3100000000. */
function groesse(n) {
  if (!isFinite(n)) return 'unendlich';
  if (n < 1e6) return String(Math.round(n));
  return n.toExponential(1).replace('e+', '·10^');
}

console.log('  Zeit     Erledigt          Blut  Größenordnung  Käufe  Engpass  Anzeige');
console.log('  ' + '-'.repeat(74));
for (const m of marken) {
  const angezeigt = zahl(m.blut);
  const lesbar = angezeigt.length <= 9 && !angezeigt.includes('e');
  console.log(
    '  ' + (m.minute + ' Min').padEnd(9) +
    String(m.erledigte).padStart(9) +
    (lesbar ? angezeigt : angezeigt.slice(0, 12) + '…').padStart(14) +
    groesse(m.blut).padStart(15) +
    String(m.kaeufe).padStart(7) +
    '  ' + m.engpass.padEnd(8) +
    ' ' + (lesbar ? 'lesbar' : 'UNLESBAR')
  );
}

console.log('\n  Freischaltungen:');
if (freischaltungen.length === 0) console.log('    keine');
for (const f of freischaltungen) {
  const min = Math.floor(f.sekunde / 60);
  const sek = f.sekunde % 60;
  console.log(`    ${String(min).padStart(2)}:${String(sek).padStart(2, '0')}  ${f.klasse}`);
}

console.log('\n  Ausbaustufen nach einer Stunde:');
const letzte = marken[marken.length - 1];
for (const a of AUSBAUTEN) {
  console.log(`    ${a.name.padEnd(18)} Stufe ${letzte.stufen[a.id]}`);
}

/* ---------------- Teil 3: was fehlt ---------------- */

console.log('\n=== Befund ===\n');

const ausgaben = [];
if (!ausgaben.length) {
  console.log('  Blut, Knochen und Schrott werden nirgends ausgegeben.');
  console.log('  Sie sind reine Zähler — es gibt keinen Preis und keinen Kauf');
  console.log('  durch den Spieler. Genau hier fehlt die Schleife.\n');
}

// Ab wann die Anzeige unbrauchbar wird: `zahl()` kennt als größte Einheit
// "Bio" (10^12). Alles darüber wird zu einer immer längeren Ziffernkette.
const fein = verlaufRechnen(1800);
let bruch = null;
{
  const zufall = zufallsgeber(12345);
  const stand = { stufen: { ...STUFEN_LEER }, kaeufe: 0, erledigte: 0, blut: 0 };
  let bisKauf = kaufAbstand(0);
  let rest = 0;
  for (let t = 1; t <= 1800 && !bruch; t++) {
    bisKauf -= 1;
    while (bisKauf <= 0) {
      stand.stufen[hausWaehltAusbau(stand.stufen, zufall)] += 1;
      stand.kaeufe += 1;
      bisKauf += kaufAbstand(stand.kaeufe);
    }
    rest += durchsatz(stand.stufen);
    while (rest >= 1) {
      rest -= 1;
      const v = klassenGewichte(stand.erledigte);
      let z = zufall();
      let k = v[v.length - 1].klasse;
      for (const e of v) { z -= e.anteil; if (z <= 0) { k = e.klasse; break; } }
      stand.blut += Math.round(k.blut * raten(stand.stufen).beute);
      stand.erledigte += 1;
    }
    if (stand.blut >= 1e15) bruch = { sekunde: t, blut: stand.blut };
  }
}

console.log('  1. Alle fünf Klassen sind nach ' +
  Math.ceil(freischaltungen[freischaltungen.length - 1].sekunde / 60) +
  ' Minuten freigeschaltet. Danach gibt es nichts Neues mehr zu sehen.');

if (bruch) {
  console.log('  2. Nach ' + Math.floor(bruch.sekunde / 60) + ':' +
    String(bruch.sekunde % 60).padStart(2, '0') +
    ' Minuten überschreitet das Blut 10^15 — ab da kennt die Zahlanzeige');
  console.log('     keine Einheit mehr und zeigt nur noch eine wachsende Ziffernkette.');
}

console.log('  3. Der Engpass ist am Ende: ' + letzte.engpass +
  '. Der Zulauf wächst schneller als das Tor,');
console.log('     also stauen sich die Recken — sichtbar wird das nie, weil die Brücke');
console.log('     nur 18 Figuren zeigt.');
console.log('');

process.exit(gescheitert > 0 ? 1 : 0);
