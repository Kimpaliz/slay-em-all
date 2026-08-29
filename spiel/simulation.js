// Ein Zeitschritt der Welt.
//
// `schritt()` wird von `spiel.js` mit einer festen Schrittweite von 1/60
// Sekunde aufgerufen — nie mit dem, was der Browser gerade liefert. Das
// ist wichtig: Bei schwankender Schrittweite fliegen Trümmer je nach
// Bildrate unterschiedlich weit, und Abklingzeiten laufen ungleich ab.
//
// Die Reihenfolge im Schritt ist nicht beliebig. Erst die Phase (kann die
// Welle enden?), dann die Recken (kann die Burg überlaufen?), dann die
// Zauber, dann alles Fliegende, zuletzt die Kulisse. Wer diese Ordnung
// ändert, kann Tode um einen Bildschritt verschieben.

import { MASSE, festerBoden, ausklang } from './masse.js';
import { klang } from './klang.js';
import { reckeAnlegen } from './welt.js';
import {
  schaden, torTod, zermalmen, lacheSetzen, muenzenFallen, muenzeAufsammeln, BOSS_CC_FAKTOR, rauchen,
  vergiften, fundstueckNehmen
} from './kampf.js';
import { wirkungAus } from './artefakte.js';
import { RECKEN, FRESSZEIT_NORMAL } from './daten/recken.js';
import {
  welleGewonnen, welleVerloren, niederlageBeenden, welleStarten, bossKlasse, RITUAL_WARTEZEIT
} from './wellen.js';
import { reckenName } from './daten/texte.js';
import {
  werte as werteAus, spawnAbstand, wellenSkalierung, BOSS
} from '../werkzeuge/wirtschaft.mjs';

/** Wie blutig es zugeht: 1 bis 10. */
const BLUTMENGE = 9;

export function schritt(welt, dt, einstellungen = {}) {
  const { zustand, szene } = welt;
  // Die Summe des Regals wird jeden Schritt neu gebildet — fünf Plätze mit
  // je höchstens vier Affixen, das ist billiger als jede Buchhaltung, die
  // aus dem Takt geraten könnte.
  const wirkung = wirkungAus(zustand.regal);
  const werte = werteAus(zustand.stufenG, zustand.stufenP, wirkung);
  // Hungriges Gemäuer: gestapelte Fressboni, jeder 3 %.
  if (wirkung.hungrigesGemaeuer > 0 && szene.sattStapel > 0) {
    werte.fressTempo *= 1 + 0.03 * szene.sattStapel;
  }
  const blutmenge = einstellungen.blutmenge != null ? einstellungen.blutmenge : BLUTMENGE;
  const ruetteln = einstellungen.ruetteln !== false;

  szene.zeit += dt;
  zustand.spielzeit += dt;

  if (szene.sattZeit > 0) {
    szene.sattZeit -= dt;
    if (szene.sattZeit <= 0) szene.sattStapel = 0;
  }

  daemmerungFuehren(szene, dt);
  phaseFuehren(welt, dt, werte);
  reckenFuehren(welt, dt, werte);
  abklingzeitenFuehren(szene, dt);

  wischerFuehren(welt, dt, werte);
  heilungFuehren(welt, dt);
  brandFuehren(welt, dt, werte);
  giftFuehren(welt, dt, werte);
  prankeFuehren(welt, dt, werte);
  schuetzenFuehren(welt, dt, werte);
  pfeileFuehren(welt, dt, werte);
  blitzeFuehren(szene, dt);
  flammeFuehren(welt, dt, werte);
  napalmFuehren(welt, dt, werte);
  meteoreFuehren(welt, dt, werte);
  brennendeFuehren(welt, dt, werte);
  brandfleckenFuehren(szene, dt);
  glutenFuehren(welt, dt, werte);

  muenzenFuehren(welt, dt, werte);
  fundstueckeFuehren(welt, dt);
  drachlingFuehren(welt, dt, werte);
  truemmerFuehren(szene, dt, blutmenge);
  spritzerFuehren(szene, dt);
  rauchFuehren(szene, dt);
  lachenFuehren(szene, dt);
  kleinkramFuehren(szene, dt);
  tiereFuehren(szene, dt);

  if (szene.ruettelt > 0) szene.ruettelt = Math.max(0, szene.ruettelt - dt * 9);
  if (szene.blitzlicht > 0) szene.blitzlicht = Math.max(0, szene.blitzlicht - dt * 3.2);
  if (szene.spruchband) {
    szene.spruchband.zeit += dt;
    if (szene.spruchband.zeit > szene.spruchband.dauer) szene.spruchband = null;
  }
  void ruetteln;
}

/* ---------------- Phasen ---------------- */

/**
 * Der Farbwechsel hinkt der Phase absichtlich hinterher.
 *
 * Erst wenn die Dämmerung halb vorbei ist, springt das Bild von Nacht
 * auf Tag. Dadurch wirkt der Übergang wie ein Überblenden statt wie ein
 * Lichtschalter.
 */
function daemmerungFuehren(szene, dt) {
  if (szene.daemmerung > 0) szene.daemmerung -= dt;
  const sollTag = szene.phase === 'tag' || szene.phase === 'niederlage';
  if (szene.daemmerung <= 0.55 && szene.sichtbarTag !== sollTag) szene.sichtbarTag = sollTag;
}

function phaseFuehren(welt, dt, werte) {
  const { zustand, szene } = welt;

  if (szene.phase === 'tag') {
    if (szene.erschienen < szene.wellenGroesse) {
      szene.naechsterRecke -= dt;
      if (szene.naechsterRecke <= 0) {
        const skala = wellenSkalierung(zustand.welle);
        const abstand = spawnAbstand(zustand.welle);
        szene.naechsterRecke = abstand * (0.7 + Math.random() * 0.6);
        truppSetzen(welt, skala);
      }
    }

    // Verdauung als Warteschlange: Nur die vordersten `schlund` Recken
    // werden gefressen, der Rest wartet. Die Kapazität ist der Puffer,
    // der Schlund der Durchsatz — zwei getrennte Käufe, zwei Nöte.
    const maeuler = Math.min(werte.schlund, szene.imTor.length);
    for (let i = maeuler - 1; i >= 0; i--) {
      // Es zaehlt eine Zeit herunter, kein Leben. Wie zaeh einer auf der
      // Bruecke war, spielt hier keine Rolle mehr — nur, was seine
      // Klasse an Fresszeit mitbringt.
      szene.imTor[i].fressRest -= werte.fressTempo * dt;
      if (szene.imTor[i].fressRest <= 0) {
        const opfer = szene.imTor[i];
        szene.imTor.splice(i, 1);
        torTod(welt, opfer, 9, true, werte);
      }
    }

    const fertig = szene.erschienen >= szene.wellenGroesse
      && szene.recken.length === 0
      && szene.imTor.length === 0
      && szene.brennende.length === 0
      && !szene.pranke;
    if (fertig) {
      wellenEndeEinsammeln(welt, werte);
      welleGewonnen(welt);
    }
  }

  if (szene.phase === 'nacht') {
    szene.nachtzeit += dt;
    if (zustand.ritual >= 1 && zustand.ritualAn && szene.nachtzeit >= RITUAL_WARTEZEIT) {
      welleStarten(welt);
    }
  }

  if (szene.phase === 'niederlage') {
    szene.niederlageZeit += dt;
    const vorbei = (szene.niederlageZeit > 3 && szene.recken.length === 0) || szene.niederlageZeit > 7;
    if (vorbei) niederlageBeenden(welt);
  }
}

/**
 * Wellenende: Liegengebliebenes einsammeln.
 *
 * Fundstücke gehen **immer** ins Lager — ein Artefakt zu verlieren, weil
 * man einen Klick verpasst hat, wäre zu bitter. Münzen nur mit dem
 * Rabenpakt: Dann tragen die Raben ein, was liegen blieb.
 */
function wellenEndeEinsammeln(welt, werte) {
  const szene = welt.szene;
  while (szene.fundstuecke.length) {
    const f = szene.fundstuecke.pop();
    fundstueckNehmen(welt, f.artefakt);
  }
  if (werte.wirkung && werte.wirkung.rabenpakt) {
    for (let i = szene.muenzen.length - 1; i >= 0; i--) {
      const m = szene.muenzen[i];
      if (!m.liegt) continue;
      for (const rabe of szene.raben) {
        if (rabe.fliegt <= 0 && Math.random() < 0.4) {
          rabe.fliegt = 1.2 + Math.random();
          rabe.vx = 30 + Math.random() * 30;
          rabe.vy = -(20 + Math.random() * 16);
          rabe.y = 0;
          break;
        }
      }
      muenzeAufsammeln(welt, m, false, werte);
    }
  }
}

/**
 * Ein Stoßtrupp erscheint.
 *
 * Ab Welle 5 kommen die Recken nicht mehr einzeln, sondern zu mehreren
 * auf einmal — versetzt, damit man sie noch auseinanderhalten kann. Der
 * Spawn-Abstand wächst dafür mit, die Gesamtmenge bleibt gleich; nur die
 * Spitzenlast am Tor steigt. Der Boss kommt zuletzt und immer allein.
 */
function truppSetzen(welt, skala) {
  const { zustand, szene } = welt;
  const liste = szene.spawnListe || [];

  if (!liste.length && szene.spawnBoss) {
    const klasse = bossKlasse(zustand.welle);
    const boss = reckeAnlegen(szene, klasse, szene.spawnBoss, skala, BOSS);
    szene.spawnBoss = null;
    szene.erschienen++;
    szene.recken.push(boss);
    return;
  }

  const wieviele = Math.min(skala.truppGroesse, liste.length, szene.wellenGroesse - szene.erschienen);
  for (let i = 0; i < wieviele; i++) {
    const id = liste.shift();
    const klasse = RECKEN.find((r) => r.id === id) || RECKEN[0];
    const recke = reckeAnlegen(szene, klasse, reckenName(), skala, null);
    recke.x -= i * 7;
    szene.erschienen++;
    szene.recken.push(recke);
  }
}

/* ---------------- Recken ---------------- */

function reckenFuehren(welt, dt, werte) {
  const { szene } = welt;
  const prankeVorderkante = szene.pranke ? MASSE.TOR_LINKS - szene.pranke.stand : Infinity;
  const raureif = werte.wirkung ? werte.wirkung.raureif / 100 : 0;

  for (let i = szene.recken.length - 1; i >= 0; i--) {
    const r = szene.recken[i];
    if (r.getroffen > 0) r.getroffen -= dt;
    if (r.ccSperre > 0) r.ccSperre -= dt;
    if (r.frost) {
      r.frost.rest -= dt;
      if (r.frost.rest <= 0) delete r.frost;
    }

    if (r.zustand === 'flieht') {
      r.x -= r.tempo * 1.5 * dt;
      if (r.x < -12) szene.recken.splice(i, 1);
      continue;
    }

    // Vor der ausgefahrenen Pranke bleibt man stehen.
    r.wartet = false;
    if (szene.pranke && r.x > prankeVorderkante - 9 && r.x < MASSE.TOR_LINKS) {
      r.wartet = true;
      continue;
    }

    // Frost aus dem Regal bremst, Raureif bremst kurz vor dem Tor.
    let tempo = r.tempo;
    if (r.frost) tempo *= r.frost.faktor;
    // Raureif ist ebenfalls eine Beeinträchtigung — auf einen Boss wirkt
    // sie nur zu einem Zehntel, und auch das nur außerhalb seiner Sperre.
    if (raureif > 0 && r.x > MASSE.TOR_LINKS - 40) {
      const wirkt = r.boss ? (r.ccSperre > 0 ? 0 : raureif * BOSS_CC_FAKTOR) : raureif;
      tempo *= 1 - wirkt;
    }

    r.x += tempo * dt;
    if (r.x >= MASSE.TOR_EINTRITT) {
      szene.recken.splice(i, 1);

      // Der Boss wird nicht gefressen. Erreicht er das Tor, ist die
      // Burg auf der Stelle verloren — er ist eine Frist, keine
      // Mahlzeit. Deshalb muss er auf der Brücke sterben.
      if (r.boss) {
        szene.bossDurch = r.name;
        welleVerloren(welt);
        break;
      }

      const fressZeit = r.klasse.fressZeit || FRESSZEIT_NORMAL;
      szene.imTor.push({
        klasse: r.klasse, name: r.name, lp: r.lp, maxLp: r.maxLp,
        fressZeit, fressRest: fressZeit,
        groesse: r.groesse || 1
      });
      if (szene.imTor.length > werte.kapazitaet) {
        welleVerloren(welt);
        break;
      }
    }
  }
}

/**
 * Der Heilzauberer hält seine Nachbarn am Leben.
 *
 * Er heilt in einem festen Umkreis und **nicht sich selbst** — sonst
 * wäre er in einer Gruppe von zweien unsterblich. Geheilt wird nur bis
 * zum vollen Leben; wer schon voll ist, kostet nichts.
 *
 * Für die Anzeige merkt sich jeder Geheilte einen kurzen Schimmer.
 */
function heilungFuehren(welt, dt) {
  const szene = welt.szene;
  const heiler = szene.recken.filter((r) => r.klasse.heilt && r.zustand === 'laeuft');
  if (!heiler.length) return;

  for (const h of heiler) {
    const { reichweite, proSekunde } = h.klasse.heilt;
    for (const r of szene.recken) {
      if (r === h || r.zustand !== 'laeuft') continue;
      if (r.lp >= r.maxLp) continue;
      if (Math.abs(r.x - h.x) > reichweite) continue;
      r.lp = Math.min(r.maxLp, r.lp + proSekunde * dt);
      r.geheilt = 0.35;
    }
  }
  // Der Schimmer verblasst.
  for (const r of szene.recken) {
    if (r.geheilt > 0) r.geheilt = Math.max(0, r.geheilt - dt);
  }
}

/**
 * Die Putzgoblins.
 *
 * Der Kreislauf, den sie schliessen: Blut faellt beim Sterben als Lache
 * auf den Boden und ist dort **noch kein Geld**. Erst wenn ein Goblin
 * hinlaeuft und aufwischt, wird es gutgeschrieben. Weil eine Lache nur
 * `LACHE_FASST` Liter haelt, geht alles verloren, was daneben vergossen
 * wird, solange niemand abtraegt — deshalb lohnt sich der Putztrupp.
 *
 * Jeder Goblin hat drei Zustaende: `hin` (zur Lache), `wischt` (dabei),
 * `heim` (zurueck ans Tor). Er sucht immer die **volleste erreichbare**
 * Lache, nicht die naechste — sonst wischte er ewig an Tropfen herum,
 * waehrend die grosse Pfuetze ueberlaeuft.
 */
function wischerFuehren(welt, dt, werte) {
  const { zustand, szene } = welt;
  const heim = MASSE.TOR_LINKS - 6;

  // Fehlende Goblins nachziehen, ueberzaehlige gehen heim und verschwinden.
  while (szene.wischer.length < werte.wischer) {
    szene.wischer.push({ x: heim, ziel: null, tun: 'heim', fortschritt: 0, phase: Math.random() * 6.28 });
  }
  if (szene.wischer.length > werte.wischer) szene.wischer.length = werte.wischer;

  for (const g of szene.wischer) {
    g.phase += dt * 6;

    if (g.tun === 'wischt') {
      g.fortschritt += dt;
      if (g.fortschritt >= 0.7) {
        const i = szene.lachen.indexOf(g.ziel);
        if (i >= 0) {
          const gewonnen = Math.round(g.ziel.blut || 0);
          szene.lachen.splice(i, 1);
          if (gewonnen > 0) {
            zustand.blut += gewonnen;
            szene.zahlen.push({
              x: g.x, y: MASSE.DECK - 14,
              text: '+' + gewonnen, farbe: '#c1444f', zeit: 0
            });
          }
        }
        g.ziel = null;
        g.tun = 'heim';
      }
      continue;
    }

    if (g.tun === 'hin') {
      // Ziel verschwunden? Dann heim.
      if (!g.ziel || szene.lachen.indexOf(g.ziel) < 0) { g.ziel = null; g.tun = 'heim'; continue; }
      const weg = g.ziel.x - g.x;
      if (Math.abs(weg) < 3) { g.tun = 'wischt'; g.fortschritt = 0; continue; }
      g.x += Math.sign(weg) * werte.wischTempo * dt;
      continue;
    }

    // 'heim': zurueck ans Tor, unterwegs nach Arbeit schauen
    const belegt = szene.wischer.map((a) => a.ziel).filter(Boolean);
    let beste = null;
    for (const l of szene.lachen) {
      if (!l.blut || l.blut < 1) continue;
      if (belegt.includes(l)) continue;
      if (!beste || l.blut > beste.blut) beste = l;
    }
    if (beste) { g.ziel = beste; g.tun = 'hin'; continue; }

    const weg = heim - g.x;
    if (Math.abs(weg) > 2) g.x += Math.sign(weg) * werte.wischTempo * 0.8 * dt;
  }
}

function abklingzeitenFuehren(szene, dt) {
  for (const k in szene.abklingzeit) {
    if (szene.abklingzeit[k] > 0) szene.abklingzeit[k] = Math.max(0, szene.abklingzeit[k] - dt);
  }
  if (szene.klickAbklingzeit > 0) szene.klickAbklingzeit = Math.max(0, szene.klickAbklingzeit - dt);
}

/**
 * Brennende Recken verlieren jede volle Sekunde Lebenspunkte.
 *
 * Brand entsteht derzeit nirgends von selbst — die Infernale Berührung
 * ist gestrichen. Der Pfad bleibt, weil Artefakte ihn wieder anzünden
 * werden, und weil brennende Recken sichtbar qualmen.
 */
function brandFuehren(welt, dt, werte) {
  const szene = welt.szene;
  for (let i = szene.recken.length - 1; i >= 0; i--) {
    const r = szene.recken[i];
    if (!r.brand || r.zustand !== 'laeuft') continue;
    r.brand.rest -= dt;
    r.brand.takt += dt;
    if (Math.random() < dt * 6) {
      rauchen(szene, r.x + 3, MASSE.DECK - r.klasse.hoehe, 1, { dauer: 1.1, steigen: 15 });
    }
    if (r.brand.takt >= 1) {
      r.brand.takt -= 1;
      schaden(welt, r, r.brand.schadenJeSekunde, 'brand', 'feuer', werte);
      continue;   // schaden() kann den Recken entfernt haben
    }
    if (r.brand.rest <= 0) delete r.brand;
  }
}

/**
 * Gift tickt — und zwar jeder Stapel für sich.
 *
 * Das ist der Unterschied zum Brand: Gift ist stapelbar, also darf nicht
 * eine gemeinsame Uhr laufen. Wer in eine Wolke Giftpfeile läuft, trägt
 * mehrere Stapel und verliert entsprechend schneller Leben.
 */
function giftFuehren(welt, dt, werte) {
  const szene = welt.szene;
  for (let i = szene.recken.length - 1; i >= 0; i--) {
    const r = szene.recken[i];
    if (!r.gift || !r.gift.length || r.zustand !== 'laeuft') continue;
    let summe = 0;
    for (let j = r.gift.length - 1; j >= 0; j--) {
      const g = r.gift[j];
      g.rest -= dt;
      g.takt += dt;
      if (g.takt >= 1) { g.takt -= 1; summe += g.dps; }
      if (g.rest <= 0) r.gift.splice(j, 1);
    }
    if (!r.gift.length) delete r.gift;
    if (summe > 0) schaden(welt, r, summe, 'gift', 'gift', werte);
  }
}

/**
 * Glutflecken der Aschenkrone.
 *
 * Sie liegen still, bis jemand darüberläuft — dann brennt der und die
 * Glut ist verbraucht. Eine Kette ist möglich und gewollt: Wer brennend
 * stirbt, lässt eine neue Glut liegen.
 */
function glutenFuehren(welt, dt, werte) {
  const szene = welt.szene;
  const dps = werte.wirkung && werte.wirkung.brandDps > 0 ? werte.wirkung.brandDps : 10;
  for (let i = szene.gluten.length - 1; i >= 0; i--) {
    const g = szene.gluten[i];
    g.rest -= dt;
    if (Math.random() < dt * 3) {
      rauchen(szene, g.x, MASSE.DECK - 2, 1, { dauer: 1.6, steigen: 9, streuung: 2 });
    }
    if (g.rest <= 0) { szene.gluten.splice(i, 1); continue; }
    const opfer = szene.recken.find(
      (r) => r.zustand === 'laeuft' && !r.brand && Math.abs(r.x + 3 - g.x) < 4
    );
    if (opfer) {
      opfer.brand = { rest: 5, takt: 0, schadenJeSekunde: dps };
      szene.gluten.splice(i, 1);
    }
  }
}

/* ---------------- Zauber ---------------- */

/**
 * Die Pranke in vier Abschnitten: ausfahren, zuschlagen, einziehen, weg.
 * Beim Einziehen schleift sie die Reste über die Planken und hinterlässt
 * eine Spur.
 */
function prankeFuehren(welt, dt, werte) {
  const szene = welt.szene;
  const p = szene.pranke;
  if (!p) return;

  p.zeit += dt;
  if (p.zeit < 0.3) {
    p.stand = p.reichweite * ausklang(p.zeit / 0.3);
  } else if (p.zeit < 0.55) {
    p.stand = p.reichweite + Math.sin(p.zeit * 60) * 1.2;
    if (!p.zugeschlagen) {
      p.zugeschlagen = true;
      zermalmen(welt, werte);
    }
  } else if (p.zeit < 2.0) {
    const k = (p.zeit - 0.55) / 1.45;
    p.stand = p.reichweite * (1 - k);
    if (p.opfer.length && Math.random() < dt * 14) {
      lacheSetzen(szene, MASSE.TOR_LINKS - p.stand + Math.random() * Math.min(20, p.stand), 3);
    }
  } else {
    szene.pranke = null;
  }
}

function schuetzenFuehren(welt, dt, werte) {
  const szene = welt.szene;
  if (werte.schuetzen <= 0 || szene.phase !== 'tag') return;

  while (szene.schuetzenTakt.length < werte.schuetzen) {
    szene.schuetzenTakt.push(1 + Math.random() * 2);
  }

  for (let a = 0; a < werte.schuetzen; a++) {
    szene.schuetzenTakt[a] -= dt;
    if (szene.schuetzenTakt[a] > 0) continue;
    szene.schuetzenTakt[a] = 2.2 + Math.random() * 1.1;

    const ziele = szene.recken.filter(
      (r) => r.zustand === 'laeuft' && r.x > MASSE.KLIPPE - 10 && r.x < MASSE.MAUER - 14
    );
    if (!ziele.length) continue;

    // Vorhalten: Es wird dorthin geschossen, wo das Ziel gleich sein wird.
    const ziel = ziele[(Math.random() * ziele.length) | 0];
    const ax = MASSE.SCHUETZE_X + a * 24;
    const ay = 22;
    const flugzeit = Math.max(0.45, Math.min(1.1, (ax - ziel.x) / 150));
    klang('pfeil');
    szene.pfeile.push({
      x: ax, y: ay,
      vx: ((ziel.x + ziel.tempo * flugzeit + 3) - ax) / flugzeit,
      vy: ((MASSE.DECK - 7) - ay - 0.5 * 150 * flugzeit * flugzeit) / flugzeit
    });
  }
}

function pfeileFuehren(welt, dt, werte) {
  const szene = welt.szene;
  for (let i = szene.pfeile.length - 1; i >= 0; i--) {
    const p = szene.pfeile[i];
    p.vy += 150 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.y >= MASSE.DECK - 11 && p.y < MASSE.DECK) {
      const treffer = szene.recken.find(
        (r) => r.zustand === 'laeuft' && Math.abs(r.x + 3 - p.x) < 4.5
      );
      if (treffer) {
        szene.pfeile.splice(i, 1);
        szene.spritzer.push({ x: p.x, y: p.y, vx: -20, vy: -30, lebt: 0.7, farbe: '#a82430' });
        const a = werte.wirkung;
        // Glutpfeile zünden an, Giftpfeile vergiften alles im Umkreis.
        if (a && a.glutpfeilChance > 0 && !treffer.brand
          && Math.random() * 100 < a.glutpfeilChance) {
          treffer.brand = { rest: 5, takt: 0, schadenJeSekunde: a.brandDps > 0 ? a.brandDps : 10 };
        }
        if (a && a.giftpfeilDps > 0) {
          const dauer = 4 + a.giftDauer;
          for (const r of szene.recken) {
            if (r.zustand === 'laeuft' && Math.abs(r.x + 3 - p.x) < 12) {
              vergiften(r, a.giftpfeilDps, dauer);
            }
          }
        }
        // Zielwasser: Chance auf einen kritischen Pfeil mit doppeltem Schaden.
        const krit = Math.random() < werte.schuetzenKrit;
        schaden(welt, treffer, werte.pfeilSchaden * (krit ? 2 : 1), 'pfeil', 'physisch', werte, krit);
        continue;
      }
    }
    if (p.y >= MASSE.DECK - 1) {
      szene.pfeile.splice(i, 1);
      if (p.x > MASSE.KLIPPE - 4 && p.x < MASSE.TOR_RECHTS) szene.steckende.push({ x: p.x, zeit: 5 });
      continue;
    }
    if (p.x < -8 || p.x > MASSE.BREITE + 8 || p.y > MASSE.HOEHE) szene.pfeile.splice(i, 1);
  }

  for (let i = szene.steckende.length - 1; i >= 0; i--) {
    szene.steckende[i].zeit -= dt;
    if (szene.steckende[i].zeit <= 0) szene.steckende.splice(i, 1);
  }
}

function blitzeFuehren(szene, dt) {
  for (let i = szene.blitze.length - 1; i >= 0; i--) {
    szene.blitze[i].zeit += dt;
    if (szene.blitze[i].zeit > 0.4) szene.blitze.splice(i, 1);
  }
}

/**
 * Die Flamme fährt aus und zündet jeden einmal an.
 * `versengt` verhindert, dass derselbe Recke in mehreren Bildschritten
 * mehrfach Schaden nimmt.
 *
 * Sie qualmt, solange sie brennt, und noch eine Weile danach — der Rauch
 * gleitet über die Planken hoch und fadet aus.
 */
/**
 * Der Napalm-Wurf und der Brandboden, den er hinterlaesst.
 *
 * Zwei Abschnitte: Solange `zeit < dauer` fallen Brocken ins Gebiet und
 * zuenden Getroffene an. Jeder Einschlag legt ausserdem eine brennende
 * Stelle auf den Boden, die drei Sekunden haelt — wer danach
 * hindurchlaeuft, faengt ebenfalls Feuer. Deshalb lohnt es sich, das
 * Gebiet **vor** die Recken zu legen statt auf sie.
 */
function napalmFuehren(welt, dt, werte) {
  const szene = welt.szene;
  const n = szene.napalm;

  if (n) {
    n.zeit += dt;
    n.takt -= dt;
    if (n.takt <= 0) {
      n.takt = 0.11;
      const x = n.von + Math.random() * (n.bis - n.von);
      szene.explosionen.push({ x, zeit: 0.2 });
      rauchen(szene, x, MASSE.DECK - 7, 2, { dauer: 2.2, steigen: 16, streuung: 4 });
      // Eine brennende Stelle bleibt liegen.
      szene.brandboden.push({ x, rest: 3, breite: 14 });
      if (szene.brandboden.length > 26) szene.brandboden.shift();
      if (festerBoden(x)) {
        szene.brandflecken.push({ x, breite: 4 + Math.random() * 4 });
        if (szene.brandflecken.length > 30) szene.brandflecken.shift();
      }
      // Wer im Einschlag steht, brennt sofort.
      for (let i = szene.recken.length - 1; i >= 0; i--) {
        const r = szene.recken[i];
        if (r.zustand !== 'laeuft') continue;
        if (Math.abs(r.x + 3 - x) < 13) schaden(welt, r, n.schaden, 'napalm', 'feuer', werte);
      }
    }
    if (n.zeit >= n.dauer) szene.napalm = null;
  }

  // Der Boden brennt nach und zuendet Durchlaeufer an.
  for (let i = szene.brandboden.length - 1; i >= 0; i--) {
    const b = szene.brandboden[i];
    b.rest -= dt;
    if (b.rest <= 0) { szene.brandboden.splice(i, 1); continue; }
    if (Math.random() < dt * 6) {
      rauchen(szene, b.x + (Math.random() * 10 - 5), MASSE.DECK - 4, 1,
        { dauer: 1.4, steigen: 14, streuung: 2 });
    }
    for (const r of szene.recken) {
      if (r.zustand !== 'laeuft' || r.brand) continue;
      if (Math.abs(r.x + 3 - b.x) < b.breite / 2) {
        r.brand = { rest: 3, takt: 0, schadenJeSekunde: Math.max(10, Math.round(werte.pfeilSchaden)) };
      }
    }
  }
}

function flammeFuehren(welt, dt, werte) {
  const szene = welt.szene;
  const f = szene.flamme;
  if (!f) return;

  f.zeit += dt;
  f.reichweite = f.zeit < 0.5 ? ausklang(f.zeit / 0.5) * f.wirkbereich : f.wirkbereich;

  // Rauch entsteht über der ganzen Zunge, nach vorn hin dichter.
  f.qualm += dt;
  const takt = f.zeit < 1.2 ? 0.045 : 0.11;
  while (f.qualm >= takt) {
    f.qualm -= takt;
    const x = MASSE.TOR_LINKS - Math.random() * f.reichweite;
    rauchen(szene, x, MASSE.DECK - 8 - Math.random() * 5, 1, {
      dauer: 1.9, steigen: 12, streuung: 2, drift: -5
    });
  }

  if (f.zeit < 1.1) {
    for (let i = szene.recken.length - 1; i >= 0; i--) {
      const r = szene.recken[i];
      if (r.zustand !== 'laeuft' || r.versengt) continue;
      if (r.x + 6 > MASSE.TOR_LINKS - f.reichweite && r.x < MASSE.TOR_LINKS) {
        r.versengt = true;
        schaden(welt, r, f.schaden, 'flamme', 'feuer', werte);
      }
    }
  }
  if (f.zeit > 1.5) szene.flamme = null;
}

function meteoreFuehren(welt, dt, werte) {
  const szene = welt.szene;

  if (szene.meteorZeit > 0) {
    szene.meteorZeit -= dt;
    szene.meteorTakt -= dt;
    if (szene.meteorTakt <= 0) {
      szene.meteorTakt = 0.38;
      // Der Schauer geht dort nieder, wo die Recken tatsächlich sind.
      // Vorher lag der Bereich fest zwischen Klippe und Tor — auf der
      // verbreiterten Bühne waren das nur noch 204 von 635 Punkten
      // Laufweg, das ganze neue Land bekam nichts ab.
      const zone = szene.meteorZone || { von: MASSE.KLIPPE, bis: MASSE.TOR_RECHTS };
      szene.meteore.push({
        x: zone.von + Math.random() * Math.max(20, zone.bis - zone.von) + 26,
        y: -10, vx: -26, vy: 100
      });
    }
  }

  for (let i = szene.meteore.length - 1; i >= 0; i--) {
    const m = szene.meteore[i];
    m.vy += 60 * dt;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    // Rauchfahne hinter dem fallenden Stein.
    if (m.y > 0 && Math.random() < dt * 22) {
      rauchen(szene, m.x + 1, m.y, 1, { dauer: 1.2, steigen: 5, streuung: 1 });
    }
    if (m.y < MASSE.DECK - 3) continue;

    szene.meteore.splice(i, 1);
    szene.explosionen.push({ x: m.x, zeit: 0 });
    szene.ruettelt = Math.min(5, szene.ruettelt + 1.5);
    rauchen(szene, m.x, MASSE.DECK - 5, 4, { dauer: 2.1, steigen: 14, streuung: 4 });
    if (m.x > MASSE.KLIPPE - 4 && m.x < MASSE.TOR_RECHTS) {
      szene.brandflecken.push({ x: m.x, breite: 5 + Math.random() * 4, qualm: 3 + Math.random() * 3 });
      if (szene.brandflecken.length > 30) szene.brandflecken.shift();
    }
    for (let j = szene.recken.length - 1; j >= 0; j--) {
      const r = szene.recken[j];
      if (r.zustand === 'laeuft' && Math.abs(r.x + 3 - m.x) < szene.meteorWirkung) {
        schaden(welt, r, szene.meteorSchaden, 'meteor', 'feuer', werte);
      }
    }
  }

  for (let i = szene.explosionen.length - 1; i >= 0; i--) {
    szene.explosionen[i].zeit += dt;
    if (szene.explosionen[i].zeit > 0.5) szene.explosionen.splice(i, 1);
  }
}

/** Frische Brandflecken schwelen noch ein paar Sekunden nach. */
function brandfleckenFuehren(szene, dt) {
  for (const f of szene.brandflecken) {
    if (!(f.qualm > 0)) continue;
    f.qualm -= dt;
    if (Math.random() < dt * 4) {
      rauchen(szene, f.x, MASSE.DECK - 2, 1, { dauer: 2.2, steigen: 8, streuung: 2, warm: false });
    }
  }
}

/** Verbrennende Recken — die Münzen fallen erst, wenn nur noch Asche da ist. */
function brennendeFuehren(welt, dt, werte) {
  const szene = welt.szene;
  for (let i = szene.brennende.length - 1; i >= 0; i--) {
    const b = szene.brennende[i];
    b.zeit += dt;
    const gross = b.groesse || 1;
    if (Math.random() < dt * 14) {
      szene.spritzer.push({
        x: b.x + Math.random() * 6 * gross,
        y: MASSE.DECK - 4 - Math.random() * b.klasse.hoehe * gross,
        vx: Math.random() * 10 - 5, vy: -(10 + Math.random() * 20),
        lebt: 0.6, farbe: '#ff9a3a'
      });
    }
    // Der Qualm eines Verbrennenden steigt über ihm auf.
    if (Math.random() < dt * 16) {
      rauchen(szene, b.x + 3 * gross, MASSE.DECK - 6 - Math.random() * b.klasse.hoehe * gross,
        1, { dauer: 1.8, steigen: 14, streuung: 2 });
    }
    if (b.zeit < 1.15) continue;

    szene.brennende.splice(i, 1);
    szene.reste.push({ art: 'asche', x: b.x + 1 });
    if (szene.reste.length > 16) szene.reste.shift();
    rauchen(szene, b.x + 3 * gross, MASSE.DECK - 4, 3, { dauer: 2.4, steigen: 9, warm: false });
    muenzenFallen(szene, b.x + 3, b.klasse, true, werte.ernteFaktor, b.boss ? 10 : 0);
  }
}

/* ---------------- Beute ---------------- */

function muenzenFuehren(welt, dt, werte) {
  const szene = welt.szene;
  const magnet = werte.wirkung && werte.wirkung.magnetring;
  for (let i = szene.muenzen.length - 1; i >= 0; i--) {
    const m = szene.muenzen[i];

    // Vom Drachling angezogen: fliegt zu ihm und wird dort eingesammelt.
    if (m.magnetisch) {
      const d = szene.drachling;
      const dx = d.x - m.x;
      const dy = d.y - m.y;
      const weg = Math.max(0.001, Math.hypot(dx, dy));
      if (weg < 5) {
        // Je Drachling-Stufe 1 % Chance, dass er die Muenze doppelt wertet.
        if (Math.random() < werte.doppelGold) {
          m.wert *= 2;
          szene.zahlen.push({ x: m.x, y: m.y - 8, text: 'x2!', farbe: '#fff6c8', gross: true, zeit: 0 });
        }
        muenzeAufsammeln(welt, m, false, werte);
        continue;
      }
      m.x += (dx / weg) * 95 * dt;
      m.y += (dy / weg) * 95 * dt;
      continue;
    }
    if (m.liegt) {
      // Magnetring: liegende Münzen kriechen langsam Richtung Tor und
      // werden vor dem Tor von selbst eingezogen.
      if (magnet) {
        m.x += 9 * dt;
        if (m.x >= MASSE.TOR_LINKS - 4) { muenzeAufsammeln(welt, m, false, werte); }
      }
      continue;
    }

    m.vy += 200 * dt;
    m.x += m.vx * dt;
    m.y += m.vy * dt;

    const boden = festerBoden(m.x);
    if (m.y >= MASSE.DECK - 2 && boden) {
      m.y = MASSE.DECK - 2;
      if (m.vy > 30) {
        m.vy *= -0.4;
        m.vx *= 0.6;
      } else {
        m.liegt = true;
        m.vx = 0;
        m.vy = 0;
        if (!szene.muenzHinweisGezeigt) {
          szene.muenzHinweisGezeigt = true;
          szene.zahlen.push({ x: m.x, y: m.y - 10, text: 'Klick: Gold aufsammeln!', farbe: '#e0b64f', zeit: -0.5 });
        }
      }
    } else if (!boden && m.y > MASSE.DECK + 26) {
      szene.ringe.push({ x: m.x, y: MASSE.HOEHE - 16 - Math.random() * 8, radius: 0, deckkraft: 1 });
      szene.muenzen.splice(i, 1);
      continue;
    }
    if (m.y > MASSE.HOEHE + 6) szene.muenzen.splice(i, 1);
  }
}

/**
 * Fundstücke fallen und bleiben liegen — nie in den Abgrund.
 *
 * Sie haben keine Fallgrenze nach unten und keinen Ablauf: Ein Artefakt
 * verschwindet nicht, es wartet. Am Wellenende wird es ohnehin
 * eingesammelt.
 */
function fundstueckeFuehren(welt, dt) {
  const szene = welt.szene;
  for (const f of szene.fundstuecke) {
    f.phase += dt * 3;
    if (f.liegt) continue;
    f.vy += 200 * dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    if (f.y >= MASSE.DECK - 4) {
      f.y = MASSE.DECK - 4;
      if (f.vy > 40) { f.vy *= -0.35; f.vx *= 0.5; }
      else { f.liegt = true; f.vx = 0; f.vy = 0; }
    }
  }
}

/** Der Sammel-Drachling zieht nachts über die Brücke und magnetisiert Gold. */
function drachlingFuehren(welt, dt, werte) {
  const { zustand, szene } = welt;
  const stufe = zustand.stufenP.sammler;
  if (szene.phase !== 'nacht' || stufe <= 0) return;

  const d = szene.drachling;
  d.phase += dt;
  // Er fliegt schneller, seit die Bühne doppelt so breit ist — sonst
  // bräuchte er für eine Runde über 40 Sekunden. Vorher kehrte er schon
  // bei `KLIPPE - 70` um und hat das neue Land nie gesehen; Münzen, die
  // dort lagen, blieben liegen.
  d.x += d.richtung * (55 + 20 * stufe) * dt;
  if (d.x > MASSE.MAUER - 8) d.richtung = -1;
  if (d.x < 20) d.richtung = 1;
  d.y = MASSE.DECK - 26 + Math.sin(d.phase * 2.1) * 6;

  const reichweite = 17 + 7 * stufe;
  for (const m of szene.muenzen) {
    if (m.liegt && !m.magnetisch
      && Math.abs(m.x - d.x) < reichweite
      && Math.abs(m.y - d.y) < reichweite + 14) {
      m.magnetisch = true;
    }
  }
}

/* ---------------- Physik ---------------- */

function truemmerFuehren(szene, dt, blutmenge) {
  void blutmenge;
  for (let i = szene.truemmer.length - 1; i >= 0; i--) {
    const t = szene.truemmer[i];
    t.vy += 190 * dt;
    t.x += t.vx * dt;
    t.y += t.vy * dt;
    t.dreh += t.drehTempo * dt;
    t.lebt -= dt;

    if (t.y >= MASSE.DECK - 1) {
      if (festerBoden(t.x)) {
        t.y = MASSE.DECK - 1;
        if (t.vy > 40) {
          lacheSetzen(szene, t.x, 4);
          t.vy *= -0.32;
          t.vx *= 0.55;
          if (t.art === 'schaedel' || t.art === 'helm') {
            t.rollt = true;
            t.vx = -(14 + Math.random() * 22);
          }
        } else {
          t.vy = 0;
          t.vx *= t.rollt ? 0.995 : 0.8;
          if (Math.abs(t.vx) < 3) {
            szene.reste.push({
              art: t.art, x: t.x,
              farbe: t.art === 'schild' ? t.schild : t.art === 'helm' ? t.metall : t.farbe,
              haut: t.haut, verbeult: Math.random() < 0.6
            });
            if (szene.reste.length > 16) szene.reste.shift();
            lacheSetzen(szene, t.x, 3);
            szene.truemmer.splice(i, 1);
            continue;
          }
        }
        // Ein rollender Schädel kann über die Kante gehen.
        if (t.rollt && t.art === 'schaedel' && Math.random() < 0.015) {
          t.faellt = true;
          t.vy = 20;
          t.rollt = false;
        }
      } else {
        t.faellt = true;
      }
    }

    if (t.faellt && t.y > MASSE.DECK + 8 && !t.geplatscht && t.y < MASSE.DECK + 30) {
      t.geplatscht = true;
      szene.ringe.push({ x: t.x, y: MASSE.HOEHE - 16 - Math.random() * 8, radius: 0, deckkraft: 1 });
    }
    if (t.y > MASSE.HOEHE + 14 || t.lebt <= 0) szene.truemmer.splice(i, 1);
  }
}

function spritzerFuehren(szene, dt) {
  for (let i = szene.spritzer.length - 1; i >= 0; i--) {
    const p = szene.spritzer[i];
    p.vy += 210 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.lebt -= dt;
    if (p.y >= MASSE.DECK - 1 && festerBoden(p.x)) {
      lacheSetzen(szene, p.x, 2);
      szene.spritzer.splice(i, 1);
      continue;
    }
    if (p.y > MASSE.HOEHE + 6 || p.lebt <= 0) szene.spritzer.splice(i, 1);
  }
}

/**
 * Rauch steigt, wird langsamer, driftet leicht nach links und fadet aus.
 *
 * Keine Schwerkraft: Rauch fällt nicht, er verliert nur seinen Auftrieb.
 * Die Bremse ist absichtlich stark — die Flocken sollen oben stehen
 * bleiben und dort verschwinden, nicht aus dem Bild fliegen.
 */
function rauchFuehren(szene, dt) {
  for (let i = szene.rauch.length - 1; i >= 0; i--) {
    const p = szene.rauch[i];
    p.lebt += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy *= 1 - 1.1 * dt;
    p.vx = p.vx * (1 - 0.7 * dt) - 3 * dt;
    if (p.lebt >= p.dauer || p.y < -6) szene.rauch.splice(i, 1);
  }
}

/** Aus jeder Lache tropft es irgendwann in den Abgrund. */
function lachenFuehren(szene, dt) {
  for (const lache of szene.lachen) {
    lache.tropft -= dt;
    if (lache.tropft <= 0 && szene.tropfen.length < 70) {
      lache.tropft = 1.6 + Math.random() * 4.5;
      szene.tropfen.push({
        x: lache.x + (Math.random() * 4 - 2),
        y: MASSE.DECK + 6,
        tempo: 12 + Math.random() * 14,
        deckkraft: 0.85
      });
    }
  }
  for (let i = szene.tropfen.length - 1; i >= 0; i--) {
    const t = szene.tropfen[i];
    t.tempo += 130 * dt;
    t.y += t.tempo * dt;
    if (t.y > 176) t.deckkraft -= dt * 1.6;
    if (t.deckkraft <= 0 || t.y > MASSE.HOEHE) szene.tropfen.splice(i, 1);
  }
}

function kleinkramFuehren(szene, dt) {
  for (let i = szene.ringe.length - 1; i >= 0; i--) {
    const r = szene.ringe[i];
    r.radius += 16 * dt;
    r.deckkraft -= dt * 0.9;
    if (r.deckkraft <= 0) szene.ringe.splice(i, 1);
  }
  for (let i = szene.zahlen.length - 1; i >= 0; i--) {
    const z = szene.zahlen[i];
    z.zeit += dt;
    z.y -= 9 * dt;
    if (z.zeit > 1.6) szene.zahlen.splice(i, 1);
  }
}

/* ---------------- Kulisse ---------------- */

function tiereFuehren(szene, dt) {
  for (const rabe of szene.raben) {
    if (rabe.fliegt > 0) {
      rabe.fliegt -= dt;
      rabe.x += rabe.vx * dt;
      rabe.y += rabe.vy * dt;
      rabe.vy += 24 * dt;
      rabe.fluegel += dt * 14;
      if (rabe.fliegt <= 0) {
        rabe.y = 0;
        rabe.x = 132 + Math.random() * 150;
      }
    } else {
      rabe.huepft -= dt;
      if (rabe.huepft <= 0) {
        rabe.huepft = 2 + Math.random() * 6;
        rabe.x = Math.max(126, Math.min(286, rabe.x + (Math.random() * 12 - 6)));
      }
    }
  }

  // Fledermäuse gibt es nur nachts.
  if (szene.sichtbarTag) { szene.fledermaeuse = null; return; }

  szene.fledermausTakt -= dt;
  if (!szene.fledermaeuse && szene.fledermausTakt <= 0) {
    szene.fledermausTakt = 26 + Math.random() * 30;
    const anzahl = 5 + ((Math.random() * 5) | 0);
    const richtung = Math.random() < 0.5 ? 1 : -1;
    szene.fledermaeuse = { richtung, liste: [] };
    for (let i = 0; i < anzahl; i++) {
      szene.fledermaeuse.liste.push({
        x: richtung > 0 ? -10 - i * 9 : 490 + i * 9,
        y: 22 + Math.random() * 46,
        phase: Math.random() * 6.28,
        tempo: 44 + Math.random() * 20
      });
    }
  }
  if (szene.fledermaeuse) {
    let sichtbar = false;
    for (const f of szene.fledermaeuse.liste) {
      f.x += szene.fledermaeuse.richtung * f.tempo * dt;
      f.phase += dt * 11;
      f.y += Math.sin(f.phase * 0.4) * 7 * dt;
      if (f.x > -20 && f.x < 500) sichtbar = true;
    }
    if (!sichtbar) szene.fledermaeuse = null;
  }
}
