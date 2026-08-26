// Der gesamte veränderliche Zustand des Spiels an einer Stelle.
//
// `zustand` ist das, was gespeichert wird und in der Anzeige steht.
// `szene` ist die Sichtbarkeit: Recken auf der Brücke, fliegende Trümmer,
// Blutlachen. Sie wird nicht gespeichert — sie entsteht beim Zusehen neu.
//
// Zwei Zeitebenen: Was in `stufen` steht, gilt nur für die laufende Runde
// und geht beim Neuanfang verloren. Was in `dauerhaft` und `schaedel`
// steht, überlebt jeden Neuanfang.

import { STUFEN_LEER, DAUERHAFT_LEER, startkapital } from '../werkzeuge/wirtschaft.mjs';
import { MASSE } from './masse.js';

export function neuerZustand() {
  return {
    // Währungen der laufenden Runde
    blut: 0,        // in Litern
    knochen: 0,     // wird nie ausgegeben — daraus entstehen beim Neuanfang Schädel
    schrott: 0,

    // überlebt den Neuanfang
    schaedel: 0,
    dauerhaft: { ...DAUERHAFT_LEER },

    erledigte: 0,
    stufen: { ...STUFEN_LEER },
    proKlasse: { bauer: 0, soeldner: 0, ritter: 0, paladin: 0, meister: 0 },
    kaeufe: 0,
    letzterKauf: 'Das Haus wartet auf eine Entscheidung.',

    spielzeit: 0,     // Sekunden in dieser Runde
    gesamtzeit: 0,    // Sekunden über alle Runden
    runde: 1
  };
}

/**
 * Setzt die Runde zurück und behält, was dauerhaft ist.
 * Wird beim Neuanfang benutzt — die Schädel selbst rechnet
 * `neuanfangDurchfuehren` in wirtschaft-nahen Code aus.
 */
export function rundeZuruecksetzen(zustand) {
  const start = startkapital(zustand.dauerhaft);
  zustand.blut = start.blut;
  zustand.schrott = start.schrott;
  zustand.knochen = 0;
  zustand.erledigte = 0;
  zustand.stufen = { ...STUFEN_LEER };
  zustand.proKlasse = { bauer: 0, soeldner: 0, ritter: 0, paladin: 0, meister: 0 };
  zustand.kaeufe = 0;
  zustand.spielzeit = 0;
  zustand.runde += 1;
  zustand.letzterKauf = 'Der Haufen ist abgetragen. Das Tal weiß von nichts.';
}

export function neueSzene() {
  const szene = {
    recken: [],      // sichtbar unterwegs auf der Brücke
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

    /**
     * Der Beutehaufen an der Mauer. Tagsüber wächst er, nachts wird er
     * abgetragen. Ist er voll, fällt neue Beute in die Schlucht.
     */
    haufen: { stueck: 0, knochen: 0, schrott: 0 },
    verlorenHeute: 0,
    geerntetHeute: { knochen: 0, schrott: 0 },
    ernteRest: 0,
    letztePhase: 'tag',

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

export function szeneZuruecksetzen(szene) {
  szene.recken.length = 0;
  szene.imTor.length = 0;
  szene.truemmer.length = 0;
  szene.spritzer.length = 0;
  szene.lachen.length = 0;
  szene.tropfen.length = 0;
  szene.liegendes.length = 0;
  szene.ringe.length = 0;
  szene.spruchSchlange.length = 0;
  szene.knochenhaufen = 0;
  szene.klaue = null;
  szene.haufen = { stueck: 0, knochen: 0, schrott: 0 };
  szene.verlorenHeute = 0;
  szene.geerntetHeute = { knochen: 0, schrott: 0 };
  szene.zeit = 0;
}

export function neueWelt() {
  return { zustand: neuerZustand(), szene: neueSzene() };
}
