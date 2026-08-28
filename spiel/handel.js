// Einkaufen bei den drei Händlern.
//
// Jeder Kauf läuft gleich ab: Ware suchen, Höchststufe und Bedingung
// prüfen, Preis holen, Gold prüfen, abbuchen, Stufe erhöhen. Schlägt eine
// Prüfung fehl, passiert schlicht nichts — die Oberfläche schaltet
// unbezahlbare Knöpfe ohnehin ab, aber verlassen sollte man sich darauf
// nicht.
//
// Alle drei kassieren dasselbe: **Gold**. Blut ist nur noch eine
// Statistik, Schrott ganz fort.

import {
  WAREN_GROMMSCH, WAREN_PIPS, ZAUBER, RITUAL_PREIS, ausbauPreis,
  KLICK, klickAusbauPreis
} from '../werkzeuge/wirtschaft.mjs';
import {
  SPRUCH_GROMMSCH, SPRUCH_PIPS, SPRUCH_MALVINA, ausListe
} from './daten/texte.js';
import { INVENTAR_PLAETZE, verkaufswert } from './artefakte.js';

/** Die drei Achsen, auf denen sich ein Zauber verbessern lässt. */
export const ACHSEN = [
  { k: 'schaden', zeichen: '⚔', name: 'Schaden' },
  { k: 'abklingzeit', zeichen: '⏱', name: 'Abklingzeit −12 %' },
  { k: 'wirkbereich', zeichen: '◎', name: 'Wirkbereich +12 %' }
];

/**
 * Ist die Ware ausgereizt oder noch gesperrt?
 *
 * `welle` wird durchgereicht, weil manche Waren erst ab einer bestimmten
 * Welle freigeschaltet sind (Tiefere Hallen ab Welle 8).
 */
export function wareZustand(ware, stufen, welle) {
  const stufe = stufen[ware.k] || 0;
  const voll = ware.max != null && stufe >= ware.max;
  const gesperrt = ware.bedingung ? !ware.bedingung(stufen, welle) : false;
  return { stufe, voll, gesperrt, preis: voll ? 0 : ware.preis(stufe) };
}

function kaufen(welt, waren, stufenName, schluessel, sprueche, spruchName) {
  const zustand = welt.zustand;
  const ware = waren.find((w) => w.k === schluessel);
  if (!ware) return false;

  const stufen = zustand[stufenName];
  const z = wareZustand(ware, stufen, zustand.welle);
  if (z.voll || z.gesperrt) return false;
  if (zustand.gold < z.preis) return false;

  zustand.gold -= z.preis;
  stufen[ware.k] = z.stufe + 1;
  welt.sprueche[spruchName] = ausListe(sprueche);
  return true;
}

export function beiGrommsch(welt, schluessel) {
  return kaufen(welt, WAREN_GROMMSCH, 'stufenG', schluessel, SPRUCH_GROMMSCH, 'grommsch');
}

export function beiPips(welt, schluessel) {
  return kaufen(welt, WAREN_PIPS, 'stufenP', schluessel, SPRUCH_PIPS, 'pips');
}

/** Einen Zauber erstmals lernen. */
export function zauberLernen(welt, schluessel) {
  const zustand = welt.zustand;
  const zauber = ZAUBER.find((z) => z.k === schluessel);
  if (!zauber) return false;
  if (zustand.zauber[schluessel].gelernt >= 1) return false;
  if (zustand.gold < zauber.preis) return false;

  zustand.gold -= zauber.preis;
  zustand.zauber[schluessel].gelernt = 1;
  welt.sprueche.malvina = ausListe(SPRUCH_MALVINA);
  return true;
}

/** Einen gelernten Zauber auf einer der drei Achsen verbessern. */
export function zauberVerbessern(welt, schluessel, achse) {
  const zustand = welt.zustand;
  const zauber = ZAUBER.find((z) => z.k === schluessel);
  if (!zauber) return false;
  const stufen = zustand.zauber[schluessel];
  if (stufen.gelernt < 1) return false;

  const preis = ausbauPreis(zauber, stufen[achse]);
  if (zustand.gold < preis) return false;

  zustand.gold -= preis;
  stufen[achse] += 1;
  welt.sprueche.malvina = ausListe(SPRUCH_MALVINA);
  return true;
}

/* ---------------- Der Klick ---------------- */

/** Die drei Achsen des Klicks — Krit statt Wirkbereich. */
export const KLICK_ACHSEN = [
  { k: 'schaden', zeichen: '⚔', name: 'Schaden +10' },
  { k: 'abklingzeit', zeichen: '⏱', name: 'Abklingzeit −12 %' },
  { k: 'krit', zeichen: '✛', name: 'Kritische Treffer +4 %' }
];

/** Den eigenen Angriff überhaupt erst lernen. */
export function klickKaufen(welt) {
  const zustand = welt.zustand;
  if (zustand.klick.gekauft >= 1) return false;
  if (zustand.gold < KLICK.preis) return false;
  zustand.gold -= KLICK.preis;
  zustand.klick.gekauft = 1;
  welt.sprueche.malvina = ausListe(SPRUCH_MALVINA);
  return true;
}

/** Eine der drei Klick-Achsen um eine Stufe erhöhen. */
export function klickVerbessern(welt, achse) {
  const zustand = welt.zustand;
  if (zustand.klick.gekauft < 1) return false;
  const preis = klickAusbauPreis(zustand.klick[achse]);
  if (zustand.gold < preis) return false;
  zustand.gold -= preis;
  zustand.klick[achse] += 1;
  welt.sprueche.malvina = ausListe(SPRUCH_MALVINA);
  return true;
}

/** Das Morgenritual kaufen — danach startet die Welle nachts von selbst. */
export function ritualKaufen(welt) {
  const zustand = welt.zustand;
  if (zustand.ritual >= 1) return false;
  if (zustand.gold < RITUAL_PREIS) return false;
  zustand.gold -= RITUAL_PREIS;
  zustand.ritual = 1;
  zustand.ritualAn = true;
  welt.sprueche.malvina = ausListe(SPRUCH_MALVINA);
  return true;
}

/** Das gekaufte Ritual an- oder abschalten. */
export function ritualUmschalten(welt) {
  if (welt.zustand.ritual < 1) return false;
  welt.zustand.ritualAn = !welt.zustand.ritualAn;
  return true;
}

/* ---------------- Artefakte ---------------- */

/**
 * Ein Artefakt aus dem Lager ins Regal legen.
 *
 * Es geht auf den ersten freien Platz. Ist keiner frei, passiert nichts —
 * absichtlich: Ein stiller Tausch würde ein ausgerüstetes Artefakt
 * verdrängen, ohne dass jemand es wollte.
 */
export function artefaktAnlegen(welt, index) {
  const zustand = welt.zustand;
  const artefakt = zustand.inventar[index];
  if (!artefakt) return false;
  const platz = zustand.regal.findIndex((a) => !a);
  if (platz < 0) return false;
  zustand.regal[platz] = artefakt;
  zustand.inventar.splice(index, 1);
  return true;
}

/** Ein Artefakt aus dem Regal zurück ins Lager. */
export function artefaktAblegen(welt, index) {
  const zustand = welt.zustand;
  const artefakt = zustand.regal[index];
  if (!artefakt) return false;
  if (zustand.inventar.length >= INVENTAR_PLAETZE) return false;
  zustand.inventar.push(artefakt);
  zustand.regal[index] = null;
  return true;
}

/**
 * Ein Artefakt verkaufen.
 *
 * Auch direkt vom Regal — der Knopf sagt dann „Ablegen & verkaufen", damit
 * niemand versehentlich seine Ausrüstung verscherbelt.
 */
export function artefaktVerkaufen(welt, ort, index) {
  const zustand = welt.zustand;
  const liste = ort === 'regal' ? zustand.regal : zustand.inventar;
  const artefakt = liste[index];
  if (!artefakt) return false;
  zustand.gold += verkaufswert(artefakt);
  if (ort === 'regal') zustand.regal[index] = null;
  else zustand.inventar.splice(index, 1);
  return true;
}
