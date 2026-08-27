// Spielt das Spiel ohne Browser durch und misst, ob es sich gut anfühlt.
//
//   node werkzeuge/balance.mjs [Wellen]
//
// Die Simulation läuft hier genauso wie im Browser — dieselben Module,
// derselbe feste Zeitschritt. Was fehlt, ist das Zeichnen und die
// Bedienung; beides beeinflusst den Spielverlauf nicht.
//
// Der eingebaute Spieler ist absichtlich schlicht: Er sammelt Gold ein,
// kauft nach einer festen Rangfolge und startet die nächste Welle, sobald
// er eingekauft hat. Er spielt also schlechter als ein Mensch. Was er
// schafft, sollte deshalb die Untergrenze sein.

import { neueWelt } from '../spiel/welt.js';
import { schritt } from '../spiel/simulation.js';
import { welleStarten } from '../spiel/wellen.js';
import { muenzeAufsammeln } from '../spiel/kampf.js';
import {
  beiGrommsch, beiPips, zauberLernen, zauberVerbessern, ritualKaufen, klickKaufen
} from '../spiel/handel.js';
import { ausloesen, klickAngriff } from '../spiel/zauber.js';
import {
  werte as werteAus, wellenStaerke, WAREN_GROMMSCH, WAREN_PIPS, ZAUBER, zahl
} from './wirtschaft.mjs';

const TAKT = 1 / 60;
const WELLEN = Number(process.argv[2] || 30);
/** Nach so vielen Spielsekunden je Welle wird abgebrochen. */
const GEDULD = 400;

/**
 * Die Einkaufsordnung des eingebauten Spielers.
 *
 * Kapazität zuerst, weil Überlauf die einzige Art ist zu verlieren.
 * Danach Fressgeschwindigkeit, dann Schützen, dann Gold-Bequemlichkeit.
 */
const ORDNUNG_SCHROTT = ['hallen', 'schlund', 'klauen', 'schuetze', 'krit', 'pfeile'];
const ORDNUNG_GOLD = ['sammler', 'stolz', 'marsch', 'ernte', 'lockruf', 'koeder'];

function einkaufen(welt) {
  const zustand = welt.zustand;
  let gekauft = 0;

  // Der Klick zuerst — er ist billig und die wichtigste Fruehhilfe.
  if (zustand.klick.gekauft < 1 && zustand.blut >= 15) {
    if (klickKaufen(welt)) gekauft++;
  }

  // Zauber: sobald bezahlbar, in der Reihenfolge ihres Preises
  for (const z of ZAUBER) {
    if (zustand.zauber[z.k].gelernt < 1 && zustand.blut >= z.preis * 2) {
      if (zauberLernen(welt, z.k)) gekauft++;
    }
  }
  // Pranke verbessern, solange reichlich Blut da ist
  for (const achse of ['schaden', 'abklingzeit', 'wirkbereich']) {
    if (zustand.zauber.pranke.gelernt >= 1 && zustand.blut > 600) {
      if (zauberVerbessern(welt, 'pranke', achse)) gekauft++;
    }
  }
  if (zustand.ritual < 1 && zustand.blut > 1200) {
    if (ritualKaufen(welt)) gekauft++;
  }

  for (const k of ORDNUNG_SCHROTT) {
    const ware = WAREN_GROMMSCH.find((w) => w.k === k);
    while (beiGrommsch(welt, ware.k)) gekauft++;
  }
  for (const k of ORDNUNG_GOLD) {
    const ware = WAREN_PIPS.find((w) => w.k === k);
    while (beiPips(welt, ware.k)) gekauft++;
  }
  return gekauft;
}

/** Der Spieler sammelt jede liegende Münze ein und zaubert, wenn es eng wird. */
function spielen(welt, werte) {
  const szene = welt.szene;

  for (let i = szene.muenzen.length - 1; i >= 0; i--) {
    const m = szene.muenzen[i];
    if (m.liegt) muenzeAufsammeln(welt, m, true, werte.stolzFaktor);
  }

  // Zaubern, sobald mehr als die halbe Burg belegt ist
  if (szene.phase === 'tag' && szene.imTor.length >= Math.ceil(werte.kapazitaet / 2)) {
    for (const z of ZAUBER) {
      if (z.k === 'donner') continue;   // braucht einen Mausklick
      ausloesen(welt, z.k);
    }
  }

  // Klicken wie ein Mensch: auf den vordersten Recken, sobald bereit.
  if (szene.phase === 'tag' && welt.zustand.klick.gekauft >= 1 && szene.klickAbklingzeit <= 0) {
    let vorderster = null;
    for (const r of szene.recken) {
      if (r.zustand === 'laeuft' && (!vorderster || r.x > vorderster.x)) vorderster = r;
    }
    if (vorderster) klickAngriff(welt, vorderster, vorderster.x + 3, werte);
  }
}

const welt = neueWelt();
const verlauf = [];
let niederlagen = 0;
let gesamtzeit = 0;
let steckengeblieben = null;

for (let n = 1; n <= WELLEN; n++) {
  const werte = werteAus(welt.zustand.stufenG, welt.zustand.stufenP);
  const gekauft = einkaufen(welt);
  const wellenNummer = welt.zustand.welle;
  const staerke = wellenStaerke(wellenNummer, welt.zustand.stufenP.lockruf);

  const vorBlut = welt.zustand.blut;
  const vorGold = welt.zustand.gold;
  const vorSchrott = welt.zustand.schrott;

  welleStarten(welt);
  let zeit = 0;
  let verloren = false;

  while (welt.szene.phase !== 'nacht' && zeit < GEDULD) {
    schritt(welt, TAKT);
    zeit += TAKT;
    gesamtzeit += TAKT;
    if (welt.szene.phase === 'niederlage') verloren = true;
    spielen(welt, werteAus(welt.zustand.stufenG, welt.zustand.stufenP));
  }

  if (zeit >= GEDULD) { steckengeblieben = wellenNummer; break; }
  if (verloren) niederlagen++;

  verlauf.push({
    welle: wellenNummer,
    recken: staerke,
    dauer: zeit,
    gekauft,
    kapazitaet: werte.kapazitaet,
    verloren,
    blut: welt.zustand.blut - vorBlut,
    gold: welt.zustand.gold - vorGold,
    schrott: welt.zustand.schrott - vorSchrott
  });
}

/* ---------------- Ausgabe ---------------- */

const z = welt.zustand;
console.log('');
console.log('Slay\'Em All — Gleichgewicht über ' + verlauf.length + ' Wellen');
console.log('');
console.log('  Welle  Recken  Dauer   Kap.  Käufe   Blut     Gold    Schrott');
console.log('  ' + '-'.repeat(60));
for (const e of verlauf) {
  if (e.welle % 5 !== 0 && e.welle !== 1 && !e.verloren) continue;
  console.log(
    '  ' + String(e.welle).padStart(5)
    + String(e.recken).padStart(8)
    + (e.dauer.toFixed(0) + ' s').padStart(8)
    + String(e.kapazitaet).padStart(6)
    + String(e.gekauft).padStart(7)
    + zahl(e.blut).padStart(8)
    + zahl(e.gold).padStart(9)
    + zahl(e.schrott).padStart(10)
    + (e.verloren ? '   VERLOREN' : '')
  );
}

const dauern = verlauf.map((e) => e.dauer);
const schnitt = dauern.reduce((a, b) => a + b, 0) / (dauern.length || 1);
const laengste = Math.max(...dauern, 0);
const kuerzeste = Math.min(...dauern, Infinity);

console.log('');
console.log('Ergebnis');
console.log('  Erreichte Welle          ' + z.welle);
console.log('  Gespielte Zeit           ' + Math.round(gesamtzeit / 60) + ' Minuten');
console.log('  Dauer je Welle           ' + kuerzeste.toFixed(0) + ' bis ' + laengste.toFixed(0)
  + ' s (Schnitt ' + schnitt.toFixed(0) + ' s)');
console.log('  Niederlagen              ' + niederlagen);
console.log('  Erledigte Recken         ' + z.erledigte);
console.log('  Blut / Gold / Schrott    ' + zahl(z.blut) + ' / ' + zahl(z.gold) + ' / ' + zahl(z.schrott));
console.log('  Kapazität am Ende        ' + werteAus(z.stufenG, z.stufenP).kapazitaet);
console.log('  Gelernte Zauber          ' + ZAUBER.filter((s) => z.zauber[s.k].gelernt >= 1).length + ' von 4');
console.log('');

/* ---------------- Urteil ---------------- */

const urteile = [];
function urteil(gut, text) { urteile.push((gut ? '  ja   ' : '  NEIN ') + text); return gut; }

let allesGut = true;
allesGut = urteil(!steckengeblieben, 'Keine Welle bleibt stecken') && allesGut;
allesGut = urteil(verlauf.length === WELLEN, 'Alle ' + WELLEN + ' Wellen durchgespielt') && allesGut;
allesGut = urteil(schnitt > 15 && schnitt < 180, 'Eine Welle dauert im Schnitt zwischen 15 s und 3 min') && allesGut;
allesGut = urteil(laengste < GEDULD, 'Keine Welle zieht sich endlos') && allesGut;
allesGut = urteil(niederlagen <= verlauf.length * 0.25, 'Höchstens jede vierte Welle geht verloren') && allesGut;
allesGut = urteil(z.erledigte > 0, 'Es wird überhaupt etwas erledigt') && allesGut;
allesGut = urteil(z.blut >= 0 && z.gold >= 0 && z.schrott >= 0, 'Keine Währung wird negativ') && allesGut;
allesGut = urteil(
  ZAUBER.filter((s) => z.zauber[s.k].gelernt >= 1).length >= 2,
  'Mindestens zwei Zauber sind erreichbar'
) && allesGut;
allesGut = urteil(werteAus(z.stufenG, z.stufenP).kapazitaet > 3, 'Die Burg wächst über die Grundgröße hinaus') && allesGut;

console.log(urteile.join('\n'));
console.log('');
if (steckengeblieben) {
  console.log('  Steckengeblieben bei Welle ' + steckengeblieben + '.');
}
process.exit(allesGut ? 0 : 1);
