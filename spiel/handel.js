// Einkaufen bei den drei Händlern.
//
// Jeder Kauf läuft gleich ab: Ware suchen, Höchststufe und Bedingung
// prüfen, Preis holen, Währung prüfen, abbuchen, Stufe erhöhen. Schlägt
// eine Prüfung fehl, passiert schlicht nichts — die Oberfläche schaltet
// unbezahlbare Knöpfe ohnehin ab, aber verlassen sollte man sich darauf
// nicht.
//
// Wer womit bezahlt:
//   Grommsch — Schrott
//   Pips     — Gold
//   Malvina  — Blut

import {
  WAREN_GROMMSCH, WAREN_PIPS, ZAUBER, RITUAL_PREIS, ausbauPreis,
  KLICK, KLICK_VARIANTEN, klickAusbauPreis
} from '../werkzeuge/wirtschaft.mjs';
import {
  SPRUCH_GROMMSCH, SPRUCH_PIPS, SPRUCH_MALVINA, ausListe
} from './daten/texte.js';

/** Die drei Achsen, auf denen sich ein Zauber verbessern lässt. */
export const ACHSEN = [
  { k: 'schaden', zeichen: '⚔', name: 'Schaden' },
  { k: 'abklingzeit', zeichen: '⏱', name: 'Abklingzeit −12 %' },
  { k: 'wirkbereich', zeichen: '◎', name: 'Wirkbereich +12 %' }
];

/** Ist die Ware ausgereizt oder noch gesperrt? */
export function wareZustand(ware, stufen) {
  const stufe = stufen[ware.k] || 0;
  const voll = ware.max != null && stufe >= ware.max;
  const gesperrt = ware.bedingung ? !ware.bedingung(stufen) : false;
  return { stufe, voll, gesperrt, preis: voll ? 0 : ware.preis(stufe) };
}

function kaufen(welt, waren, stufenName, waehrung, schluessel, sprueche, spruchName) {
  const zustand = welt.zustand;
  const ware = waren.find((w) => w.k === schluessel);
  if (!ware) return false;

  const stufen = zustand[stufenName];
  const z = wareZustand(ware, stufen);
  if (z.voll || z.gesperrt) return false;
  if (zustand[waehrung] < z.preis) return false;

  zustand[waehrung] -= z.preis;
  stufen[ware.k] = z.stufe + 1;
  welt.sprueche[spruchName] = ausListe(sprueche);
  return true;
}

export function beiGrommsch(welt, schluessel) {
  return kaufen(welt, WAREN_GROMMSCH, 'stufenG', 'schrott', schluessel, SPRUCH_GROMMSCH, 'grommsch');
}

export function beiPips(welt, schluessel) {
  return kaufen(welt, WAREN_PIPS, 'stufenP', 'gold', schluessel, SPRUCH_PIPS, 'pips');
}

/** Einen Zauber erstmals lernen. */
export function zauberLernen(welt, schluessel) {
  const zustand = welt.zustand;
  const zauber = ZAUBER.find((z) => z.k === schluessel);
  if (!zauber) return false;
  if (zustand.zauber[schluessel].gelernt >= 1) return false;
  if (zustand.blut < zauber.preis) return false;

  zustand.blut -= zauber.preis;
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
  if (zustand.blut < preis) return false;

  zustand.blut -= preis;
  stufen[achse] += 1;
  welt.sprueche.malvina = ausListe(SPRUCH_MALVINA);
  return true;
}

/* ---------------- Der Klick ---------------- */

/** Die drei Achsen des Klicks — Krit statt Wirkbereich. */
export const KLICK_ACHSEN = [
  { k: 'schaden', zeichen: '⚔', name: 'Schaden +1' },
  { k: 'abklingzeit', zeichen: '⏱', name: 'Abklingzeit −12 %' },
  { k: 'krit', zeichen: '✛', name: 'Kritische Treffer +4 %' }
];

/** Den eigenen Angriff überhaupt erst lernen. */
export function klickKaufen(welt) {
  const zustand = welt.zustand;
  if (zustand.klick.gekauft >= 1) return false;
  if (zustand.blut < KLICK.preis) return false;
  zustand.blut -= KLICK.preis;
  zustand.klick.gekauft = 1;
  welt.sprueche.malvina = ausListe(SPRUCH_MALVINA);
  return true;
}

/** Eine der drei Klick-Achsen um eine Stufe erhöhen. */
export function klickVerbessern(welt, achse) {
  const zustand = welt.zustand;
  if (zustand.klick.gekauft < 1) return false;
  const preis = klickAusbauPreis(zustand.klick[achse]);
  if (zustand.blut < preis) return false;
  zustand.blut -= preis;
  zustand.klick[achse] += 1;
  welt.sprueche.malvina = ausListe(SPRUCH_MALVINA);
  return true;
}

/** Eine Spielart des Klicks kaufen (einmalig). */
export function varianteKaufen(welt, k) {
  const zustand = welt.zustand;
  const variante = KLICK_VARIANTEN.find((v) => v.k === k);
  if (!variante) return false;
  if (zustand.klick.gekauft < 1) return false;
  if (zustand.klick.varianten[k] >= 1) return false;
  if (zustand.blut < variante.preis) return false;
  zustand.blut -= variante.preis;
  zustand.klick.varianten[k] = 1;
  zustand.klick.aktiv = k;
  welt.sprueche.malvina = ausListe(SPRUCH_MALVINA);
  return true;
}

/**
 * Zwischen gekauften Spielarten umschalten.
 * Ein zweiter Druck auf die aktive schaltet zurück auf den schlichten Klick.
 */
export function varianteWaehlen(welt, k) {
  const zustand = welt.zustand;
  if (zustand.klick.gekauft < 1) return false;
  if (k !== 'normal' && !(zustand.klick.varianten[k] >= 1)) return false;
  zustand.klick.aktiv = (zustand.klick.aktiv === k) ? 'normal' : k;
  return true;
}

/** Das Morgenritual kaufen — danach startet die Welle nachts von selbst. */
export function ritualKaufen(welt) {
  const zustand = welt.zustand;
  if (zustand.ritual >= 1) return false;
  if (zustand.blut < RITUAL_PREIS) return false;
  zustand.blut -= RITUAL_PREIS;
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
