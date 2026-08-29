// Der gesamte veränderliche Zustand des Spiels an einer Stelle.
//
// Zwei Hälften mit klarer Aufgabenteilung:
//
// `zustand` ist das, was gespeichert wird und in der Anzeige steht —
// Gold, Welle, gekaufte Stufen. Klein, flach, ohne Verweise auf andere
// Objekte, damit `JSON.stringify` genügt.
//
// `szene` ist alles Sichtbare: Recken auf der Brücke, fliegende Trümmer,
// Münzen, Blutlachen, Rauchfahnen, Pfeile in der Luft. Sie wird bewusst
// *nicht* gespeichert. Wer die Seite neu lädt, findet ein aufgeräumtes
// Nachtlager vor — das ist gewollt, denn eine halb gelaufene Welle
// wiederherzustellen wäre viel Aufwand für ein schlechteres Ergebnis.

import { proKlasseLeer } from './daten/recken.js';
import { RUHESPRUCH } from './daten/texte.js';
import { sterneAnlegen } from './daten/paletten.js';
import { MASSE } from './masse.js';
import { REGAL_PLAETZE } from './artefakte.js';
import {
  STUFEN_GROMMSCH_LEER, STUFEN_PIPS_LEER, zauberStufenLeer, klickStufenLeer
} from '../werkzeuge/wirtschaft.mjs';

export function neuerZustand() {
  return {
    // Die einzige Währung.
    gold: 0,
    // Keine Währung, sondern die Seele des Spiels: vergossene Liter.
    blut: 0,

    welle: 1,
    phase: 'nacht',      // 'nacht' | 'tag' | 'niederlage'
    erledigte: 0,
    bosse: 0,            // wie viele Bosse gefallen sind
    proKlasse: proKlasseLeer(),

    stufenG: { ...STUFEN_GROMMSCH_LEER },   // bei Grommsch gekauft
    stufenP: { ...STUFEN_PIPS_LEER },       // bei Pips gekauft
    zauber: zauberStufenLeer(),             // bei Malvina gelernt
    klick: klickStufenLeer(),               // der eigene Angriff

    // Artefakte: Regal ist ausgerüstet und wirkt, Inventar ist Lager.
    regal: new Array(REGAL_PLAETZE).fill(null),
    inventar: [],
    funde: 0,            // wie viele Artefakte je gefunden wurden
    blutRest: 0,         // Blutzoll: Reste unter 500 Litern

    // Die nächste Welle wird vorab ausgelost, damit das Nachtlager sie
    // ankündigen kann. Liste von Klassen-Kennungen, in Auftrittsreihenfolge.
    anstehend: [],
    // Name des angekündigten Bosses, sonst null.
    anstehenderBoss: null,

    ritual: 0,           // Morgenritual gekauft?
    ritualAn: true,      // ... und gerade eingeschaltet?

    spielzeit: 0
  };
}

export function neueSzene() {
  return {
    phase: 'nacht',
    zeit: 0,

    // Lebendes
    recken: [],          // unterwegs auf der Brücke
    imTor: [],           // verschluckt, wird gerade verdaut
    brennende: [],       // verbrennen gerade zu Asche

    // Fliegendes und Liegendes
    truemmer: [],        // Arme, Beine, Helme, Schädel
    spritzer: [],        // kleine Blutpartikel
    rauch: [],           // Rauchflocken, die hochgleiten und ausfaden
    lachen: [],          // Blutlachen auf den Planken
    tropfen: [],         // was von den Planken in den Abgrund tropft
    brandflecken: [],
    reste: [],           // liegengebliebene Helme, Schilde, Asche
    ringe: [],           // Wasserringe unten im Abgrund
    muenzen: [],
    fundstuecke: [],     // gefallene Artefakte, warten aufs Aufsammeln
    gluten: [],          // Aschenkrone: Glutflecken, die anzünden
    zahlen: [],          // aufsteigende "+7"-Anzeigen

    // Geschosse
    pfeile: [],
    steckende: [],       // Pfeile, die in den Planken stecken
    blitze: [],
    meteore: [],
    explosionen: [],

    // Tiere
    raben: rabenAnlegen(),
    fledermaeuse: null,
    drachling: { x: 150, y: 120, richtung: 1, phase: 0 },

    // Wellensteuerung
    spawnListe: [],
    spawnBoss: null,     // Bossname, solange er noch nicht erschienen ist
    wellenGroesse: 0,
    erschienen: 0,
    naechsterRecke: 1.2,
    nachtzeit: 0,
    niederlageZeit: 0,
    daemmerung: 0,
    sichtbarTag: false,

    // Zauber und eigener Angriff
    klickAbklingzeit: 0,
    pranke: null,
    flamme: null,
    donnerBereit: false,
    meteorZeit: 0,
    meteorTakt: 0,
    meteorWirkung: 0,
    meteorSchaden: 0,
    abklingzeit: { pranke: 0, donner: 0, flamme: 0, meteor: 0 },
    schuetzenTakt: [],

    // Anzeige und Zeitgeber
    spruchband: {
      text: 'NACHTLAGER',
      unter: 'Rüste dich — dann Welle 1 starten',
      farbe: '#9184d9',
      zeit: 0,
      dauer: 5
    },
    ruettelt: 0,
    blitzlicht: 0,
    sattStapel: 0,       // Hungriges Gemäuer: gestapelte Fressboni
    sattZeit: 0,
    spruchQueue: [],     // wartende Zeilen fuers Laufband
    letzterSpruch: -3,
    muenzHinweisGezeigt: false,
    sterne: sterneAnlegen(),
    fledermausTakt: 24,
    naechsteId: 1
  };
}

function rabenAnlegen() {
  const raben = [];
  for (let i = 0; i < 6; i++) {
    raben.push({ x: 130 + i * 26 + (i % 3) * 7, huepft: 0, fliegt: 0, vx: 0, vy: 0, y: 0, fluegel: (i * 3) % 8 });
  }
  return raben;
}

export function neueWelt() {
  return {
    zustand: neuerZustand(),
    szene: neueSzene(),
    sprueche: { ...RUHESPRUCH }
  };
}

/** Setzt alles auf Anfang — der Neustart-Knopf. */
export function weltZuruecksetzen(welt) {
  welt.zustand = neuerZustand();
  welt.szene = neueSzene();
  welt.sprueche = { ...RUHESPRUCH };
  welt.szene.spruchband = {
    text: 'NEUANFANG', unter: 'Alles auf null — Welle 1 wartet',
    farbe: '#9184d9', zeit: 0, dauer: 4
  };
}

/**
 * Räumt die Bühne, ohne den Fortschritt anzufassen.
 * Wird nach einer Niederlage gebraucht.
 */
export function buehneRaeumen(szene) {
  szene.recken = [];
  szene.imTor = [];
  szene.brennende = [];
  szene.klickAbklingzeit = 0;
  szene.pranke = null;
  szene.flamme = null;
  szene.donnerBereit = false;
  szene.meteorZeit = 0;
  szene.spawnListe = [];
  szene.spawnBoss = null;
  szene.sattStapel = 0;
  szene.sattZeit = 0;
  // Fundstücke bleiben liegen — ein Artefakt darf nie verloren gehen.
  for (const k in szene.abklingzeit) szene.abklingzeit[k] = 0;
}

/**
 * Ein neuer Recke am linken Bildrand.
 *
 * `skala` trägt, was die Welle von selbst draufgelegt hat: mehr
 * Lebenspunkte und mehr Tempo je Wellenzahl. Ein Boss bekommt darüber
 * hinaus den Bossaufschlag und wird doppelt so groß gezeichnet.
 */
export function reckeAnlegen(szene, klasse, name, skala, boss) {
  const lpFaktor = skala.lpFaktor * (boss ? boss.lpFaktor : 1);
  const tempoFaktor = skala.tempoFaktor * (boss ? boss.tempoFaktor : 1);
  const lp = Math.round(klasse.lp * lpFaktor);
  return {
    id: szene.naechsteId++,
    klasse,
    name,
    x: -8 - Math.random() * 14,
    phase: Math.random() * 6.28,
    lp,
    maxLp: lp,
    zustand: 'laeuft',   // 'laeuft' | 'flieht'
    getroffen: 0,
    wartet: false,
    boss: boss ? true : false,
    groesse: boss ? boss.groesse : 1,
    tempo: klasse.tempo * (boss ? 1 : 0.85 + Math.random() * 0.3) * tempoFaktor
  };
}

/** Der Punkt, an dem ein Recke im Tor verschwindet. */
export const EINTRITT = MASSE.TOR_EINTRITT;
