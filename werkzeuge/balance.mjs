// Spielt das Spiel durch, ohne es zu spielen.
//
//   node werkzeuge/balance.mjs [tage]
//
// Simuliert einen Spieler, der nachts immer das Lohnendste kauft, und
// zeigt, wie sich Durchsatz, Einnahmen und Ausbaustufen entwickeln. Damit
// lässt sich die Balance in einer Sekunde prüfen, statt eine Stunde
// zuzusehen.
//
// Worauf man beim Lesen achtet:
//   · Käufe je Tag sollten nicht gegen null gehen (Spiel steht still)
//     und nicht explodieren (Spiel rast davon).
//   · "verloren" sollte gelegentlich auftreten — das ist der Druck, der
//     Kobolde interessant macht — aber nicht dauerhaft hoch bleiben.
//   · Die Reckenklassen sollten sich über mehrere Tage verteilen, nicht
//     alle in den ersten Minuten aufgehen.

import { RECKEN } from '../spiel/daten/recken.js';
import { AUSBAUTEN } from '../spiel/daten/ausbauten.js';
import { TAG_DAUER, VOLLER_TAG, tagesStand, zulaufFaktor } from '../spiel/tageslauf.js';
import {
  raten, torLeistung, mittlereBeute, freigeschaltet, bestesAngebot, kaufen,
  schaedelFuer, zahl, dauer, STUFEN_LEER, DAUERHAFT_LEER
} from './wirtschaft.mjs';

const TAGE = Number(process.argv[2]) || 20;

function neuerSpieler(dauerhaft = DAUERHAFT_LEER) {
  return {
    blut: 0, knochen: 0, schrott: 0, schaedel: 0,
    erledigte: 0,
    stufen: { ...STUFEN_LEER },
    dauerhaft: { ...dauerhaft }
  };
}

/**
 * Ein Durchlauf über `tage` Tage. Zurück kommt eine Zeile je Tag.
 *
 * Gerechnet wird in Schritten von einer halben Sekunde: fein genug für
 * die Wellen, grob genug, dass zwanzig Tage in Millisekunden durchlaufen.
 */
export function durchspielen(tage, dauerhaft = DAUERHAFT_LEER) {
  const z = neuerSpieler(dauerhaft);
  const SCHRITT = 0.5;
  const haufen = { stueck: 0, knochen: 0, schrott: 0 };

  const zeilen = [];
  const freischaltungen = [];
  let zuletztFrei = freigeschaltet(0).length;

  for (let tag = 1; tag <= tage; tag++) {
    const start = (tag - 1) * VOLLER_TAG;
    let kaeufeHeute = 0;
    let blutHeute = 0;
    let verlorenHeute = 0;
    let erledigtHeute = 0;
    let ernteHeute = { knochen: 0, schrott: 0 };

    for (let s = 0; s < VOLLER_TAG; s += SCHRITT) {
      const zeit = start + s;
      const stand = tagesStand(zeit);
      const r = raten(z.stufen, z.dauerhaft);
      const b = mittlereBeute(z.erledigte, z.stufen, z.dauerhaft);

      if (stand.istTag) {
        const gefallen = Math.min(r.zulauf * zulaufFaktor(zeit), torLeistung(z.stufen, z.dauerhaft)) * SCHRITT;
        z.erledigte += gefallen;
        erledigtHeute += gefallen;
        z.blut += b.blut * gefallen;
        blutHeute += b.blut * gefallen;

        const platz = Math.max(0, r.lagerplatz - haufen.stueck);
        const passt = Math.min(gefallen, platz);
        haufen.stueck += passt;
        haufen.knochen += b.knochen * passt;
        haufen.schrott += b.schrott * passt;
        verlorenHeute += gefallen - passt;

        const frei = freigeschaltet(z.erledigte).length;
        if (frei > zuletztFrei) {
          zuletztFrei = frei;
          freischaltungen.push({ zeit, klasse: RECKEN[frei - 1].name });
        }
      } else {
        // Nacht: abtragen …
        if (haufen.stueck > 0) {
          const stueck = Math.min(haufen.stueck, r.ernteTempo * SCHRITT);
          const anteil = stueck / haufen.stueck;
          const kn = haufen.knochen * anteil;
          const sc = haufen.schrott * anteil;
          haufen.stueck -= stueck;
          haufen.knochen -= kn;
          haufen.schrott -= sc;
          z.knochen += kn;
          z.schrott += sc;
          ernteHeute.knochen += kn;
          ernteHeute.schrott += sc;
        }
        // … und einkaufen, solange etwas Lohnendes bezahlbar ist.
        let bremse = 0;
        let id;
        while ((id = bestesAngebot(z, true)) && bremse++ < 20) {
          if (!kaufen(z, id)) break;
          kaeufeHeute++;
        }
      }
    }

    const r = raten(z.stufen, z.dauerhaft);
    zeilen.push({
      tag,
      erledigtHeute,
      erledigtGesamt: z.erledigte,
      blutHeute,
      blutBestand: z.blut,
      knochen: z.knochen,
      schrott: z.schrott,
      ernteHeute,
      verlorenHeute,
      kaeufeHeute,
      stufen: { ...z.stufen },
      schaedel: schaedelFuer(z.knochen),
      torGrenze: torLeistung(z.stufen, z.dauerhaft),
      lagerplatz: r.lagerplatz,
      liegengeblieben: haufen.stueck
    });
  }

  return { zeilen, freischaltungen, zustand: z };
}

/* ---------------- Ausgabe ---------------- */

const { zeilen, freischaltungen, zustand } = durchspielen(TAGE);

console.log(`\n=== ${TAGE} Tage à ${dauer(VOLLER_TAG)} (${dauer(TAGE * VOLLER_TAG)} Spielzeit) ===\n`);
console.log('  Tag   Gefallen      Blut heute   Knochen   Schrott  Käufe  Verloren  Schädel');
console.log('  ' + '-'.repeat(76));
for (const z of zeilen) {
  console.log(
    '  ' + String(z.tag).padStart(3) +
    String(Math.round(z.erledigtHeute)).padStart(11) +
    (zahl(z.blutHeute) + ' L').padStart(16) +
    zahl(z.knochen).padStart(10) +
    zahl(z.schrott).padStart(10) +
    String(z.kaeufeHeute).padStart(7) +
    String(Math.round(z.verlorenHeute)).padStart(10) +
    String(z.schaedel).padStart(9)
  );
}

console.log('\n  Freischaltungen:');
if (!freischaltungen.length) console.log('    keine');
for (const f of freischaltungen) {
  console.log(`    ${dauer(f.zeit).padEnd(14)} ${f.klasse}`);
}

console.log('\n  Ausbaustufen am Ende:');
const letzte = zeilen[zeilen.length - 1];
for (const a of AUSBAUTEN) {
  console.log(`    ${a.name.padEnd(18)} Stufe ${String(letzte.stufen[a.id]).padStart(3)}   (${a.waehrung})`);
}

/* ---------------- Bewertung ---------------- */

console.log('\n=== Bewertung ===\n');

const kaeufe = zeilen.map((z) => z.kaeufeHeute);
const spaeteKaeufe = kaeufe.slice(Math.floor(kaeufe.length / 2));
const mittelSpaet = spaeteKaeufe.reduce((a, b) => a + b, 0) / spaeteKaeufe.length;

// Die Nacht dauert 50 Sekunden. Zwei Käufe darin sind zu wenig — dann hat
// man nichts zu tun und wartet nur. Fünfundzwanzig sind zu viel — dann ist
// die Nacht Fließbandarbeit. Dazwischen kommt etwa alle zwei bis zehn
// Sekunden eine Entscheidung, und das ist der Takt, den das Spiel will.
melde('Käufe je Nacht in der zweiten Hälfte',
  mittelSpaet.toFixed(1),
  mittelSpaet >= 2 && mittelSpaet <= 25,
  'zwischen 2 und 25 in einer 50-Sekunden-Nacht');

const ersterSchaedel = zeilen.find((z) => z.schaedel >= 1);
melde('Erster Schädel',
  ersterSchaedel ? 'Tag ' + ersterSchaedel.tag + ' (' + dauer(ersterSchaedel.tag * VOLLER_TAG) + ')' : 'nie',
  !!ersterSchaedel && ersterSchaedel.tag <= 8,
  'spätestens Tag 8, sonst dauert der erste Neuanfang zu lange');

const letzteFreischaltung = freischaltungen[freischaltungen.length - 1];
melde('Letzte Reckenklasse',
  letzteFreischaltung ? dauer(letzteFreischaltung.zeit) : 'nie',
  !!letzteFreischaltung && letzteFreischaltung.zeit > 600,
  'nicht vor 10 Minuten — sonst ist zu früh alles gesehen');

const verlustTage = zeilen.filter((z) => z.verlorenHeute > 1).length;
melde('Tage mit Verlust am Haufen',
  verlustTage + ' von ' + zeilen.length,
  verlustTage > 0 && verlustTage < zeilen.length * 0.7,
  'etwas Druck ist gewollt, dauerhafter Verlust ist Frust');

const wachstum = letzte.blutHeute / zeilen[0].blutHeute;
melde('Blutzuwachs über den ganzen Lauf',
  'Faktor ' + zahl(wachstum),
  wachstum > 20 && wachstum < 1e12,
  'spürbares Wachstum, aber keine Explosion');

melde('Größte Zahl in der Anzeige',
  zahl(letzte.blutBestand) + ' L  (' + (zahl(letzte.blutBestand).length) + ' Zeichen)',
  zahl(letzte.blutBestand).length <= 12,
  'muss lesbar bleiben');

function melde(was, wert, gut, warum) {
  console.log(`  ${gut ? '✓' : '✗'} ${was}: ${wert}`);
  if (!gut) console.log(`      erwartet: ${warum}`);
}

console.log('');
