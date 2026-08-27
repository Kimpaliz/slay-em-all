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
import { reckeAnlegen } from './welt.js';
import { melden } from './marktschreier.js';
import {
  schaden, torTod, zermalmen, lacheSetzen, muenzenFallen, muenzeAufsammeln
} from './kampf.js';
import { welleGewonnen, welleVerloren, niederlageBeenden, welleStarten, RITUAL_WARTEZEIT } from './wellen.js';
import { RECKEN } from './daten/recken.js';
import { NACHTS, ausListe, reckenName } from './daten/texte.js';
import {
  werte as werteAus, spawnAbstand, verfuegbareKlassen, klassenGewichte
} from '../werkzeuge/wirtschaft.mjs';

/** Wie blutig es zugeht: 1 bis 10. */
const BLUTMENGE = 9;

export function schritt(welt, dt, einstellungen = {}) {
  const { zustand, szene } = welt;
  const werte = werteAus(zustand.stufenG, zustand.stufenP);
  const blutmenge = einstellungen.blutmenge != null ? einstellungen.blutmenge : BLUTMENGE;
  const ruetteln = einstellungen.ruetteln !== false;

  szene.zeit += dt;
  zustand.spielzeit += dt;

  daemmerungFuehren(szene, dt);
  phaseFuehren(welt, dt, werte);
  reckenFuehren(welt, dt, werte);
  abklingzeitenFuehren(szene, dt);

  prankeFuehren(welt, dt, werte);
  schuetzenFuehren(welt, dt, werte);
  pfeileFuehren(welt, dt, werte);
  blitzeFuehren(szene, dt);
  flammeFuehren(welt, dt, werte);
  meteoreFuehren(welt, dt, werte);
  brennendeFuehren(welt, dt, werte);

  muenzenFuehren(welt, dt, werte);
  drachlingFuehren(welt, dt);
  truemmerFuehren(szene, dt, blutmenge);
  spritzerFuehren(szene, dt);
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
        const abstand = spawnAbstand(zustand.welle);
        szene.naechsterRecke = abstand * (0.7 + Math.random() * 0.6);
        szene.erschienen++;
        szene.recken.push(reckeAnlegen(szene, klasseWaehlen(zustand), reckenName(), werte.tempoFaktor));
      }
    }

    // Verdauung: Das Monster frisst mit `angriff` Lebenspunkten je Sekunde.
    for (let i = szene.imTor.length - 1; i >= 0; i--) {
      szene.imTor[i].lp -= werte.angriff * dt;
      if (szene.imTor[i].lp <= 0) {
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
    if (fertig) welleGewonnen(welt);
  }

  if (szene.phase === 'nacht') {
    szene.nachtzeit += dt;
    if (zustand.ritual >= 1 && zustand.ritualAn && szene.nachtzeit >= RITUAL_WARTEZEIT) {
      welleStarten(welt);
    }
    if (Math.random() < dt * 0.02) melden(szene, ausListe(NACHTS));
  }

  if (szene.phase === 'niederlage') {
    szene.niederlageZeit += dt;
    const vorbei = (szene.niederlageZeit > 3 && szene.recken.length === 0) || szene.niederlageZeit > 7;
    if (vorbei) niederlageBeenden(welt);
  }
}

/** Welche Klasse als Nächstes kommt — späte Wellen bringen höhere Ränge. */
function klasseWaehlen(zustand) {
  const moeglich = verfuegbareKlassen(RECKEN, zustand.welle, zustand.stufenP.koeder);
  const gewichte = klassenGewichte(moeglich, zustand.welle);
  const summe = gewichte.reduce((a, b) => a + b, 0);
  let wurf = Math.random() * summe;
  for (let i = 0; i < moeglich.length; i++) {
    wurf -= gewichte[i];
    if (wurf <= 0) return moeglich[i];
  }
  return moeglich[moeglich.length - 1];
}

/* ---------------- Recken ---------------- */

function reckenFuehren(welt, dt, werte) {
  const { szene } = welt;
  const prankeVorderkante = szene.pranke ? MASSE.TOR_LINKS - szene.pranke.stand : Infinity;

  for (let i = szene.recken.length - 1; i >= 0; i--) {
    const r = szene.recken[i];
    if (r.getroffen > 0) r.getroffen -= dt;

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

    r.x += r.tempo * dt;
    if (r.x >= MASSE.TOR_EINTRITT) {
      szene.recken.splice(i, 1);
      szene.imTor.push({ klasse: r.klasse, name: r.name, lp: r.lp });
      if (szene.imTor.length > werte.kapazitaet) {
        welleVerloren(welt);
        break;
      }
    }
  }
}

function abklingzeitenFuehren(szene, dt) {
  for (const k in szene.abklingzeit) {
    if (szene.abklingzeit[k] > 0) szene.abklingzeit[k] = Math.max(0, szene.abklingzeit[k] - dt);
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
    const ax = 306 + a * 24;
    const ay = 22;
    const flugzeit = Math.max(0.45, Math.min(1.1, (ax - ziel.x) / 150));
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
        schaden(welt, treffer, werte.pfeilSchaden, 'pfeil', false, werte);
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
 */
function flammeFuehren(welt, dt, werte) {
  const szene = welt.szene;
  const f = szene.flamme;
  if (!f) return;

  f.zeit += dt;
  f.reichweite = f.zeit < 0.5 ? ausklang(f.zeit / 0.5) * f.wirkbereich : f.wirkbereich;

  if (f.zeit < 1.1) {
    for (let i = szene.recken.length - 1; i >= 0; i--) {
      const r = szene.recken[i];
      if (r.zustand !== 'laeuft' || r.versengt) continue;
      if (r.x + 6 > MASSE.TOR_LINKS - f.reichweite && r.x < MASSE.TOR_LINKS) {
        r.versengt = true;
        schaden(welt, r, f.schaden, 'flamme', true, werte);
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
      szene.meteore.push({
        x: MASSE.KLIPPE + 10 + Math.random() * (MASSE.TOR_RECHTS - MASSE.KLIPPE - 14) + 26,
        y: -10, vx: -26, vy: 100
      });
    }
  }

  for (let i = szene.meteore.length - 1; i >= 0; i--) {
    const m = szene.meteore[i];
    m.vy += 60 * dt;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    if (m.y < MASSE.DECK - 3) continue;

    szene.meteore.splice(i, 1);
    szene.explosionen.push({ x: m.x, zeit: 0 });
    szene.ruettelt = Math.min(5, szene.ruettelt + 1.5);
    if (m.x > MASSE.KLIPPE - 4 && m.x < MASSE.TOR_RECHTS) {
      szene.brandflecken.push({ x: m.x, breite: 5 + Math.random() * 4 });
      if (szene.brandflecken.length > 30) szene.brandflecken.shift();
    }
    for (let j = szene.recken.length - 1; j >= 0; j--) {
      const r = szene.recken[j];
      if (r.zustand === 'laeuft' && Math.abs(r.x + 3 - m.x) < szene.meteorWirkung) {
        schaden(welt, r, szene.meteorSchaden, 'meteor', true, werte);
      }
    }
  }

  for (let i = szene.explosionen.length - 1; i >= 0; i--) {
    szene.explosionen[i].zeit += dt;
    if (szene.explosionen[i].zeit > 0.5) szene.explosionen.splice(i, 1);
  }
}

/** Verbrennende Recken — die Münzen fallen erst, wenn nur noch Asche da ist. */
function brennendeFuehren(welt, dt, werte) {
  const szene = welt.szene;
  for (let i = szene.brennende.length - 1; i >= 0; i--) {
    const b = szene.brennende[i];
    b.zeit += dt;
    if (Math.random() < dt * 20) {
      szene.spritzer.push({
        x: b.x + Math.random() * 6,
        y: MASSE.DECK - 4 - Math.random() * b.klasse.hoehe,
        vx: Math.random() * 10 - 5, vy: -(10 + Math.random() * 20),
        lebt: 0.6, farbe: Math.random() < 0.5 ? '#ff9a3a' : '#5a5650'
      });
    }
    if (b.zeit < 1.15) continue;

    szene.brennende.splice(i, 1);
    szene.reste.push({ art: 'asche', x: b.x + 1 });
    if (szene.reste.length > 16) szene.reste.shift();
    muenzenFallen(szene, b.x + 3, b.klasse, true, werte.ernteFaktor);
  }
}

/* ---------------- Beute ---------------- */

function muenzenFuehren(welt, dt, werte) {
  const szene = welt.szene;
  for (let i = szene.muenzen.length - 1; i >= 0; i--) {
    const m = szene.muenzen[i];

    // Vom Drachling angezogen: fliegt zu ihm und wird dort eingesammelt.
    if (m.magnetisch) {
      const d = szene.drachling;
      const dx = d.x - m.x;
      const dy = d.y - m.y;
      const weg = Math.max(0.001, Math.hypot(dx, dy));
      if (weg < 5) { muenzeAufsammeln(welt, m, false, werte.stolzFaktor); continue; }
      m.x += (dx / weg) * 95 * dt;
      m.y += (dy / weg) * 95 * dt;
      continue;
    }
    if (m.liegt) continue;

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

/** Der Sammel-Drachling zieht nachts über die Brücke und magnetisiert Gold. */
function drachlingFuehren(welt, dt) {
  const { zustand, szene } = welt;
  const stufe = zustand.stufenP.sammler;
  if (szene.phase !== 'nacht' || stufe <= 0) return;

  const d = szene.drachling;
  d.phase += dt;
  d.x += d.richtung * (28 + 13 * stufe) * dt;
  if (d.x > MASSE.MAUER - 8) d.richtung = -1;
  if (d.x < MASSE.KLIPPE - 70) d.richtung = 1;
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
