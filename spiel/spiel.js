// Der Taktgeber. Hält die Uhr und ruft alles andere auf.
//
// Zwei Entscheidungen prägen diese Datei:
//
// 1. **Fester Zeitschritt.** Die Welt rückt immer in Portionen von genau
//    1/60 Sekunde vor, egal wie unregelmäßig der Browser uns aufruft.
//    Angesammelte Zeit wird nachgeholt. Ohne das fliegen Trümmer je nach
//    Bildrate unterschiedlich weit, und auf einem 144-Hz-Bildschirm liefe
//    das Spiel messbar anders als auf einem 60-Hz-Bildschirm.
//
// 2. **Pause, wenn niemand hinsieht.** Ist die Seite im Hintergrund,
//    steht die Welt still. Das ist kein Versehen: Das Spiel verlangt
//    tagsüber Gegenwehr, und eine Welle, die im verborgenen Tab
//    weiterläuft, könnte man nur verlieren. Beim Zurückkommen geht es
//    dort weiter, wo man aufgehört hat.

import { neueWelt, weltZuruecksetzen } from './welt.js';
import { MASSE } from './masse.js';
import { schritt } from './simulation.js';
import { zeichnen } from './szene.js';
import { anzeigeAnlegen } from './anzeige.js';
import { portraetsAnlegen } from './portraets.js';
import { eingabeAnlegen } from './eingabe.js';
import { vollbildAnlegen } from './vollbild.js';
import { klang, klangWecken, klangEinstellungLaden, stummUmschalten, istStumm } from './klang.js';
import { laden, sichern, loeschen, altlastenEntfernen } from './speicher.js';
import { welleStarten, welleAuslosen } from './wellen.js';
import { ausloesen } from './zauber.js';
import {
  beiGrommsch, beiPips, zauberLernen, zauberVerbessern, ritualKaufen, ritualUmschalten,
  klickKaufen, klickVerbessern, artefaktAnlegen, artefaktAblegen, artefaktVerkaufen
} from './handel.js';

/** Feste Schrittweite der Simulation, in Sekunden. */
export const TAKT = 1 / 60;
/** Höchstens so viel Spielzeit wird in einem Aufruf nachgeholt. */
const MAX_NACHHOLEN = 0.5;
/** Abstand zwischen zwei Sicherungen, in Spielsekunden. */
const SICHERN_ALLE = 6;

export function spielStarten(optionen = {}) {
  const wurzel = optionen.wurzel || document.querySelector('[data-wurzel]') || document;
  const welt = neueWelt();

  klangEinstellungLaden();
  altlastenEntfernen();
  const gespeichert = laden();
  if (gespeichert) {
    Object.assign(welt.zustand, gespeichert);
    welt.szene.spruchband = {
      text: 'NACHTLAGER',
      unter: 'Willkommen zurück — Welle ' + welt.zustand.welle + ' wartet',
      farbe: '#9184d9', zeit: 0, dauer: 4
    };
  }
  // Damit das Nachtlager von Anfang an ankündigen kann, was kommt.
  if (!welt.zustand.anstehend.length) welleAuslosen(welt.zustand);

  const leinwand = optionen.leinwand || wurzel.querySelector('canvas[data-szene]');
  const ctx = leinwand ? leinwand.getContext('2d') : null;

  const anzeige = anzeigeAnlegen(wurzel, {
    welleStarten: () => { welleStarten(welt); anzeige.auffrischen(welt); },
    neustart: () => {
      loeschen();
      weltZuruecksetzen(welt);
      welleAuslosen(welt.zustand);
      anzeige.auffrischen(welt);
    },
    kaufGrommsch: (k) => { if (beiGrommsch(welt, k)) nachKauf(); },
    kaufPips: (k) => { if (beiPips(welt, k)) nachKauf(); },
    zauberLernen: (k) => { if (zauberLernen(welt, k)) nachKauf(); },
    zauberVerbessern: (k, achse) => { if (zauberVerbessern(welt, k, achse)) nachKauf(); },
    klickKaufen: () => { if (klickKaufen(welt)) nachKauf(); },
    klickVerbessern: (achse) => { if (klickVerbessern(welt, achse)) nachKauf(); },
    artefaktAnlegen: (i) => { if (artefaktAnlegen(welt, i)) nachKauf(); },
    artefaktAblegen: (i) => { if (artefaktAblegen(welt, i)) nachKauf(); },
    artefaktVerkaufen: (ort, i) => { if (artefaktVerkaufen(welt, ort, i)) nachKauf(); },
    zustand: () => welt.zustand,
    ritual: () => {
      const zustand = welt.zustand;
      if (zustand.ritual >= 1) ritualUmschalten(welt);
      else ritualKaufen(welt);
      nachKauf();
    },
    zauberAusloesen: (k) => { if (ausloesen(welt, k)) anzeige.auffrischen(welt); }
  });

  function nachKauf() {
    klang('kauf');
    anzeige.auffrischen(welt);
    sichern(welt.zustand);
  }

  /*
    Der sichtbare Ausschnitt der Bühne.

    Die Leinwand ist 800 Punkte breit und wird in einem scrollbaren
    Rahmen gezeigt. Was davon gerade zu sehen ist, rechnen wir aus der
    Scrollstellung zurück in Bühnenpunkte — die Einblendungen richten
    sich danach, damit das Spruchband dort steht, wo der Spieler
    hinschaut, statt am linken Weltrand zu kleben.
  */
  const sichtRahmen = wurzel.querySelector('[data-sicht]');
  function sichtLesen() {
    if (!sichtRahmen || !leinwand) return null;
    const dargestellt = leinwand.getBoundingClientRect().width;
    if (!dargestellt) return null;
    const faktor = MASSE.BREITE / dargestellt;
    return {
      x: sichtRahmen.scrollLeft * faktor,
      breite: Math.min(MASSE.BREITE, sichtRahmen.clientWidth * faktor)
    };
  }

  // Der Blick beginnt am Tor: Dort entscheidet sich alles, das Land
  // links davor sieht man beim Zurückscrollen.
  function ansTorScrollen() {
    if (sichtRahmen) sichtRahmen.scrollLeft = sichtRahmen.scrollWidth;
  }

  const portraets = portraetsAnlegen({
    grommsch: wurzel.querySelector('[data-portraet="grommsch"]'),
    pips: wurzel.querySelector('[data-portraet="pips"]'),
    malvina: wurzel.querySelector('[data-portraet="malvina"]')
  });
  const eingabe = eingabeAnlegen(leinwand, welt, {
    geaendert: () => anzeige.auffrischen(welt),
    zauberAusloesen: (k) => { if (ausloesen(welt, k)) anzeige.auffrischen(welt); }
  });

  // Vollbild gibt es im normalen Browser nur auf Knopfdruck; in der
  // installierten App versteckt sich der Knopf von selbst.
  vollbildAnlegen(wurzel.querySelector('[data-knopf="vollbild"]'));

  /*
    Der Tonknopf.

    Er zeigt den gemerkten Zustand schon vor dem ersten Ton — wer beim
    letzten Mal stumm geschaltet hat, sieht das sofort und wird nicht
    beim Antippen von "Spielen" überrascht.
  */
  const tonKnopf = wurzel.querySelector('[data-knopf="ton"]');
  function tonAnzeigen() {
    if (!tonKnopf) return;
    const aus = istStumm();
    tonKnopf.classList.toggle('stumm', aus);
    tonKnopf.title = aus ? 'Ton einschalten' : 'Ton ausschalten';
    tonKnopf.setAttribute('aria-label', tonKnopf.title);
    tonKnopf.setAttribute('aria-pressed', aus ? 'false' : 'true');
  }
  if (tonKnopf) {
    tonKnopf.addEventListener('click', () => {
      klangWecken();          // falls noch nie eine Geste kam
      stummUmschalten();
      tonAnzeigen();
      klang('kauf');          // kurze Rückmeldung, dass es wieder an ist
    });
    tonAnzeigen();
  }

  /*
    Das Titelbild.

    Der Knopf ist die Nutzergeste, die Browser für Ton verlangen —
    deshalb wird der Tonapparat genau hier geweckt und nirgends sonst.
    Danach blendet das Bild aus und gibt das Spiel frei.
  */
  const titelbild = document.querySelector('[data-titelbild]');
  const spielenKnopf = document.querySelector('[data-knopf="spielen"]');
  if (titelbild && spielenKnopf) {
    spielenKnopf.addEventListener('click', () => {
      klangWecken();
      tonAnzeigen();
      titelbild.classList.add('geht');
      // Erst nach der Blende aus dem Weg räumen, sonst springt es.
      setTimeout(() => { titelbild.hidden = true; }, 480);
      klang('welleStart');
      ansTorScrollen();
    }, { once: true });
  }

  anzeige.breiteMessen();
  anzeige.auffrischen(welt);
  ansTorScrollen();
  window.addEventListener('resize', () => {
    anzeige.breiteMessen();
  });

  /* ---------- Die Uhr ---------- */

  let laeuft = true;
  let zuletzt = performance.now();
  let rest = 0;
  let seitSicherung = 0;
  let seitAnzeige = 0;
  let bild = 0;

  function takt(jetzt) {
    bild = requestAnimationFrame(takt);
    if (!laeuft) { zuletzt = jetzt; return; }

    let vergangen = (jetzt - zuletzt) / 1000;
    zuletzt = jetzt;
    if (!(vergangen > 0)) return;
    if (vergangen > MAX_NACHHOLEN) vergangen = MAX_NACHHOLEN;

    rest += vergangen;
    let schritte = 0;
    while (rest >= TAKT && schritte < 8) {
      schritt(welt, TAKT, optionen.einstellungen);
      rest -= TAKT;
      schritte++;
      seitSicherung += TAKT;
      seitAnzeige += TAKT;
    }

    zeichnen(ctx, welt, optionen.einstellungen, sichtLesen());
    if (portraets) portraets.schritt(vergangen, welt.szene.zeit);

    // Die Oberfläche muss nicht mit 60 Hz neu geschrieben werden.
    // Der Spielstand selbst ist längst aktuell — nur das Schreiben ins
    // Dokument wird gedrosselt.
    if (seitAnzeige >= 0.2) {
      seitAnzeige = 0;
      anzeige.auffrischen(welt);
    }

    if (seitSicherung >= SICHERN_ALLE) {
      seitSicherung = 0;
      sichern(welt.zustand);
    }
  }

  document.addEventListener('visibilitychange', () => {
    laeuft = !document.hidden;
    if (laeuft) {
      // Angesammelte Abwesenheit verwerfen, nicht nachholen.
      zuletzt = performance.now();
      rest = 0;
    } else {
      sichern(welt.zustand);
    }
  });
  window.addEventListener('pagehide', () => sichern(welt.zustand));

  bild = requestAnimationFrame(takt);

  const spiel = {
    welt,
    anhalten() {
      laeuft = false;
      cancelAnimationFrame(bild);
      if (eingabe) eingabe.abmelden();
      sichern(welt.zustand);
    },
    /** Für Prüfungen: rechnet Spielzeit im Zeitraffer durch. */
    vorspulen(sekunden, schrittweite = TAKT) {
      const n = Math.round(sekunden / schrittweite);
      for (let i = 0; i < n; i++) schritt(welt, schrittweite, optionen.einstellungen);
      anzeige.auffrischen(welt);
      return welt;
    }
  };
  return spiel;
}

// Beim Laden als Modul von selbst starten.
if (typeof document !== 'undefined') {
  const los = () => { window.slayEmAll = spielStarten(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los);
  else los();
}
