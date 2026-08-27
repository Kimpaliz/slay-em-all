// Was passiert, wenn ein Recke stirbt.
//
// Es gibt drei Arten zu sterben, und sie unterscheiden sich in dem, was
// übrig bleibt:
//
//   im Tor       — das Monster frisst ihn. Große Sauerei, viele Einzelteile,
//                  aber nur gewöhnliche Beute.
//   auf der Brücke — Pfeil, Blitz oder Pranke. Weniger Trümmer, dafür gilt
//                  es als "besonderer Tod" und wirft mehr Gold ab.
//   verbrannt    — Flamme oder Meteorit. Er zerfällt zu Asche, es bleibt
//                  ein Häufchen liegen. Zählt ebenfalls als besonderer Tod.
//
// Der Unterschied ist Absicht: Wer nur zusieht, bekommt die Grundbeute.
// Wer eingreift, bekommt mehr — das ist der Grund, überhaupt Zauber zu
// kaufen.
//
// Gutgeschrieben wird sofort in `zustand`. Das war einmal anders: Die
// Beute wurde gesammelt und erst von der Uhr übertragen. Dadurch bekam
// jeder andere Antrieb — etwa `vorspulen()` in den Prüfungen — überhaupt
// keine Beute. Nur die Anzeige wird gedrosselt, nicht die Buchhaltung.

import { MASSE } from './masse.js';
import { melden } from './marktschreier.js';
import {
  IM_TOR_GESTORBEN, VERBRANNT, ZERMALMT, ERSCHOSSEN, ausListe, mitNamen
} from './daten/texte.js';

/** Blutspritzer an einer Stelle. */
export function spritzen(szene, x, y, menge, blutmenge) {
  const anzahl = Math.round(menge * (0.4 + blutmenge / 10));
  for (let i = 0; i < anzahl; i++) {
    szene.spritzer.push({
      x, y,
      vx: -(18 + Math.random() * 70),
      vy: -(20 + Math.random() * 70),
      lebt: 1.6,
      farbe: Math.random() < 0.25 ? '#7e1a22' : '#a82430'
    });
  }
  if (szene.spritzer.length > 190) szene.spritzer.splice(0, szene.spritzer.length - 190);
}

/** Eine Blutlache auf den Planken — benachbarte wachsen zusammen. */
export function lacheSetzen(szene, x, breite) {
  if (x < MASSE.KLIPPE - 6 || x > MASSE.TOR_RECHTS) return;
  const nah = szene.lachen.find((l) => Math.abs(l.x - x) < 3);
  if (nah) {
    nah.breite = Math.min(11, nah.breite + 1);
    nah.deckkraft = Math.min(0.95, nah.deckkraft + 0.12);
    return;
  }
  szene.lachen.push({
    x,
    breite: breite + ((Math.random() * 3) | 0),
    deckkraft: 0.45 + Math.random() * 0.3,
    tropft: 1 + Math.random() * 3
  });
  if (szene.lachen.length > 46) szene.lachen.shift();
}

/**
 * Münzen fallen lassen.
 *
 * Sie werden auf bis zu vier Stücke aufgeteilt, damit auf der Brücke
 * etwas zu sehen ist und das Aufsammeln sich lohnt. Wird es zu voll,
 * wandert der Wert der ältesten Münze auf eine liegengebliebene — der
 * Spieler verliert also nichts, nur die Übersicht bliebe sonst auf der
 * Strecke.
 */
export function muenzenFallen(szene, x, klasse, besonders, ernteFaktor) {
  let gesamt = klasse.gold;
  if (besonders) gesamt = Math.max(1, Math.round(gesamt * ernteFaktor));
  const stuecke = Math.min(4, gesamt);
  const je = Math.floor(gesamt / stuecke);
  let rest = gesamt - je * stuecke;
  for (let i = 0; i < stuecke; i++) {
    szene.muenzen.push({
      x: x + (Math.random() * 6 - 3),
      y: MASSE.DECK - 8 - Math.random() * 5,
      vx: -(8 + Math.random() * 46),
      vy: -(30 + Math.random() * 55),
      wert: je + (rest-- > 0 ? 1 : 0),
      liegt: false,
      phase: Math.random() * 6.28
    });
  }
  if (szene.muenzen.length > 80) {
    const alt = szene.muenzen.shift();
    const nah = szene.muenzen.find((m) => m.liegt);
    if (nah) nah.wert += alt.wert;
  }
}

/** Eine Münze einsammeln — von Hand bringt sie mehr als durch den Drachling. */
export function muenzeAufsammeln(welt, muenze, vonHand, stolzFaktor) {
  const szene = welt.szene;
  const i = szene.muenzen.indexOf(muenze);
  if (i < 0) return;
  const wert = Math.max(1, Math.round(muenze.wert * (vonHand ? stolzFaktor : 1)));
  szene.muenzen.splice(i, 1);
  szene.zahlen.push({ x: muenze.x, y: muenze.y - 6, text: '+' + wert, farbe: '#e0b64f', zeit: 0 });
  welt.zustand.gold += wert;
}

/**
 * Beute eines Todes gutschreiben.
 *
 * Schrott fällt in Bruchteilen an (ein Bauer bringt 0,4). Gesammelt wird
 * in `schrottRest`, gutgeschrieben nur in ganzen Stücken — sonst stünden
 * in der Anzeige krumme Zahlen.
 */
export function verbuchen(welt, klasse) {
  const zustand = welt.zustand;
  zustand.blut += klasse.blut;
  zustand.erledigte += 1;
  zustand.proKlasse[klasse.id] = (zustand.proKlasse[klasse.id] || 0) + 1;
  welt.schrottRest += klasse.schrott;
  if (welt.schrottRest >= 1) {
    const ganz = Math.floor(welt.schrottRest);
    welt.schrottRest -= ganz;
    zustand.schrott += ganz;
  }
}

/**
 * Schaden zufügen. Überlebt er, blitzt er kurz weiß auf.
 * `feuer` entscheidet, ob er zu Asche zerfällt oder in Stücke geht.
 */
export function schaden(welt, recke, menge, ursache, feuer, werte) {
  const szene = welt.szene;
  recke.lp -= menge;
  recke.getroffen = 0.18;
  if (recke.lp > 0) return;
  const i = szene.recken.indexOf(recke);
  if (i < 0) return;
  szene.recken.splice(i, 1);
  if (feuer) verbrennen(welt, recke, ursache);
  else brueckenTod(welt, recke, ursache, werte);
}

/** Er zerfällt zu Asche. Die Beute gibt es erst, wenn er ausgebrannt ist. */
export function verbrennen(welt, recke, ursache) {
  welt.szene.brennende.push({ x: recke.x, klasse: recke.klasse, zeit: 0, ursache });
  verbuchen(welt, recke.klasse);
  if (Math.random() < 0.5) melden(welt.szene, mitNamen(ausListe(VERBRANNT), recke.name));
}

/** Tod auf der Brücke durch Pfeil, Blitz oder Pranke. */
export function brueckenTod(welt, recke, ursache, werte) {
  const szene = welt.szene;
  const k = recke.klasse;
  spritzen(szene, recke.x + 3, MASSE.DECK - 6, 7, k.blut);
  const arten = ['arm', 'bein', 'schaedel'];
  for (let i = 0; i < 2; i++) {
    szene.truemmer.push({
      art: arten[(Math.random() * arten.length) | 0],
      x: recke.x + 3, y: MASSE.DECK - 8,
      vx: Math.random() * 60 - 40, vy: -(30 + Math.random() * 40),
      dreh: 0, drehTempo: Math.random() * 8 - 4, lebt: 12,
      farbe: k.rumpf, metall: k.metall, haut: k.haut, schild: k.schild || k.metall,
      rollt: false, faellt: false
    });
  }
  lacheSetzen(szene, recke.x + 3, 4);
  muenzenFallen(szene, recke.x + 3, k, ursache !== 'tor', werte.ernteFaktor);
  verbuchen(welt, k);
  szene.ruettelt = Math.min(4, szene.ruettelt + 1);
  if (ursache === 'pfeil' && Math.random() < 0.45) {
    melden(szene, mitNamen(ausListe(ERSCHOSSEN), recke.name));
  }
}

/**
 * Tod im Tor — das Monster hat ihn verdaut.
 *
 * Hier fliegen die meisten Einzelteile, weil man den Kampf selbst nicht
 * sieht: Was drinnen passiert, erzählt ausschließlich das, was
 * herauskommt.
 */
export function torTod(welt, opfer, blutmenge, ruetteln, werte) {
  const szene = welt.szene;
  const k = opfer.klasse;
  const maulX = MASSE.TOR_LINKS + 4;
  const maulY = MASSE.DECK - 10;

  szene.blitzlicht = 1;
  szene.ruettelt = Math.min(5, szene.ruettelt + (ruetteln ? 1.6 + k.hoehe / 12 : 0));
  spritzen(szene, maulX, maulY, 9 + Math.round(k.hoehe / 3), blutmenge);

  const teile = [];
  const anzahl = 2 + Math.round(blutmenge / 3.5) + (k.hoehe > 14 ? 1 : 0);
  const arten = ['arm', 'bein', 'rumpf', 'arm', 'bein'];
  for (let i = 0; i < anzahl; i++) teile.push(arten[i % arten.length]);
  if (Math.random() < 0.5) teile.push('kopf');
  if (k.helm && Math.random() < 0.6) teile.push('helm');
  if (k.schild && Math.random() < 0.4) teile.push('schild');
  if (Math.random() < 0.35) teile.push('schaedel');

  for (const art of teile) {
    const weite = art === 'schild' ? 1.7 : art === 'helm' ? 1.35 : 1;
    szene.truemmer.push({
      art,
      x: maulX, y: maulY - Math.random() * 6,
      vx: -(30 + Math.random() * 70) * weite, vy: -(45 + Math.random() * 62),
      dreh: 0, drehTempo: Math.random() * 8 - 4, lebt: 14,
      farbe: k.rumpf, metall: k.metall, haut: k.haut, schild: k.schild || k.metall,
      rollt: false, faellt: false
    });
  }
  if (szene.truemmer.length > 130) szene.truemmer.splice(0, szene.truemmer.length - 130);

  for (const rabe of szene.raben) {
    if (rabe.fliegt <= 0 && Math.random() < 0.45) {
      rabe.fliegt = 1.6 + Math.random();
      rabe.vx = -(20 + Math.random() * 40);
      rabe.vy = -(26 + Math.random() * 20);
      rabe.y = 0;
    }
  }

  muenzenFallen(szene, MASSE.TOR_LINKS - 4, k, false, werte.ernteFaktor);
  verbuchen(welt, k);
  if (Math.random() < 0.55) {
    melden(szene, mitNamen(ausListe(IM_TOR_GESTORBEN), opfer.name));
  }
}

/**
 * Die Pranke schlägt zu.
 *
 * Wer mehr Lebenspunkte hat als die Pranke Schaden macht, wird nur
 * verletzt — deshalb lohnt sich die Schadensachse bei Malvina, sobald
 * Ritter und Paladine kommen.
 */
export function zermalmen(welt, werte) {
  const szene = welt.szene;
  const pranke = szene.pranke;
  const vonX = MASSE.TOR_LINKS - pranke.reichweite - 4;
  let name = null;

  for (let i = szene.recken.length - 1; i >= 0; i--) {
    const r = szene.recken[i];
    if (r.zustand === 'flieht' || r.x < vonX || r.x > MASSE.TOR_LINKS + 6) continue;
    if (r.lp > pranke.schaden) {
      schaden(welt, r, pranke.schaden, 'pranke', false, werte);
      continue;
    }
    szene.recken.splice(i, 1);
    pranke.opfer.push({ versatz: r.x - (MASSE.TOR_LINKS - pranke.reichweite), klasse: r.klasse });
    if (!name) name = r.name;
    spritzen(szene, r.x + 3, MASSE.DECK - 5, 12, r.klasse.blut);
    lacheSetzen(szene, r.x + 3, 6);
    muenzenFallen(szene, r.x + 3, r.klasse, true, werte.ernteFaktor);
    verbuchen(welt, r.klasse);
  }

  szene.ruettelt = Math.min(6, szene.ruettelt + 4);
  szene.blitzlicht = 0.7;
  if (name) melden(szene, mitNamen(ausListe(ZERMALMT), name));
}
