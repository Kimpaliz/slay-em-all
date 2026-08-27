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
import { schaden, spritzen, vergolden } from './kampf.js';
import { ZAUBER, zauberWerte, klickWerte } from '../werkzeuge/wirtschaft.mjs';

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

/* ---------------- Der Klick als Fähigkeit ---------------- */

/**
 * Der eigene Angriff — ein Klick auf einen Recken.
 *
 * Vier Spielarten, alle mit derselben Uhr (`szene.klickAbklingzeit`):
 *
 *   normal   — Schaden auf das eine Ziel, Chance auf einen Krit.
 *   midas    — wie normal; stirbt das Ziel daran, wird es zur Goldstatue.
 *   inferno  — Schaden plus Brand; brennende explodieren beim Tod.
 *   titan    — Flächenschlag um die Klickstelle, achtfacher Schaden,
 *              lange eigene Abklingzeit.
 *
 * Gibt zurück, ob geschlagen wurde — die Oberfläche zeichnet nur dann neu.
 */
export function klickAngriff(welt, ziel, x, werte) {
  const { zustand, szene } = welt;
  const w = klickWerte(zustand.klick);
  if (!w.gekauft) return false;
  if (szene.phase !== 'tag') return false;
  if (szene.klickAbklingzeit > 0) return false;

  const krit = Math.random() < w.krit;
  const faktor = krit ? 2 : 1;

  if (w.variante === 'titan') {
    // Die Faust trifft eine Fläche, nicht ein Ziel.
    szene.klickAbklingzeit = w.titanAbklingzeit;
    szene.explosionen.push({ x, zeit: 0 });
    szene.explosionen.push({ x: x - 10, zeit: -0.08 });
    szene.explosionen.push({ x: x + 10, zeit: -0.16 });
    szene.ruettelt = Math.min(6, szene.ruettelt + 4);
    szene.blitzlicht = 0.6;
    for (let i = szene.recken.length - 1; i >= 0; i--) {
      const r = szene.recken[i];
      if (r.zustand === 'laeuft' && Math.abs(r.x + 3 - x) < w.titanBereich) {
        schaden(welt, r, w.titanSchaden * faktor, 'titan', false, werte, krit);
      }
    }
    return true;
  }

  if (!ziel) return false;
  szene.klickAbklingzeit = w.abklingzeit;

  // Der sichtbare Hieb: kurzer weißer Blitz am Ziel plus Blutspritzer.
  ziel.getroffen = 0.22;
  spritzen(szene, ziel.x + 3, MASSE.DECK - ziel.klasse.hoehe * 0.6, 3, ziel.klasse.blut);

  const menge = w.schaden * faktor;

  if (w.variante === 'midas' && ziel.lp <= menge) {
    szene.zahlen.push({
      x: ziel.x + 3, y: MASSE.DECK - ziel.klasse.hoehe - 7,
      text: '-' + menge, farbe: krit ? '#ffd08a' : '#ff8a6a', gross: krit, zeit: 0
    });
    vergolden(welt, ziel, werte);
    return true;
  }

  if (w.variante === 'inferno' && !ziel.brand) {
    ziel.brand = { rest: w.brandDauer, takt: 0, schadenJeSekunde: w.brandSchaden };
  }

  schaden(welt, ziel, menge, 'klick', false, werte, krit);
  return true;
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
