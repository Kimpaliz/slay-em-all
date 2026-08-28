// Spielstand sichern und laden.
//
// Gespeichert wird nur `zustand` — Gold, Welle, gekaufte Stufen. Die
// Szene bleibt draußen: Sie ist in einer Sekunde neu aufgebaut, und eine
// halb gelaufene Welle wiederherzustellen wäre viel Aufwand für ein
// schlechteres Ergebnis.
//
// Zum Schlüssel: Er trägt eine Fassungsnummer. Ändert sich die Form des
// Zustands, kommt eine neue Nummer, und die alten werden beim Start
// gelöscht. Sonst läge im Browser ein Stand, den der neue Code nur
// halb versteht — das ergäbe Fehler, die niemand nachvollziehen kann.
//
// Fassung v2 ist der Umstieg auf eine Währung. Blut- und Schrott-Guthaben
// aus v1 werden **nicht** umgetauscht: Das Spiel ist jung, und ein
// sauberer Start ist ehrlicher als eine Umrechnung, die niemand prüfen
// kann.

import { proKlasseLeer } from './daten/recken.js';
import { artefaktBereinigen, REGAL_PLAETZE, INVENTAR_PLAETZE } from './artefakte.js';
import {
  STUFEN_GROMMSCH_LEER, STUFEN_PIPS_LEER, zauberStufenLeer, klickStufenLeer
} from '../werkzeuge/wirtschaft.mjs';

const SCHLUESSEL = 'slayemall.wellen.v3';

/** Frühere Fassungen, auch die aus der Werkbank-Zeit. */
const VERALTET = [
  'burgtor.scene.v1',
  'burgtor.waves.v2', 'burgtor.waves.v3', 'burgtor.waves.v4', 'burgtor.waves.v5',
  'slayemall.wellen.v1', 'slayemall.wellen.v2'
];

export function altlastenEntfernen() {
  try {
    for (const k of VERALTET) localStorage.removeItem(k);
  } catch (e) { /* Browser ohne Speicher — dann eben nicht */ }
}

export function sichern(zustand) {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify({
      gold: zustand.gold,
      blut: zustand.blut,
      welle: zustand.welle,
      erledigte: zustand.erledigte,
      bosse: zustand.bosse,
      proKlasse: zustand.proKlasse,
      stufenG: zustand.stufenG,
      stufenP: zustand.stufenP,
      zauber: zustand.zauber,
      klick: zustand.klick,
      regal: zustand.regal,
      inventar: zustand.inventar,
      funde: zustand.funde,
      blutRest: zustand.blutRest,
      anstehend: zustand.anstehend,
      anstehenderBoss: zustand.anstehenderBoss,
      ritual: zustand.ritual,
      ritualAn: zustand.ritualAn,
      spielzeit: zustand.spielzeit
    }));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Laden mit Auffüllen.
 *
 * Jedes Feld wird gegen einen Vorgabewert geprüft. Ein Stand aus einer
 * Fassung mit weniger Waren oder Zaubern lässt sich dadurch weiter
 * benutzen — es fehlt nichts, es steht nur auf null.
 */
export function laden() {
  let roh;
  try {
    roh = localStorage.getItem(SCHLUESSEL);
  } catch (e) {
    return null;
  }
  if (!roh) return null;

  let d;
  try {
    d = JSON.parse(roh);
  } catch (e) {
    return null;
  }
  if (!d || typeof d !== 'object' || !(d.welle >= 1)) return null;

  const zauber = zauberStufenLeer();
  for (const k in zauber) {
    if (d.zauber && d.zauber[k]) Object.assign(zauber[k], d.zauber[k]);
  }

  const klick = klickStufenLeer();
  if (d.klick && typeof d.klick === 'object') {
    Object.assign(klick, {
      gekauft: d.klick.gekauft >= 1 ? 1 : 0,
      schaden: zahlOder(d.klick.schaden, 0),
      abklingzeit: zahlOder(d.klick.abklingzeit, 0),
      krit: zahlOder(d.klick.krit, 0)
    });
  }

  // Artefakte werden beim Laden geprüft: nur echte Affixe, nur echte
  // Stufen. Tags leitet `tagsVon` daraus ab, gespeichert sind sie nie.
  const regal = new Array(REGAL_PLAETZE).fill(null);
  if (Array.isArray(d.regal)) {
    for (let i = 0; i < REGAL_PLAETZE; i++) regal[i] = artefaktBereinigen(d.regal[i]);
  }
  const inventar = (Array.isArray(d.inventar) ? d.inventar : [])
    .map(artefaktBereinigen).filter(Boolean).slice(0, INVENTAR_PLAETZE);

  return {
    gold: zahlOder(d.gold, 0),
    blut: zahlOder(d.blut, 0),
    welle: Math.max(1, Math.floor(zahlOder(d.welle, 1))),
    phase: 'nacht',
    erledigte: zahlOder(d.erledigte, 0),
    bosse: zahlOder(d.bosse, 0),
    proKlasse: { ...proKlasseLeer(), ...(d.proKlasse || {}) },
    stufenG: { ...STUFEN_GROMMSCH_LEER, ...(d.stufenG || {}) },
    stufenP: { ...STUFEN_PIPS_LEER, ...(d.stufenP || {}) },
    zauber,
    klick,
    regal,
    inventar,
    funde: zahlOder(d.funde, 0),
    blutRest: zahlOder(d.blutRest, 0),
    anstehend: Array.isArray(d.anstehend) ? d.anstehend.filter((k) => typeof k === 'string') : [],
    anstehenderBoss: typeof d.anstehenderBoss === 'string' ? d.anstehenderBoss : null,
    ritual: d.ritual >= 1 ? 1 : 0,
    ritualAn: d.ritualAn !== false,
    spielzeit: zahlOder(d.spielzeit, 0)
  };
}

export function loeschen() {
  try {
    localStorage.removeItem(SCHLUESSEL);
    return true;
  } catch (e) {
    return false;
  }
}

function zahlOder(wert, ersatz) {
  return typeof wert === 'number' && isFinite(wert) && wert >= 0 ? wert : ersatz;
}
