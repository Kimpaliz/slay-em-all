// Spielstand sichern und laden.
//
// Gespeichert wird nur `zustand` — Währungen, Stufen, Zählwerk. Die Szene
// (fliegende Trümmer, Blutlachen) entsteht beim Zusehen ohnehin neu.
//
// Der Schlüssel trägt eine Fassungsnummer. Ändert sich das Format
// grundlegend, wird eine neue Nummer vergeben und der alte Stand bleibt
// unangetastet liegen, statt halb eingelesen zu werden.

import { STUFEN_LEER } from '../werkzeuge/wirtschaft.mjs';
import { neuerZustand } from './welt.js';

export const SPEICHER_SCHLUESSEL = 'slayemall.stand.v2';
/** Der Stand des Vorgängers, damit alte Spielstände nicht verlorengehen. */
const ALTER_SCHLUESSEL = 'burgtor.scene.v1';

export function sichern(zustand) {
  try {
    localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify({
      blut: zustand.blut,
      knochen: zustand.knochen,
      schrott: zustand.schrott,
      erledigte: zustand.erledigte,
      stufen: zustand.stufen,
      proKlasse: zustand.proKlasse,
      kaeufe: zustand.kaeufe,
      spielzeit: zustand.spielzeit,
      zuletztGesehen: Date.now()
    }));
    return true;
  } catch {
    return false; // privater Modus, volle Ablage — kein Grund abzustürzen
  }
}

export function laden() {
  const neu = lies(SPEICHER_SCHLUESSEL);
  if (neu) return uebernehmen(neu);
  const alt = lies(ALTER_SCHLUESSEL);
  if (alt) return ausAlterFassung(alt);
  return null;
}

function lies(schluessel) {
  try {
    const roh = localStorage.getItem(schluessel);
    if (!roh) return null;
    const daten = JSON.parse(roh);
    return daten && typeof daten === 'object' ? daten : null;
  } catch {
    return null;
  }
}

function uebernehmen(d) {
  const zustand = neuerZustand();
  zustand.blut = zahl(d.blut);
  zustand.knochen = zahl(d.knochen);
  zustand.schrott = zahl(d.schrott);
  zustand.erledigte = zahl(d.erledigte);
  zustand.kaeufe = zahl(d.kaeufe);
  zustand.spielzeit = zahl(d.spielzeit);
  // Fehlende oder unsinnige Werte werden zu 0 — ein halb gelesener Stand
  // darf nie zu `undefined` in einer Rechnung führen.
  for (const id of Object.keys(STUFEN_LEER)) zustand.stufen[id] = zahl(d.stufen?.[id]);
  for (const id of Object.keys(zustand.proKlasse)) zustand.proKlasse[id] = zahl(d.proKlasse?.[id]);
  return { zustand, zuletztGesehen: d.zuletztGesehen || null };
}

/** Der alte Stand hieß anders und war englisch benannt. */
function ausAlterFassung(d) {
  if (!(d.kills >= 0)) return null;
  const alteStufen = d.lv || {};
  const alteKlassen = d.byCls || {};
  return uebernehmen({
    blut: d.blood, knochen: d.bones, schrott: d.scrap,
    erledigte: d.kills, kaeufe: d.buys, spielzeit: d.t,
    stufen: {
      lockruf: alteStufen.lure, klinge: alteStufen.blade, tor: alteStufen.gate,
      presse: alteStufen.press, kobold: alteStufen.kobold
    },
    proKlasse: alteKlassen,
    zuletztGesehen: null
  });
}

function zahl(v) {
  return typeof v === 'number' && isFinite(v) && v > 0 ? v : 0;
}
