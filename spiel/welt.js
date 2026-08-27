// Der gesamte veränderliche Zustand des Spiels an einer Stelle.
//
// Zwei Hälften mit klarer Aufgabenteilung:
//
// `zustand` ist das, was gespeichert wird und in der Anzeige steht —
// Währungen, Welle, gekaufte Stufen. Klein, flach, ohne Verweise auf
// andere Objekte, damit `JSON.stringify` genügt.
//
// `szene` ist alles Sichtbare: Recken auf der Brücke, fliegende Trümmer,
// Münzen, Blutlachen, Pfeile in der Luft. Sie wird bewusst *nicht*
// gespeichert. Wer die Seite neu lädt, findet ein aufgeräumtes Nachtlager
// vor — das ist gewollt, denn eine halb gelaufene Welle wiederherzustellen
// wäre viel Aufwand für ein schlechteres Ergebnis.

import { proKlasseLeer } from './daten/recken.js';
import { RUHESPRUCH } from './daten/texte.js';
import { sterneAnlegen } from './daten/paletten.js';
import { MASSE } from './masse.js';
import {
  STUFEN_GROMMSCH_LEER, STUFEN_PIPS_LEER, zauberStufenLeer
} from '../werkzeuge/wirtschaft.mjs';

export function neuerZustand() {
  return {
    blut: 0,
    gold: 0,
    schrott: 0,

    welle: 1,
    phase: 'nacht',      // 'nacht' | 'tag' | 'niederlage'
    erledigte: 0,
    proKlasse: proKlasseLeer(),

    stufenG: { ...STUFEN_GROMMSCH_LEER },   // bei Grommsch gekauft
    stufenP: { ...STUFEN_PIPS_LEER },       // bei Pips gekauft
    zauber: zauberStufenLeer(),             // bei Malvina gelernt

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
    lachen: [],          // Blutlachen auf den Planken
    tropfen: [],         // was von den Planken in den Abgrund tropft
    brandflecken: [],
    reste: [],           // liegengebliebene Helme, Schilde, Asche
    ringe: [],           // Wasserringe unten im Abgrund
    muenzen: [],
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
    wellenGroesse: 0,
    erschienen: 0,
    naechsterRecke: 1.2,
    nachtzeit: 0,
    niederlageZeit: 0,
    daemmerung: 0,
    sichtbarTag: false,

    // Zauber
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
    schrottRest: 0,   // Schrott fällt in Bruchteilen an, gutgeschrieben wird ganzzahlig
    sprueche: { ...RUHESPRUCH }
  };
}

/** Setzt alles auf Anfang — der Neustart-Knopf. */
export function weltZuruecksetzen(welt) {
  welt.zustand = neuerZustand();
  welt.szene = neueSzene();
  welt.schrottRest = 0;
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
  szene.pranke = null;
  szene.flamme = null;
  szene.donnerBereit = false;
  szene.meteorZeit = 0;
  for (const k in szene.abklingzeit) szene.abklingzeit[k] = 0;
}

/** Ein neuer Recke am linken Bildrand. */
export function reckeAnlegen(szene, klasse, name, tempoFaktor) {
  return {
    id: szene.naechsteId++,
    klasse,
    name,
    x: -8 - Math.random() * 14,
    phase: Math.random() * 6.28,
    lp: klasse.lp,
    maxLp: klasse.lp,
    zustand: 'laeuft',   // 'laeuft' | 'flieht'
    getroffen: 0,
    wartet: false,
    tempo: klasse.tempo * (0.85 + Math.random() * 0.3) * tempoFaktor
  };
}

/** Der Punkt, an dem ein Recke im Tor verschwindet. */
export const EINTRITT = MASSE.TOR_EINTRITT;
