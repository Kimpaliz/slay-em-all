// Der Taktgeber: hält die Uhr, ruft Simulation, Zeichnen und Anzeige auf
// und sichert regelmäßig den Spielstand.
//
// Wichtig ist der feste Zeitschritt. Die Welt rückt immer in Portionen von
// genau 1/60 Sekunde vor, egal wie unregelmäßig der Browser uns aufruft.
// Angesammelte Zeit wird nachgeholt. Das ist der Unterschied zwischen einem
// Spiel, das im Hintergrund weiterläuft, und einem, das dort stehenbleibt.

import { neueWelt } from './welt.js';
import { schritt } from './simulation.js';
import { zeichnen as szeneZeichnen } from './szene.js';
import { anzeigeAnlegen } from './anzeige.js';
import { marktschreierAnlegen } from './marktschreier.js';
import { laden, sichern } from './speicher.js';

/** Feste Schrittweite der Simulation. */
export const TAKT = 1 / 60;
/** Höchstens so viel Spielzeit wird in einem Aufruf nachgeholt (Sekunden). */
const MAX_NACHHOLEN = 4;
/** Abstand zwischen zwei Sicherungen, in Spielsekunden. */
const SICHERN_ALLE = 6;

export function spielStarten(optionen = {}) {
  const welt = neueWelt();
  const gespeichert = laden();
  if (gespeichert) Object.assign(welt.zustand, gespeichert.zustand);

  const leinwand = optionen.leinwand || document.querySelector('canvas[data-szene]');
  const ctx = leinwand ? leinwand.getContext('2d') : null;
  const anzeige = anzeigeAnlegen(optionen.wurzel || document);
  const schreier = optionen.laufband
    ? marktschreierAnlegen(optionen.laufband.rahmen, optionen.laufband.felder)
    : null;

  const einstellungen = {
    palette: optionen.palette || 'Nacht',
    blutigkeit: optionen.blutigkeit != null ? optionen.blutigkeit : 9,
    beben: optionen.beben !== false,
    tempo: optionen.tempo != null ? optionen.tempo : 1
  };

  let rest = 0;                 // angesammelte, noch nicht simulierte Zeit
  let sicherRest = 0;
  let letzte = performance.now();
  let bildAnforderung = 0;
  let notuhr = 0;
  let laeuft = false;

  function vorruecken(echteSekunden) {
    const zu = Math.min(echteSekunden, MAX_NACHHOLEN) * einstellungen.tempo;
    rest += zu;
    let schritte = 0;
    const hoechstens = Math.ceil(MAX_NACHHOLEN / TAKT);
    while (rest >= TAKT && schritte < hoechstens) {
      schritt(welt, TAKT, einstellungen);
      rest -= TAKT;
      schritte++;
    }
    if (schritte >= hoechstens) rest = 0; // hoffnungslos hinterher: Rest verwerfen

    sicherRest += zu;
    if (sicherRest >= SICHERN_ALLE) {
      sicherRest = 0;
      sichern(welt.zustand);
    }
    return schritte;
  }

  function takt(jetzt) {
    const echte = (jetzt - letzte) / 1000;
    letzte = jetzt;
    if (echte <= 0) return;

    vorruecken(echte);

    // Zeichnen lohnt nur, wenn jemand hinsieht.
    if (ctx && !document.hidden) {
      szeneZeichnen(ctx, welt, einstellungen);
      if (schreier) schreier.schritt(welt, Math.min(0.25, echte));
    }
    anzeige.zeichnen(welt);
  }

  function bildSchleife(jetzt) {
    if (!laeuft) return;
    bildAnforderung = requestAnimationFrame(bildSchleife);
    takt(jetzt);
  }

  function starten() {
    if (laeuft) return;
    laeuft = true;
    letzte = performance.now();
    bildAnforderung = requestAnimationFrame(bildSchleife);
    // Im Hintergrund pausiert der Browser die Bildschleife. Diese Uhr läuft
    // weiter (gedrosselt auf etwa 1 Hz) und holt die fehlende Zeit nach.
    notuhr = setInterval(() => {
      const jetzt = performance.now();
      if (jetzt - letzte > 250) takt(jetzt);
    }, 200);
  }

  function anhalten() {
    laeuft = false;
    cancelAnimationFrame(bildAnforderung);
    clearInterval(notuhr);
    sichern(welt.zustand);
  }

  // Beim Zurückkommen sofort nachziehen statt auf den nächsten Takt zu warten.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && laeuft) { letzte = performance.now(); }
  });
  window.addEventListener('pagehide', () => sichern(welt.zustand));
  window.addEventListener('resize', () => schreier && schreier.neuEinmessen());

  starten();

  return {
    welt,
    einstellungen,
    starten,
    anhalten,
    /** Für Prüfungen: rückt die Welt ohne Warten um so viele Sekunden vor. */
    vorspulen(sekunden) {
      const schritte = Math.round(sekunden / TAKT);
      for (let i = 0; i < schritte; i++) schritt(welt, TAKT, einstellungen);
      anzeige.zeichnen(welt);
      return welt;
    }
  };
}
