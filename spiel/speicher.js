// Spielstand sichern und laden.
//
// Gespeichert wird nur `zustand` — Währungen, Stufen, Zählwerk. Die Szene
// (fliegende Trümmer, Blutlachen) entsteht beim Zusehen ohnehin neu. Der
// Beutehaufen ist die Ausnahme: er gehört zur Bilanz, nicht zur Deko, und
// wird deshalb mitgesichert.
//
// Der Schlüssel trägt eine Fassungsnummer. Ändert sich das Format
// grundlegend, wird eine neue Nummer vergeben und der alte Stand bleibt
// unangetastet liegen, statt halb eingelesen zu werden.

import { STUFEN_LEER, DAUERHAFT_LEER } from '../werkzeuge/wirtschaft.mjs';
import { neuerZustand } from './welt.js';

export const SPEICHER_SCHLUESSEL = 'slayemall.stand.v3';
/** Frühere Fassungen, in der Reihenfolge neu nach alt. */
const ALTE_SCHLUESSEL = ['slayemall.stand.v2', 'burgtor.scene.v1'];

export function sichern(zustand, szene) {
  try {
    localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify({
      blut: zustand.blut,
      knochen: zustand.knochen,
      schrott: zustand.schrott,
      schaedel: zustand.schaedel,
      dauerhaft: zustand.dauerhaft,
      erledigte: zustand.erledigte,
      stufen: zustand.stufen,
      proKlasse: zustand.proKlasse,
      kaeufe: zustand.kaeufe,
      spielzeit: zustand.spielzeit,
      gesamtzeit: zustand.gesamtzeit,
      runde: zustand.runde,
      haufen: szene ? szene.haufen : null,
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
  for (const schluessel of ALTE_SCHLUESSEL) {
    const alt = lies(schluessel);
    if (!alt) continue;
    return schluessel === 'burgtor.scene.v1' ? ausErsterFassung(alt) : uebernehmen(alt);
  }
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
  zustand.schaedel = zahl(d.schaedel);
  zustand.erledigte = zahl(d.erledigte);
  zustand.kaeufe = zahl(d.kaeufe);
  zustand.spielzeit = zahl(d.spielzeit);
  zustand.gesamtzeit = zahl(d.gesamtzeit) || zahl(d.spielzeit);
  zustand.runde = Math.max(1, zahl(d.runde) || 1);

  // Fehlende oder unsinnige Werte werden zu 0 — ein halb gelesener Stand
  // darf nie zu `undefined` in einer Rechnung führen.
  for (const id of Object.keys(STUFEN_LEER)) zustand.stufen[id] = zahl(d.stufen?.[id]);
  for (const id of Object.keys(DAUERHAFT_LEER)) zustand.dauerhaft[id] = zahl(d.dauerhaft?.[id]);
  for (const id of Object.keys(zustand.proKlasse)) zustand.proKlasse[id] = zahl(d.proKlasse?.[id]);

  const haufen = d.haufen && typeof d.haufen === 'object'
    ? { stueck: zahl(d.haufen.stueck), knochen: zahl(d.haufen.knochen), schrott: zahl(d.haufen.schrott) }
    : null;

  return { zustand, haufen, zuletztGesehen: zahl(d.zuletztGesehen) || null };
}

/**
 * Die allererste Fassung hieß anders und war englisch benannt.
 * Sie kannte weder Schädel noch Tageslauf; ihre Ausbaustufen waren zudem
 * geschenkt und nicht bezahlt — deshalb werden sie bewusst **nicht**
 * übernommen, sonst startete man mit einem unverdienten Vorsprung.
 */
function ausErsterFassung(d) {
  if (!(d.kills >= 0)) return null;
  return uebernehmen({
    blut: d.blood,
    knochen: d.bones,
    schrott: d.scrap,
    erledigte: d.kills,
    spielzeit: d.t,
    proKlasse: d.byCls,
    stufen: null,
    dauerhaft: null
  });
}

function zahl(v) {
  return typeof v === 'number' && isFinite(v) && v > 0 ? v : 0;
}
