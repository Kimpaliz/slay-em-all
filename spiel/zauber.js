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
import { schaden, spritzen, rauchen, einfrieren } from './kampf.js';
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
    szene.flamme = {
      zeit: 0, reichweite: 0, wirkbereich: w.wirkbereich, schaden: w.schaden, qualm: 0
    };
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
 * Genau eine Fassung: Schaden auf das Ziel, Chance auf einen Krit,
 * eigene Abklingzeit. Die drei Spielarten (Midas, Inferno, Titan) sind
 * gestrichen — der Klick soll einfach bleiben.
 *
 * Alles Besondere kommt jetzt aus dem Regal: Brennende Berührung zündet
 * an, Frostgriff verlangsamt, Kettenblitz springt auf Nachbarn über.
 *
 * Gibt zurück, ob geschlagen wurde — die Oberfläche zeichnet nur dann neu.
 */
export function klickAngriff(welt, ziel, werte) {
  const { zustand, szene } = welt;
  const a = werte.wirkung;
  const w = klickWerte(zustand.klick, a);
  if (!w.gekauft) return false;
  if (szene.phase !== 'tag') return false;
  if (szene.klickAbklingzeit > 0) return false;
  if (!ziel) return false;

  const krit = Math.random() < w.krit;
  szene.klickAbklingzeit = w.abklingzeit;

  // Der sichtbare Hieb: kurzer weißer Blitz am Ziel plus Blutspritzer.
  ziel.getroffen = 0.22;
  spritzen(szene, ziel.x + 3, MASSE.DECK - ziel.klasse.hoehe * 0.6, 3, ziel.klasse.blut);

  if (a) {
    if (a.brandDps > 0 && !ziel.brand) {
      ziel.brand = { rest: 5, takt: 0, schadenJeSekunde: a.brandDps };
    }
    if (a.frostgriff > 0) einfrieren(ziel, a.frostgriff, 3);
    if (a.kettenblitz > 0) kettenSpringen(welt, ziel, w.schaden * 0.5, a.kettenblitz, werte);
  }

  schaden(welt, ziel, w.schaden * (krit ? 2 : 1), 'klick', w.art, werte, krit);
  return true;
}

/**
 * Kettenblitz: Der Klick springt auf die nächsten Nachbarn über.
 *
 * Absichtlich vor dem eigentlichen Treffer abgerechnet — sonst könnte
 * das Ziel bereits aus der Liste sein, während wir noch seine Nachbarn
 * suchen.
 */
function kettenSpringen(welt, ziel, menge, anzahl, werte) {
  const szene = welt.szene;
  const nachbarn = szene.recken
    .filter((r) => r !== ziel && r.zustand === 'laeuft')
    .sort((p, q) => Math.abs(p.x - ziel.x) - Math.abs(q.x - ziel.x))
    .slice(0, anzahl);
  for (const r of nachbarn) {
    szene.blitze.push({ x: r.x + 3, zeit: 0.22 });
    schaden(welt, r, menge, 'kette', 'blitz', werte);
  }
}

/** Der Blitz schlägt an der angeklickten Stelle ein. */
export function blitzSetzen(welt, x, werte) {
  const { zustand, szene } = welt;
  const w = werteVon(zustand, 'donner');
  // Geladene Klauen aus dem Regal legen auf den Donnerschlag drauf.
  const bonus = werte.wirkung ? 1 + werte.wirkung.donnerBonus / 100 : 1;
  szene.donnerBereit = false;
  szene.abklingzeit.donner = w.abklingzeit;
  szene.blitze.push({ x, zeit: 0 });
  szene.blitzlicht = 0.8;
  szene.ruettelt = Math.min(5, szene.ruettelt + 2.5);
  // Verbrannte Luft: ein kleines Wölkchen steigt vom Einschlag auf.
  rauchen(szene, x, MASSE.DECK - 5, 6, { dauer: 1.6, steigen: 16, streuung: 4, warm: false });

  for (let i = szene.recken.length - 1; i >= 0; i--) {
    const r = szene.recken[i];
    if (r.zustand !== 'flieht' && Math.abs(r.x + 3 - x) < w.wirkbereich) {
      schaden(welt, r, w.schaden * bonus, 'blitz', w.art, werte);
    }
  }
}
