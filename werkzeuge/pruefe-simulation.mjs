// Prüft die Mechaniken der Simulation an der laufenden Welt.
//
//   node werkzeuge/pruefe-simulation.mjs
//
// Anders als `pruefe-wirtschaft.mjs`, das nur Formeln nachrechnet, läuft
// hier die echte Simulation im Zeitschritt. Das ist der einzige Weg,
// Dinge wie „braucht ein Panzerritter wirklich sieben Sekunden im Tor"
// zu belegen, statt sie nur in einer Tabelle zu behaupten.

import { neueWelt } from '../spiel/welt.js';
import { schritt } from '../spiel/simulation.js';
import { RECKEN } from '../spiel/daten/recken.js';
import { MASSE } from '../spiel/masse.js';
import { BOSS, istBosswelle } from './wirtschaft.mjs';

const TAKT = 1 / 60;
let ok = 0;
let schlecht = 0;
function pruefe(bedingung, text, zusatz) {
  if (bedingung) { ok++; console.log('  ja    ' + text + (zusatz ? '   (' + zusatz + ')' : '')); }
  else { schlecht++; console.log('  NEIN  ' + text + (zusatz ? '   (' + zusatz + ')' : '')); }
}

function neueBuehne() {
  const welt = neueWelt();
  welt.szene.phase = 'tag';
  welt.zustand.phase = 'tag';
  welt.szene.wellenGroesse = 0;
  welt.szene.erschienen = 0;
  welt.szene.spawnListe = [];
  return welt;
}

function reckeBei(welt, klasse, x, extra = {}) {
  const r = {
    id: welt.szene.naechsteId++, klasse, name: 'Prüfling',
    x, phase: 0, lp: klasse.lp, maxLp: klasse.lp,
    zustand: 'laeuft', getroffen: 0, wartet: false, tempo: klasse.tempo,
    ...extra
  };
  welt.szene.recken.push(r);
  return r;
}

const bauer = RECKEN.find((k) => k.id === 'bauer');
const meister = RECKEN.find((k) => k.id === 'meister');
const panzer = RECKEN.find((k) => k.id === 'panzer');
const heiler = RECKEN.find((k) => k.id === 'heiler');

/* ---------------- 1. Fresszeit haengt nicht am Leben ---------------- */

console.log('\n1. Fresszeit statt Lebensabbau');

function fressdauer(klasse) {
  const welt = neueBuehne();
  welt.szene.imTor.push({
    klasse, name: 'x', lp: klasse.lp, maxLp: klasse.lp,
    fressZeit: klasse.fressZeit, fressRest: klasse.fressZeit, groesse: 1
  });
  let t = 0;
  while (welt.szene.imTor.length && t < 60) { schritt(welt, TAKT); t += TAKT; }
  return t;
}

const tBauer = fressdauer(bauer);
const tMeister = fressdauer(meister);
const tPanzer = fressdauer(panzer);
const tHeiler = fressdauer(heiler);

pruefe(Math.abs(tBauer - 2) < 0.1, 'Ein Bauer braucht 2 Sekunden', tBauer.toFixed(2) + ' s');
pruefe(Math.abs(tMeister - 2) < 0.1, 'Ein Grossmeister ebenfalls 2 Sekunden', tMeister.toFixed(2) + ' s');
pruefe(Math.abs(tBauer - tMeister) < 0.1,
  'Achtfaches Leben, gleiche Zeit — entkoppelt', '20 LP vs ' + meister.lp + ' LP');
pruefe(Math.abs(tPanzer - 7) < 0.15, 'Der Panzerritter braucht 7 Sekunden', tPanzer.toFixed(2) + ' s');
pruefe(Math.abs(tHeiler - 2) < 0.1, 'Der Heilzauberer 2 Sekunden', tHeiler.toFixed(2) + ' s');
pruefe(tPanzer > tMeister * 3, 'Der Panzerritter verstopft mehr als dreimal so lange');

/* ---------------- 2. Scharfe Klauen beschleunigen ---------------- */

console.log('\n2. Scharfe Klauen wirken auf die Zeit');
{
  const welt = neueBuehne();
  welt.zustand.stufenG.klauen = 20;   // +30 %
  welt.szene.imTor.push({
    klasse: bauer, name: 'x', lp: bauer.lp, maxLp: bauer.lp,
    fressZeit: bauer.fressZeit, fressRest: bauer.fressZeit, groesse: 1
  });
  let t = 0;
  while (welt.szene.imTor.length && t < 60) { schritt(welt, TAKT); t += TAKT; }
  pruefe(t < 1.6, '20 Stufen Klauen druecken 2 s auf unter 1,6 s', t.toFixed(2) + ' s');
}

/* ---------------- 3. Die Heilaura ---------------- */

console.log('\n3. Der Heilzauberer heilt seine Nachbarn');
{
  const welt = neueBuehne();
  const h = reckeBei(welt, heiler, 150);
  const nah = reckeBei(welt, bauer, 170);      // 20 px — in Reichweite (34)
  const fern = reckeBei(welt, bauer, 230);     // 80 px — ausserhalb
  h.tempo = 0; nah.tempo = 0; fern.tempo = 0;
  nah.lp = 5; fern.lp = 5;
  h.lp = 10;

  for (let i = 0; i < 120; i++) schritt(welt, TAKT);   // 2 Sekunden

  pruefe(nah.lp > 5, 'Der Nahe wird geheilt', '5 -> ' + nah.lp.toFixed(1) + ' LP');
  pruefe(fern.lp === 5, 'Der Ferne nicht', 'blieb bei ' + fern.lp + ' LP');
  pruefe(h.lp === 10, 'Er heilt sich nicht selbst', 'blieb bei ' + h.lp + ' LP');
  pruefe(nah.geheilt > 0, 'Der Geheilte bekommt einen Schimmer');

  // Deckel: nicht ueber volles Leben hinaus
  for (let i = 0; i < 60 * 30; i++) schritt(welt, TAKT);
  pruefe(nah.lp <= nah.maxLp + 0.001, 'Geheilt wird hoechstens bis voll',
    nah.lp.toFixed(1) + ' / ' + nah.maxLp);
}

/* ---------------- 4. Der Boss beendet sofort ---------------- */

console.log('\n4. Der Boss gewinnt beim Betreten');
{
  const welt = neueBuehne();
  welt.zustand.welle = 190;
  welt.zustand.stufenG.hallen = 5;    // reichlich Kapazitaet
  const b = reckeBei(welt, meister, MASSE.TOR_EINTRITT - 2, { boss: true, groesse: 2 });
  b.tempo = 30;
  const vorher = welt.zustand.welle;

  for (let i = 0; i < 30; i++) schritt(welt, TAKT);

  pruefe(welt.szene.phase === 'niederlage', 'Die Welle ist sofort verloren', 'Phase: ' + welt.szene.phase);
  pruefe(welt.szene.imTor.length === 0, 'Er landet nicht im Tor', welt.szene.imTor.length + ' im Tor');
  pruefe(welt.zustand.welle < vorher, 'Es geht Wellen zurueck', vorher + ' -> ' + welt.zustand.welle);
}

/* ---------------- 5. Ein normaler Recke gewinnt nicht ---------------- */

console.log('\n5. Ein gewoehnlicher Recke dagegen nicht');
{
  const welt = neueBuehne();
  welt.zustand.stufenG.hallen = 5;
  const r = reckeBei(welt, meister, MASSE.TOR_EINTRITT - 2);
  r.tempo = 30;
  for (let i = 0; i < 30; i++) schritt(welt, TAKT);
  pruefe(welt.szene.phase === 'tag', 'Die Welle laeuft weiter', 'Phase: ' + welt.szene.phase);
  pruefe(welt.szene.imTor.length === 1, 'Er steckt im Tor');
}

/* ---------------- 6. Bossauslegung ---------------- */

console.log('\n6. Ist der Boss zu schaffen?');
{
  const strecke = MASSE.TOR_EINTRITT + 8;
  const bossTempo = meister.tempo * BOSS.tempoFaktor;
  const zeit = strecke / bossTempo;
  const bossLp = meister.lp * BOSS.lpFaktor;
  pruefe(zeit > 45, 'Er braucht ueber 45 s ueber die Bruecke', Math.round(zeit) + ' s');
  pruefe(bossLp / bauer.lp < 60, 'Sein Leben entspricht unter 60 Bauern',
    Math.round(bossLp / bauer.lp) + ' Bauern');
  pruefe(istBosswelle(190) && !istBosswelle(5), 'Bosse kommen alle 190 Wellen');
}

console.log('\n' + (ok + schlecht) + ' Pruefungen, ' + schlecht + ' Fehler.');
process.exit(schlecht ? 1 : 0);
