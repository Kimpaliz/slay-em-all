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
//                  ein Häufchen liegen und eine Rauchfahne steigt auf.
//                  Zählt ebenfalls als besonderer Tod.
//
// Der Unterschied ist Absicht, und seit Gold die einzige Währung ist auch
// der einzige Grund, überhaupt einzugreifen: Wer nur zusieht, bekommt die
// Grundbeute. Wer eingreift, bekommt mehr.
//
// Gutgeschrieben wird sofort in `zustand`. Das war einmal anders: Die
// Beute wurde gesammelt und erst von der Uhr übertragen. Dadurch bekam
// jeder andere Antrieb — etwa `vorspulen()` in den Prüfungen — überhaupt
// keine Beute. Nur die Anzeige wird gedrosselt, nicht die Buchhaltung.

import { MASSE, festerBoden } from './masse.js';
import { klang } from './klang.js';
import { schadensFarbe, BOSS } from '../werkzeuge/wirtschaft.mjs';
import {
  artefaktErzeugen, seltenheitAuslosen, seltenheitNach, fundWurf, INVENTAR_PLAETZE, verkaufswert
} from './artefakte.js';

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

/**
 * Rauch: kleine Flocken, die langsam hochgleiten und dabei ausfaden.
 *
 * Nur Feuer- und Blitzwirkungen qualmen — die Pranke zermalmt, sie brennt
 * nicht. Absichtlich sparsam und langsam: Rauch soll nachklingen, wo eben
 * etwas passiert ist, und nicht die Szene zustellen. `art` wählt den
 * Grundton, `warm` mischt einzelne Glutflocken darunter.
 */
export function rauchen(szene, x, y, anzahl, optionen = {}) {
  const streuung = optionen.streuung != null ? optionen.streuung : 3;
  const steigen = optionen.steigen != null ? optionen.steigen : 13;
  const warm = optionen.warm !== false;
  for (let i = 0; i < anzahl; i++) {
    const glut = warm && Math.random() < 0.22;
    szene.rauch.push({
      x: x + (Math.random() * 2 - 1) * streuung,
      y: y + (Math.random() * 2 - 1) * 2,
      vx: (Math.random() * 2 - 1) * 5 + (optionen.drift || 0),
      vy: -(steigen * (0.6 + Math.random() * 0.7)),
      lebt: 0,
      dauer: (optionen.dauer || 1.5) * (0.7 + Math.random() * 0.6),
      groesse: Math.random() < 0.35 ? 2 : 1,
      glut
    });
  }
  if (szene.rauch.length > 150) szene.rauch.splice(0, szene.rauch.length - 150);
}

/** Eine Blutlache auf den Planken — benachbarte wachsen zusammen. */
/**
 * So viel Blut fasst eine Lache. Mehr laeuft weg.
 *
 * Das ist der Kern des Kreislaufs: Blut **stapelt sich nicht**. Wer
 * nicht regelmaessig wischen laesst, verliert alles, was ueber diesen
 * Wert hinaus vergossen wird. Deshalb lohnt der Putztrupp.
 */
export const LACHE_FASST = 60;

/**
 * Eine Blutlache setzen oder vergroessern.
 *
 * `blutmenge` ist, was dieser Tod an Litern beitraegt. Seit 0.13.0
 * darf das ueberall auf festem Boden geschehen — auch auf der Ebene vor
 * der Zugbruecke, wo Pfeile und Zauber die meisten Recken erwischen.
 */
export function lacheSetzen(szene, x, breite, blutmenge = 0) {
  if (!festerBoden(x)) return;
  const nah = szene.lachen.find((l) => Math.abs(l.x - x) < 6);
  if (nah) {
    nah.breite = Math.min(11, nah.breite + 1);
    nah.deckkraft = Math.min(0.95, nah.deckkraft + 0.12);
    // Was ueber die Fassungsgrenze geht, versickert.
    nah.blut = Math.min(LACHE_FASST, (nah.blut || 0) + blutmenge);
    return;
  }
  szene.lachen.push({
    x,
    breite: breite + ((Math.random() * 3) | 0),
    deckkraft: 0.45 + Math.random() * 0.3,
    tropft: 1 + Math.random() * 3,
    blut: Math.min(LACHE_FASST, blutmenge)
  });
  if (szene.lachen.length > 60) szene.lachen.shift();
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
/**
 * Ab diesem Wert je Stück wird aus Kleingeld ein Edelstein.
 *
 * Späte Recken werfen dreistellige Beträge ab. In vier Münzen zu je 60
 * Gold aufgeteilt sieht das aus wie am Anfang — dieselben vier
 * Klimperstücke, nur mit anderer Zahl daneben. Ein Edelstein zeigt auf
 * einen Blick, dass hier etwas Größeres liegt, und spart obendrein
 * Stücke auf der Brücke.
 */
export const EDELSTEIN_AB = 40;

export function muenzenFallen(szene, x, klasse, besonders, ernteFaktor, bossFaktor) {
  let gesamt = klasse.gold * (bossFaktor || 1);
  if (besonders) gesamt = Math.round(gesamt * ernteFaktor);
  gesamt = Math.max(1, Math.round(gesamt));

  // Große Beträge fallen als wenige Edelsteine statt als viel Kleingeld.
  const alsStein = gesamt >= EDELSTEIN_AB * 2;
  const stuecke = alsStein
    ? Math.min(3, Math.max(1, Math.round(gesamt / (EDELSTEIN_AB * 3))))
    : Math.min(bossFaktor ? 8 : 4, gesamt);
  const je = Math.floor(gesamt / stuecke);
  let rest = gesamt - je * stuecke;
  for (let i = 0; i < stuecke; i++) {
    szene.muenzen.push({
      x: x + (Math.random() * 6 - 3),
      y: MASSE.DECK - 8 - Math.random() * 5,
      vx: -(8 + Math.random() * 46),
      vy: -(30 + Math.random() * 55),
      wert: je + (rest-- > 0 ? 1 : 0),
      stein: alsStein,
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
export function muenzeAufsammeln(welt, muenze, vonHand, werte) {
  const szene = welt.szene;
  const i = szene.muenzen.indexOf(muenze);
  if (i < 0) return;
  klang('muenze');
  const faktor = (vonHand ? werte.stolzFaktor : 1) * (werte.muenzFaktor || 1);
  const wert = Math.max(1, Math.round(muenze.wert * faktor));
  szene.muenzen.splice(i, 1);
  szene.zahlen.push({ x: muenze.x, y: muenze.y - 6, text: '+' + wert, farbe: '#e0b64f', zeit: 0 });
  welt.zustand.gold += wert;
}

/* ---------------- Artefakte ---------------- */

/**
 * Ein Fundstück fällt auf die Brücke.
 *
 * Anders als eine Münze darf es **nie in den Abgrund rollen** — das wäre
 * zu bitter. Deshalb wird die Fallstelle auf festen Boden gezogen, und am
 * Wellenende sammelt sich alles Liegengebliebene von selbst ein.
 */
export function fundstueckFallen(welt, x, artefakt) {
  klang('fund');
  const szene = welt.szene;
  const ziel = Math.max(MASSE.KLIPPE + 4, Math.min(MASSE.TOR_RECHTS - 6, x));
  szene.fundstuecke.push({
    x: ziel, y: MASSE.DECK - 10 - Math.random() * 6,
    vx: (Math.random() * 2 - 1) * 12, vy: -(40 + Math.random() * 30),
    liegt: false, phase: Math.random() * 6.28, artefakt
  });
  const s = seltenheitNach(artefakt.seltenheit);
  szene.zahlen.push({
    x: ziel, y: MASSE.DECK - 22,
    text: s.name.toUpperCase() + '!', farbe: s.farbe, gross: true, zeit: 0
  });
}

/**
 * Ein Fundstück ins Inventar legen.
 *
 * Ist das Lager voll, zahlt sich der Fund sofort als Gold aus — verlieren
 * soll man ihn nicht, nur behalten kann man ihn dann nicht.
 */
export function fundstueckNehmen(welt, artefakt) {
  const zustand = welt.zustand;
  zustand.funde += 1;
  if (zustand.inventar.length < INVENTAR_PLAETZE) {
    zustand.inventar.push(artefakt);
    return true;
  }
  const wert = verkaufswert(artefakt);
  zustand.gold += wert;
  welt.szene.zahlen.push({
    x: MASSE.TOR_MITTE, y: MASSE.DECK - 30,
    text: 'Lager voll: +' + wert, farbe: '#e0b64f', gross: true, zeit: 0
  });
  return false;
}

/** Würfelt beim Tod, ob ein Artefakt fällt. Bosse liefern immer. */
function fundWuerfeln(welt, x, boss, werte) {
  const welle = welt.zustand.welle;
  if (boss) {
    const k = seltenheitAuslosen(welle, Math.random, 'selten');
    fundstueckFallen(welt, x, artefaktErzeugen(welle, k));
    return;
  }
  if (!werte || !fundWurf(werte.fundchance)) return;
  const k = seltenheitAuslosen(welle, Math.random);
  fundstueckFallen(welt, x, artefaktErzeugen(welle, k));
}

/* ---------------- Gift und Frost ---------------- */

/**
 * Gift ist stapelbar: Jeder Treffer legt einen eigenen Eintrag an, und
 * alle ticken parallel. Genau das macht Giftpfeile bei dichten Reihen so
 * gut — und deshalb bekommt jeder Stapel seine eigene Uhr.
 */
export function vergiften(recke, dps, dauer) {
  if (!recke.gift) recke.gift = [];
  if (recke.gift.length >= 8) recke.gift.shift();
  recke.gift.push({ rest: dauer, takt: 0, dps });
}

/** Frost verlangsamt. Der stärkste Frost gewinnt, sie stapeln nicht. */
export function einfrieren(recke, prozent, dauer) {
  const faktor = 1 - Math.min(0.75, prozent / 100);
  if (recke.frost && recke.frost.faktor <= faktor && recke.frost.rest >= dauer) return;
  recke.frost = { faktor, rest: dauer };
}

/**
 * Beute eines Todes gutschreiben.
 *
 * Gold liegt nicht hier, sondern in den Münzen auf der Brücke — hier
 * wandern die Statistiken hoch, der Blutzoll wird abgerechnet und es
 * wird um ein Artefakt gewürfelt.
 */
export function verbuchen(welt, klasse, boss, x, werte) {
  const zustand = welt.zustand;
  const liter = klasse.blut * (boss ? 4 : 1);
  zustand.blut += liter;
  zustand.erledigte += 1;
  zustand.proKlasse[klasse.id] = (zustand.proKlasse[klasse.id] || 0) + 1;
  if (boss) zustand.bosse += 1;

  // Blutzoll (legendär): Je 500 vergossene Liter eine Münze.
  if (werte && werte.wirkung && werte.wirkung.blutzoll) {
    zustand.blutRest = (zustand.blutRest || 0) + liter;
    if (zustand.blutRest >= 500) {
      const muenzen = Math.floor(zustand.blutRest / 500);
      zustand.blutRest -= muenzen * 500;
      zustand.gold += muenzen;
      welt.szene.zahlen.push({
        x: MASSE.TOR_LINKS - 10, y: MASSE.DECK - 26,
        text: 'Blutzoll +' + muenzen, farbe: '#c1444f', zeit: 0
      });
    }
  }

  fundWuerfeln(welt, x != null ? x : MASSE.TOR_LINKS - 8, boss, werte);
}

/**
 * Schaden zufügen. Überlebt er, blitzt er kurz weiß auf.
 *
 * `art` ist die Schadensart (physisch, feuer, blitz, eis, gift) und
 * bestimmt zwei Dinge: die Farbe der schwebenden Zahl und — bei Feuer —
 * ob der Getroffene zu Asche zerfällt statt in Stücke zu gehen.
 *
 * Stirbt ein brennender Recke, explodiert er und verletzt seine
 * Nachbarn; die Kette darf sich fortsetzen, weil jeder nur einmal
 * sterben kann.
 */
export function schaden(welt, recke, menge, ursache, art, werte, krit) {
  const szene = welt.szene;
  recke.lp -= menge;
  recke.getroffen = 0.18;
  schadenAnzeigen(szene, recke, menge, art, krit);
  if (recke.lp > 0) return;

  const i = szene.recken.indexOf(recke);
  if (i < 0) return;
  szene.recken.splice(i, 1);

  const brannte = !!recke.brand;
  if (art === 'feuer' || brannte) verbrennen(welt, recke, ursache, werte);
  else brueckenTod(welt, recke, ursache, werte);
  if (brannte) explodieren(welt, recke.x + 3, werte);
}

/** Die schwebende Schadenszahl über dem Getroffenen, gefärbt nach Art. */
export function schadenAnzeigen(szene, recke, menge, art, krit) {
  const wert = Math.round(menge);
  szene.zahlen.push({
    x: recke.x + 3 + (Math.random() * 4 - 2),
    y: MASSE.DECK - recke.klasse.hoehe * (recke.groesse || 1) - 7,
    text: '-' + wert,
    farbe: schadensFarbe(art, krit),
    gross: !!krit || !!recke.boss,
    zeit: 0
  });
}

/**
 * Die Explosion eines brennenden Recken.
 *
 * Der Schaden ist selbst Feuerschaden — wer daran stirbt, brennt ebenfalls.
 * So kann eine dichte Reihe als Kette hochgehen.
 */
export function explodieren(welt, x, werte) {
  const szene = welt.szene;
  szene.explosionen.push({ x, zeit: 0 });
  szene.ruettelt = Math.min(5, szene.ruettelt + 1.2);
  rauchen(szene, x, MASSE.DECK - 6, 5, { dauer: 1.7, steigen: 15 });
  for (let i = szene.recken.length - 1; i >= 0; i--) {
    const r = szene.recken[i];
    if (r.zustand === 'laeuft' && Math.abs(r.x + 3 - x) < 14) {
      // Sieben Stellen in der Signatur: (welt, recke, menge, ursache,
      // art, werte, krit). Hier fehlte die Ursache, dadurch rutschte
      // `werte` in den Platz der Schadensart und kam als `undefined`
      // an — jede Kettenexplosion warf einen Fehler mitten im Schritt.
      schaden(welt, r, 20, 'explosion', 'feuer', werte);
    }
  }
}

/** Er zerfällt zu Asche. Die Beute gibt es erst, wenn er ausgebrannt ist. */
export function verbrennen(welt, recke, ursache, werte) {
  const szene = welt.szene;
  szene.brennende.push({
    x: recke.x, klasse: recke.klasse, zeit: 0, ursache,
    boss: !!recke.boss, groesse: recke.groesse || 1
  });
  // Aschenkrone (legendär): eine Glut bleibt liegen und zündet den
  // Nächsten an, der darüber läuft.
  if (werte && werte.wirkung && werte.wirkung.aschenkrone) {
    szene.gluten.push({ x: recke.x + 3, rest: 9 });
    if (szene.gluten.length > 12) szene.gluten.shift();
  }
  verbuchen(welt, recke.klasse, recke.boss, recke.x + 3, werte);
}

/** Tod auf der Brücke durch Pfeil, Blitz oder Pranke. */
export function brueckenTod(welt, recke, ursache, werte) {
  const szene = welt.szene;
  const k = recke.klasse;
  const vomBlitz = ursache === 'blitz' || ursache === 'kette';
  klang(vomBlitz ? 'blitz' : 'brueckenTod');
  const gross = recke.groesse || 1;
  /*
    Wer vom Blitz erwischt wird, platzt.

    Der Unterschied zum gewoehnlichen Tod ist Absicht und liegt in drei
    Zahlen: dreimal so viele Blutspritzer, deutlich mehr Einzelteile,
    und alles fliegt **steil nach oben** statt zur Seite. Ein Blitz
    schlaegt von oben ein — die Reste sollen wirken, als haette es sie
    ausgeworfen, nicht umgeworfen.
  */
  spritzen(szene, recke.x + 3, MASSE.DECK - 6, (vomBlitz ? 21 : 7) * gross, k.blut);
  const arten = vomBlitz
    ? ['arm', 'bein', 'schaedel', 'rumpf', 'kopf', 'helm']
    : ['arm', 'bein', 'schaedel'];
  const teile = (vomBlitz ? 6 : 2) * gross;
  for (let i = 0; i < teile; i++) {
    szene.truemmer.push({
      art: arten[(Math.random() * arten.length) | 0],
      x: recke.x + 3, y: MASSE.DECK - 8,
      // Seitwärts bei gewöhnlichem Tod, steil nach oben beim Blitz.
      vx: vomBlitz ? (Math.random() * 70 - 35) : (Math.random() * 60 - 40),
      vy: vomBlitz ? -(90 + Math.random() * 80) : -(30 + Math.random() * 40),
      dreh: 0, drehTempo: Math.random() * (vomBlitz ? 16 : 8) - (vomBlitz ? 8 : 4), lebt: 12,
      farbe: k.rumpf, metall: k.metall, haut: k.haut, schild: k.schild || k.metall,
      rollt: false, faellt: false
    });
  }
  if (vomBlitz) {
    szene.ruettelt = Math.min(5, szene.ruettelt + 1.5);
    rauchen(szene, recke.x + 3, MASSE.DECK - 10, 4, { dauer: 1.1, steigen: 22 });
  }
  lacheSetzen(szene, recke.x + 3, 4 + (gross - 1) * 3, k.blut * gross);
  muenzenFallen(szene, recke.x + 3, k, ursache !== 'tor', werte.ernteFaktor,
    recke.boss ? BOSS.goldFaktor : 0);
  verbuchen(welt, k, recke.boss, recke.x + 3, werte);
  szene.ruettelt = Math.min(4, szene.ruettelt + 1);
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
  klang('torTod');
  const k = opfer.klasse;
  const maulX = MASSE.TOR_LINKS + 4;
  const maulY = MASSE.DECK - 10;
  const gross = opfer.groesse || 1;

  szene.blitzlicht = 1;
  szene.ruettelt = Math.min(5, szene.ruettelt + (ruetteln ? (1.6 + k.hoehe / 12) * gross : 0));
  spritzen(szene, maulX, maulY, (9 + Math.round(k.hoehe / 3)) * gross, blutmenge);

  const teile = [];
  const anzahl = (2 + Math.round(blutmenge / 3.5) + (k.hoehe > 14 ? 1 : 0)) * gross;
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

  muenzenFallen(szene, MASSE.TOR_LINKS - 4, k, false, werte.ernteFaktor,
    opfer.boss ? BOSS.goldFaktor : 0);
  verbuchen(welt, k, opfer.boss, MASSE.TOR_LINKS - 8, werte);

  // Hungriges Gemäuer (legendär): Jeder Tod im Tor macht schneller satt.
  if (werte.wirkung && werte.wirkung.hungrigesGemaeuer > 0) {
    szene.sattStapel = Math.min(10, szene.sattStapel + 1);
    szene.sattZeit = 6;
  }
  else if (Math.random() < 0.55) {
  }
}

/**
 * Die Pranke schlägt zu.
 *
 * Wer mehr Lebenspunkte hat als die Pranke Schaden macht, wird nur
 * verletzt — deshalb lohnt sich die Schadensachse bei Malvina, sobald
 * Ritter und Paladine kommen. Ein Boss wird von ihr nie zermalmt.
 */
export function zermalmen(welt, werte) {
  const szene = welt.szene;
  klang('pranke');
  const pranke = szene.pranke;
  const vonX = MASSE.TOR_LINKS - pranke.reichweite - 4;
  let name = null;

  for (let i = szene.recken.length - 1; i >= 0; i--) {
    const r = szene.recken[i];
    if (r.zustand === 'flieht' || r.x < vonX || r.x > MASSE.TOR_LINKS + 6) continue;
    if (r.lp > pranke.schaden) {
      schaden(welt, r, pranke.schaden, 'pranke', 'physisch', werte);
      continue;
    }
    szene.recken.splice(i, 1);
    pranke.opfer.push({ versatz: r.x - (MASSE.TOR_LINKS - pranke.reichweite), klasse: r.klasse });
    if (!name) name = r.name;
    spritzen(szene, r.x + 3, MASSE.DECK - 5, 12, r.klasse.blut);
    lacheSetzen(szene, r.x + 3, 6);
    muenzenFallen(szene, r.x + 3, r.klasse, true, werte.ernteFaktor, r.boss ? BOSS.goldFaktor : 0);
    verbuchen(welt, r.klasse, r.boss, r.x + 3, werte);
  }

  szene.ruettelt = Math.min(6, szene.ruettelt + 4);
  szene.blitzlicht = 0.7;
}
