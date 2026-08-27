// Die vier aktiven Fähigkeiten.
//
// Alle vier folgen demselben Muster: prüfen, ob gelernt und bereit, dann
// einen Eintrag in der Szene anlegen, den die Simulation abspielt. Das
// Auslösen selbst richtet nie direkt Schaden an — das macht die
// Simulation, wenn die Bewegung an der richtigen Stelle angekommen ist.
//
// Der Donnerschlag ist die Ausnahme: Er bewaffnet erst den Mauszeiger und
// schlägt beim Klick ein. Deshalb hat er zwei Schritte statt einem.

import { MASSE } from './masse.js';
import { schaden } from './kampf.js';
import { ZAUBER, zauberWerte } from '../werkzeuge/wirtschaft.mjs';

export function zauberNach(k) {
  return ZAUBER.find((z) => z.k === k);
}

/** Werte eines Zaubers auf seinen gekauften Stufen. */
export function werteVon(zustand, k) {
  return zauberWerte(zauberNach(k), zustand.zauber[k]);
}

/** Ist der Zauber gerade mitten in seiner Wirkung? */
export function laeuftGerade(szene, k) {
  if (k === 'pranke') return !!szene.pranke;
  if (k === 'flamme') return !!szene.flamme;
  if (k === 'meteor') return szene.meteorZeit > 0;
  return false;
}

/**
 * Kann der Zauber jetzt ausgelöst werden?
 * Gibt einen Grund zurück, wenn nicht — den zeigt die Oberfläche an.
 */
export function pruefen(welt, k) {
  const { zustand, szene } = welt;
  if (!zustand.zauber[k] || zustand.zauber[k].gelernt < 1) return 'nicht gelernt';
  if (szene.phase !== 'tag') return 'nur tagsüber';
  if (laeuftGerade(szene, k)) return 'läuft bereits';
  if (szene.abklingzeit[k] > 0) return 'kühlt ab';
  return null;
}

/**
 * Zauber auslösen.
 *
 * Rückgabe sagt, ob etwas passiert ist — die Oberfläche zeichnet sich
 * nur dann neu.
 */
export function ausloesen(welt, k) {
  const { zustand, szene } = welt;

  // Der Donnerschlag lässt sich auch wieder entschärfen.
  if (k === 'donner' && szene.donnerBereit) {
    szene.donnerBereit = false;
    return true;
  }
  if (pruefen(welt, k)) return false;

  const w = werteVon(zustand, k);

  if (k === 'pranke') {
    prankeAusfahren(szene, w);
    return true;
  }
  if (k === 'donner') {
    szene.donnerBereit = true;   // Abklingzeit läuft erst beim Einschlag
    return true;
  }
  if (k === 'flamme') {
    szene.flamme = { zeit: 0, reichweite: 0, wirkbereich: w.wirkbereich, schaden: w.schaden };
    szene.abklingzeit.flamme = w.abklingzeit;
    return true;
  }
  if (k === 'meteor') {
    szene.meteorZeit = 6;
    szene.meteorTakt = 0;
    szene.meteorWirkung = w.wirkbereich;
    szene.meteorSchaden = w.schaden;
    szene.abklingzeit.meteor = w.abklingzeit;
    return true;
  }
  return false;
}

/**
 * Die Pranke fährt aus.
 *
 * Sie reicht nur so weit, wie tatsächlich jemand steht — höchstens bis
 * zum vordersten Recken plus ein wenig. Ohne diese Begrenzung schlüge
 * sie bei einer leeren Brücke ins Nichts, was albern aussieht.
 */
function prankeAusfahren(szene, w) {
  let vordersterX = MASSE.TOR_LINKS - 40;
  for (const r of szene.recken) {
    if (r.zustand !== 'flieht' && r.x > MASSE.KLIPPE) vordersterX = Math.min(vordersterX, r.x);
  }
  const reichweite = Math.max(38, Math.min(w.wirkbereich, MASSE.TOR_LINKS - vordersterX + 10));
  szene.pranke = {
    zeit: 0,
    reichweite,
    stand: 0,
    zugeschlagen: false,
    opfer: [],
    schaden: w.schaden
  };
  szene.abklingzeit.pranke = w.abklingzeit;
}

/** Der Blitz schlägt an der angeklickten Stelle ein. */
export function blitzSetzen(welt, x, werte) {
  const { zustand, szene } = welt;
  const w = werteVon(zustand, 'donner');
  szene.donnerBereit = false;
  szene.abklingzeit.donner = w.abklingzeit;
  szene.blitze.push({ x, zeit: 0 });
  szene.blitzlicht = 0.8;
  szene.ruettelt = Math.min(5, szene.ruettelt + 2.5);

  for (let i = szene.recken.length - 1; i >= 0; i--) {
    const r = szene.recken[i];
    if (r.zustand !== 'flieht' && Math.abs(r.x + 3 - x) < w.wirkbereich) {
      schaden(welt, r, w.schaden, 'blitz', false, werte);
    }
  }
}
