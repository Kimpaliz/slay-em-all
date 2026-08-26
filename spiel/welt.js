// Der gesamte veränderliche Zustand des Spiels an einer Stelle.
//
// `zustand` ist das, was gespeichert wird und in der Anzeige steht.
// `szene` ist die Sichtbarkeit: Recken auf der Brücke, fliegende Trümmer,
// Blutlachen. Sie wird nicht gespeichert — sie entsteht beim Zusehen neu.

import { STUFEN_LEER } from '../werkzeuge/wirtschaft.mjs';
import { MASSE } from './masse.js';

export function neuerZustand() {
  return {
    blut: 0,
    knochen: 0,
    schrott: 0,
    erledigte: 0,
    stufen: { ...STUFEN_LEER },
    proKlasse: { bauer: 0, soeldner: 0, ritter: 0, paladin: 0, meister: 0 },
    kaeufe: 0,
    letzterKauf: 'Das Haus wirtschaftet selbst. Zusehen genügt.',
    spielzeit: 0
  };
}

export function neueSzene() {
  const szene = {
    recken: [],      // unterwegs auf der Brücke
    imTor: [],       // verschluckt, wird gerade verarbeitet
    truemmer: [],    // fliegende Körperteile
    spritzer: [],    // kleine Blutpunkte
    lachen: [],      // Blut auf den Planken
    tropfen: [],     // was von der Brücke fällt
    liegendes: [],   // Helme, Schilde, Schädel auf den Planken
    ringe: [],       // Wellen unten in der Schlucht
    raben: [],
    fledermaeuse: null,
    klaue: null,

    /** Reime, die der Marktschreier noch ausrufen muss. */
    spruchSchlange: [],
    letzterReim: -1,

    zeit: 0,
    zulaufRest: 0,
    kaufRest: 0,
    wischRest: 0,
    blutRest: 0,
    beben: 0,
    aufblitzen: 0,
    knochenhaufen: 0,
    letzterSpruch: -3,
    naechsteFledermaus: 24,
    naechsteKlaue: 30,
    laufendeNummer: 1,
    sterne: []
  };

  for (let i = 0; i < 60; i++) {
    szene.sterne.push({
      x: (i * 61 + 13) % MASSE.breite,
      y: 4 + ((i * 37) % 74),
      helligkeit: 0.14 + ((i * 17) % 55) / 100,
      phase: (i * 1.7) % 6.28
    });
  }
  for (let i = 0; i < 6; i++) {
    szene.raben.push({ x: 130 + i * 26 + (i % 3) * 7, huepfRest: 0, flugRest: 0, vx: 0, vy: 0, y: 0, schlag: (i * 3) % 8 });
  }
  return szene;
}

export function neueWelt() {
  return { zustand: neuerZustand(), szene: neueSzene() };
}
