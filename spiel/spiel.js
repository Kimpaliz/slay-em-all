// Der Taktgeber: hält die Uhr, ruft Simulation, Zeichnen und Anzeige auf,
// nimmt Käufe entgegen und sichert regelmäßig den Spielstand.
//
// Wichtig ist der feste Zeitschritt. Die Welt rückt immer in Portionen von
// genau 1/60 Sekunde vor, egal wie unregelmäßig der Browser uns aufruft.
// Angesammelte Zeit wird nachgeholt. Das ist der Unterschied zwischen einem
// Spiel, das im Hintergrund weiterläuft, und einem, das dort stehenbleibt.

import { neueWelt, rundeZuruecksetzen, szeneZuruecksetzen } from './welt.js';
import { schritt, kaufVerbuchen } from './simulation.js';
import { zeichnen as szeneZeichnen } from './szene.js';
import { anzeigeAnlegen } from './anzeige.js';
import { marktschreierAnlegen } from './marktschreier.js';
import { laden, sichern } from './speicher.js';
import {
  dauerhaftKaufen, schaedelFuer, darfNeuAnfangen, zahl, dauer
} from '../werkzeuge/wirtschaft.mjs';

/** Feste Schrittweite der Simulation. */
export const TAKT = 1 / 60;
/** Höchstens so viel Spielzeit wird in einem Aufruf nachgeholt (Sekunden). */
const MAX_NACHHOLEN = 4;
/** Abstand zwischen zwei Sicherungen, in Spielsekunden. */
const SICHERN_ALLE = 6;
/** So lange darf Abwesenheit höchstens angerechnet werden (12 Stunden). */
const MAX_ABWESENHEIT = 12 * 3600;

export function spielStarten(optionen = {}) {
  const welt = neueWelt();
  const gespeichert = laden();
  let abwesenheit = 0;
  if (gespeichert) {
    Object.assign(welt.zustand, gespeichert.zustand);
    welt.szene.zeit = welt.zustand.spielzeit;
    if (gespeichert.zuletztGesehen) {
      abwesenheit = Math.min(MAX_ABWESENHEIT, (Date.now() - gespeichert.zuletztGesehen) / 1000);
    }
  }

  const leinwand = optionen.leinwand || document.querySelector('canvas[data-szene]');
  const ctx = leinwand ? leinwand.getContext('2d') : null;
  const schreier = optionen.laufband
    ? marktschreierAnlegen(optionen.laufband.rahmen, optionen.laufband.felder)
    : null;

  const einstellungen = {
    palette: optionen.palette || 'Nacht',
    blutigkeit: optionen.blutigkeit != null ? optionen.blutigkeit : 9,
    beben: optionen.beben !== false,
    tempo: optionen.tempo != null ? optionen.tempo : 1
  };

  const anzeige = anzeigeAnlegen(optionen.wurzel || document, {
    kaufen: (id) => {
      if (kaufVerbuchen(welt, id)) anzeige.zeichnen(welt);
    },
    dauerhaftKaufen: (id) => {
      if (dauerhaftKaufen(welt.zustand, id)) {
        welt.zustand.letzterKauf = 'Etwas Dauerhaftes ist entstanden.';
        anzeige.zeichnen(welt);
      }
    },
    neuanfang: () => neuanfangDurchfuehren()
  });

  let rest = 0;
  let sicherRest = 0;
  let letzte = performance.now();
  let bildAnforderung = 0;
  let notuhr = 0;
  let laeuft = false;

  /** Rückt die Welt um so viele echte Sekunden vor. */
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

  /** Trägt den Haufen ab: Schädel gutschreiben, Runde zurücksetzen. */
  function neuanfangDurchfuehren() {
    if (!darfNeuAnfangen(welt.zustand)) return false;
    const gewinn = schaedelFuer(welt.zustand.knochen);
    welt.zustand.schaedel += gewinn;
    rundeZuruecksetzen(welt.zustand);
    szeneZuruecksetzen(welt.szene);
    welt.szene.spruchSchlange.push(
      `Der Haufen ist fort. ${gewinn} Schädel liegen im Keller. Das Tal weiß von nichts.`);
    sichern(welt.zustand);
    anzeige.zeichnen(welt);
    return true;
  }

  /**
   * Was in der Abwesenheit passiert ist. Wird in großen Schritten
   * nachgerechnet — Figuren und Trümmer interessieren dabei nicht, nur
   * die Bilanz. Ein Schritt von einer halben Sekunde ist grob genug, um
   * zwölf Stunden in Sekundenbruchteilen abzuarbeiten, und fein genug,
   * dass Tag- und Nachtwechsel richtig gezählt werden.
   */
  function abwesenheitNachholen(sekunden) {
    if (sekunden < 60) return null;
    const vorher = { blut: welt.zustand.blut, knochen: welt.zustand.knochen, schrott: welt.zustand.schrott };
    const SCHRITT = 0.5;
    const schritte = Math.floor(sekunden / SCHRITT);
    for (let i = 0; i < schritte; i++) schritt(welt, SCHRITT, einstellungen);
    // Die Szene ist danach voller Leichen aus einer Zeit, die niemand gesehen
    // hat — aufräumen, aber den Beutehaufen behalten.
    welt.szene.recken.length = 0;
    welt.szene.truemmer.length = 0;
    welt.szene.spritzer.length = 0;
    welt.szene.spruchSchlange.length = 0;
    return {
      dauer: sekunden,
      blut: welt.zustand.blut - vorher.blut,
      knochen: welt.zustand.knochen - vorher.knochen,
      schrott: welt.zustand.schrott - vorher.schrott
    };
  }

  const nachgeholt = abwesenheitNachholen(abwesenheit);
  if (nachgeholt) {
    welt.szene.spruchSchlange.push(
      `Willkommen zurück! In ${dauer(nachgeholt.dauer)} Abwesenheit kamen ` +
      `${zahl(nachgeholt.blut)} Liter Blut, ${zahl(nachgeholt.knochen)} Knochen ` +
      `und ${zahl(nachgeholt.schrott)} Schrott zusammen.`);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && laeuft) letzte = performance.now();
  });
  window.addEventListener('pagehide', () => sichern(welt.zustand));
  window.addEventListener('resize', () => schreier && schreier.neuEinmessen());

  starten();

  return {
    welt,
    einstellungen,
    starten,
    anhalten,
    neuanfang: neuanfangDurchfuehren,
    /** Für Prüfungen: rückt die Welt ohne Warten um so viele Sekunden vor. */
    vorspulen(sekunden, schrittweite = TAKT) {
      const schritte = Math.round(sekunden / schrittweite);
      for (let i = 0; i < schritte; i++) schritt(welt, schrittweite, einstellungen);
      anzeige.zeichnen(welt);
      return welt;
    }
  };
}
