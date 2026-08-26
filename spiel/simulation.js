// Was in der Welt passiert, wenn Zeit vergeht. Kein Zeichnen, kein DOM.
//
// `schritt(welt, dt, einstellungen)` rückt alles um `dt` Sekunden vor.
// Alles darin ist absichtlich kleinteilig: Zulauf, Gang über die Brücke,
// Tor, Kobolde, Physik der Trümmer, Tiere. Jeder Block steht für sich.

import { MASSE } from './masse.js';
import { VORNAMEN, BEINAMEN, REIME } from './daten/texte.js';
import { KAUFSPRUCH } from './daten/ausbauten.js';
import {
  raten, klasseWaehlen, kaufAbstand, hausWaehltAusbau
} from '../werkzeuge/wirtschaft.mjs';

const STANDARD = { blutigkeit: 9, beben: true };

/** Wie viele Recken höchstens gleichzeitig sichtbar sind. Reine Optik. */
const MAX_AUF_BRUECKE = 18;
const MAX_IM_TOR = 26;

export function reckenName(zufall = Math.random) {
  const vorname = VORNAMEN[(zufall() * VORNAMEN.length) | 0];
  if (zufall() < 0.4) return vorname + ' ' + BEINAMEN[(zufall() * BEINAMEN.length) | 0];
  return vorname;
}

export function schritt(welt, dt, einstellungen = {}) {
  const opt = { ...STANDARD, ...einstellungen };
  const { zustand, szene } = welt;
  const r = raten(zustand.stufen);
  szene.zeit += dt;
  zustand.spielzeit = szene.zeit;

  hausKauftEin(welt, dt);
  zulauf(welt, dt, r);
  gangUeberDieBruecke(welt, dt);
  klaue(welt, dt, opt);
  torVerarbeitet(welt, dt, r, opt);
  kobolde(welt, dt, r);
  truemmerPhysik(welt, dt);
  spritzerPhysik(welt, dt);
  tropfenUndRinge(welt, dt);
  tiere(welt, dt);

  if (szene.beben > 0) szene.beben = Math.max(0, szene.beben - dt * 9);
  if (szene.aufblitzen > 0) szene.aufblitzen = Math.max(0, szene.aufblitzen - dt * 3.2);
}

/* ---------------- das Haus baut sich selbst aus ---------------- */

function hausKauftEin(welt, dt) {
  const { zustand, szene } = welt;
  szene.kaufRest += dt;
  if (szene.kaufRest < kaufAbstand(zustand.kaeufe)) return;
  szene.kaufRest = 0;

  const id = hausWaehltAusbau(zustand.stufen);
  zustand.stufen[id] += 1;
  zustand.kaeufe += 1;
  const sprueche = KAUFSPRUCH[id];
  zustand.letzterKauf = sprueche[(Math.random() * sprueche.length) | 0] + ' (Stufe ' + zustand.stufen[id] + ')';
}

/* ---------------- Recken kommen ins Tal ---------------- */

function zulauf(welt, dt, r) {
  const { zustand, szene } = welt;
  szene.zulaufRest += dt * r.zulauf;
  while (szene.zulaufRest >= 1) {
    szene.zulaufRest -= 1;
    if (szene.recken.length >= MAX_AUF_BRUECKE || szene.imTor.length >= MAX_IM_TOR) continue;
    const klasse = klasseWaehlen(zustand.erledigte);
    // Mit jedem Ausbau des Hauses gehen sie zügiger — gedeckelt, sonst rennen sie.
    const eile = Math.min(3.2, 1.35 + zustand.kaeufe * 0.055);
    szene.recken.push({
      nr: szene.laufendeNummer++,
      klasse,
      x: -8 - Math.random() * 26,
      name: reckenName(),
      phase: Math.random() * 6.28,
      zweifelt: Math.random() < 0.1,
      zweifelZeit: 0,
      hatGezweifelt: false,
      sichtbarkeit: 1,
      tempo: klasse.tempo * (0.85 + Math.random() * 0.3) * eile
    });
  }
}

function gangUeberDieBruecke(welt, dt) {
  const { szene } = welt;
  const r = raten(welt.zustand.stufen);
  for (let i = szene.recken.length - 1; i >= 0; i--) {
    const recke = szene.recken[i];

    // Kurz vor dem Tor überlegt es sich mancher. Hilft ihm nichts.
    if (recke.zweifelt && !recke.hatGezweifelt && recke.x > 210) {
      recke.zweifelZeit += dt;
      if (recke.zweifelZeit > 1.5) { recke.hatGezweifelt = true; recke.zweifelt = false; }
      continue;
    }

    recke.x += recke.tempo * dt;
    if (recke.x > MASSE.mauer + 2) {
      recke.sichtbarkeit = Math.max(0, 1 - (recke.x - MASSE.mauer - 2) / 9);
    }
    if (recke.x >= MASSE.eintritt) {
      szene.recken.splice(i, 1);
      szene.imTor.push({
        klasse: recke.klasse,
        name: recke.name,
        rest: r.verweildauer * (0.8 + Math.random() * 0.4),
        dran: false
      });
    }
  }
}

/* ---------------- die Klaue holt sich einen Nachzügler ---------------- */

function klaue(welt, dt, opt) {
  const { szene } = welt;
  szene.naechsteKlaue -= dt;

  if (szene.klaue) {
    szene.klaue.zeit += dt;
    if (szene.klaue.zeit > 0.28 && !szene.klaue.zugepackt) {
      szene.klaue.zugepackt = true;
      const i = szene.recken.findIndex((h) => h.x > 258 && h.x < MASSE.mauer + 2);
      if (i >= 0) {
        const recke = szene.recken[i];
        spritzerWerfen(welt, recke.x, MASSE.planke - recke.klasse.hoehe * 0.5, 8, opt);
        szene.recken.splice(i, 1);
        szene.imTor.push({ klasse: recke.klasse, name: recke.name, rest: 0.25, dran: false });
        szene.beben = Math.min(4, szene.beben + 2.5);
      }
    }
    if (szene.klaue.zeit > 0.9) szene.klaue = null;
    return;
  }

  if (szene.naechsteKlaue <= 0) {
    szene.naechsteKlaue = 22 + Math.random() * 26;
    if (szene.recken.some((h) => h.x > 258 && h.x < MASSE.mauer + 2)) {
      szene.klaue = { zeit: 0, zugepackt: false };
    }
  }
}

/* ---------------- das Tor arbeitet ---------------- */

function torVerarbeitet(welt, dt, r, opt) {
  const { szene } = welt;
  // Nur so viele, wie Plätze da sind. Der Rest wartet im Dunkeln.
  let plaetze = r.torplaetze;
  for (let i = 0; i < szene.imTor.length && plaetze > 0; i++, plaetze--) szene.imTor[i].dran = true;

  for (let i = szene.imTor.length - 1; i >= 0; i--) {
    if (!szene.imTor[i].dran) continue;
    szene.imTor[i].rest -= dt;
    if (szene.imTor[i].rest <= 0) {
      const opfer = szene.imTor[i];
      szene.imTor.splice(i, 1);
      erledigen(welt, opfer, opt);
    }
  }
}

/** Ein Recke ist fertig. Beute buchen, Teile werfen, Reim in die Schlange. */
export function erledigen(welt, opfer, opt = STANDARD) {
  const { zustand, szene } = welt;
  const r = raten(zustand.stufen);
  const k = opfer.klasse;
  const maulX = MASSE.torLinks + 4;
  const maulY = MASSE.planke - 10;

  szene.aufblitzen = 1;
  szene.beben = Math.min(5, szene.beben + (opt.beben === false ? 0 : 1.6 + k.hoehe / 12));
  spritzerWerfen(welt, maulX, maulY, 9 + Math.round(k.hoehe / 3), opt);

  teileWerfen(welt, k, maulX, maulY, opt);

  for (const rabe of szene.raben) {
    if (rabe.flugRest <= 0 && Math.random() < 0.45) {
      rabe.flugRest = 1.6 + Math.random();
      rabe.vx = -(20 + Math.random() * 40);
      rabe.vy = -(26 + Math.random() * 20);
      rabe.y = 0;
    }
  }

  szene.knochenhaufen = Math.min(150, szene.knochenhaufen + 1);

  zustand.blut += Math.round(k.blut * r.beute);
  zustand.knochen += k.knochen;
  zustand.schrott += k.schrott;
  zustand.erledigte += 1;
  zustand.proKlasse[k.id] = (zustand.proKlasse[k.id] || 0) + 1;

  reimEinreihen(welt, opfer.name);
}

function reimEinreihen(welt, name) {
  const { szene } = welt;
  const darf = szene.zeit - szene.letzterSpruch > 0.9 && szene.spruchSchlange.length < 14;
  if (!darf) return;
  szene.letzterSpruch = szene.zeit;
  let i = (Math.random() * REIME.length) | 0;
  if (i === szene.letzterReim) i = (i + 1 + ((Math.random() * 3) | 0)) % REIME.length;
  szene.letzterReim = i;
  szene.spruchSchlange.push(REIME[i].split('{n}').join(name));
}

function teileWerfen(welt, k, x, y, opt) {
  const { szene } = welt;
  const teile = [];
  const anzahl = 2 + Math.round(blutigkeit(opt) / 3.5) + (k.hoehe > 14 ? 1 : 0);
  const folge = ['arm', 'bein', 'rumpf', 'arm', 'bein'];
  for (let i = 0; i < anzahl; i++) teile.push(folge[i % folge.length]);
  if (Math.random() < 0.5) teile.push('kopf');
  if (k.helm && Math.random() < 0.6) teile.push('helm');
  if (k.schild && Math.random() < 0.4) teile.push('schild');
  if (Math.random() < 0.3) teile.push('schaedel');

  for (const art of teile) {
    const weite = art === 'schild' ? 1.7 : art === 'helm' ? 1.35 : 1;
    szene.truemmer.push({
      art,
      x, y: y - Math.random() * 6,
      vx: -(30 + Math.random() * 70) * weite,
      vy: -(45 + Math.random() * 62),
      drehung: 0, drehTempo: Math.random() * 8 - 4,
      lebensdauer: 14,
      farbe: k.koerper, metall: k.metall, haut: k.haut, schild: k.schild || k.metall,
      rollt: false, faellt: false, geplatscht: false
    });
  }
  if (szene.truemmer.length > 130) szene.truemmer.splice(0, szene.truemmer.length - 130);
}

function blutigkeit(opt) {
  return Math.max(1, Math.min(10, opt.blutigkeit != null ? opt.blutigkeit : 9));
}

export function spritzerWerfen(welt, x, y, anzahl, opt = STANDARD) {
  const { szene } = welt;
  const menge = Math.round(anzahl * (0.4 + blutigkeit(opt) / 10));
  for (let i = 0; i < menge; i++) {
    szene.spritzer.push({
      x, y,
      vx: -(18 + Math.random() * 70),
      vy: -(20 + Math.random() * 70),
      lebensdauer: 1.6,
      farbe: Math.random() < 0.25 ? '#7e1a22' : '#a82430'
    });
  }
  if (szene.spritzer.length > 190) szene.spritzer.splice(0, szene.spritzer.length - 190);
}

export function lacheSetzen(welt, x, breite) {
  const { szene } = welt;
  if (x < MASSE.klippe - 6 || x > MASSE.torRechts) return;
  const nah = szene.lachen.find((l) => Math.abs(l.x - x) < 3);
  if (nah) {
    nah.breite = Math.min(11, nah.breite + 1);
    nah.deckkraft = Math.min(0.95, nah.deckkraft + 0.12);
    return;
  }
  szene.lachen.push({
    x, breite: breite + ((Math.random() * 3) | 0),
    deckkraft: 0.45 + Math.random() * 0.3,
    tropfRest: 1 + Math.random() * 3
  });
  if (szene.lachen.length > 46) szene.lachen.shift();
}

/* ---------------- Kobolde: wischen und bringen Blut ---------------- */

function kobolde(welt, dt, r) {
  const { zustand, szene } = welt;
  if (r.kobold <= 0) return;

  if (szene.liegendes.length) {
    szene.wischRest += dt * r.kobold * 0.5;
    while (szene.wischRest >= 1 && szene.liegendes.length) {
      szene.wischRest -= 1;
      szene.liegendes.shift();
      if (szene.lachen.length > 6) szene.lachen.shift();
    }
  }

  szene.blutRest += r.kobold * r.beute * dt;
  if (szene.blutRest >= 1) {
    const ganze = Math.floor(szene.blutRest);
    szene.blutRest -= ganze;
    zustand.blut += ganze;
  }
}

/* ---------------- Physik ---------------- */

function truemmerPhysik(welt, dt) {
  const { szene } = welt;
  for (let i = szene.truemmer.length - 1; i >= 0; i--) {
    const t = szene.truemmer[i];
    t.vy += 190 * dt;
    t.x += t.vx * dt;
    t.y += t.vy * dt;
    t.drehung += t.drehTempo * dt;
    t.lebensdauer -= dt;

    const ueberPlanke = t.x > MASSE.klippe - 4 && t.x < MASSE.torRechts;
    if (t.y >= MASSE.planke - 1) {
      if (ueberPlanke) {
        t.y = MASSE.planke - 1;
        if (t.vy > 40) {
          lacheSetzen(welt, t.x, 4);
          t.vy *= -0.32;
          t.vx *= 0.55;
          if (t.art === 'schaedel' || t.art === 'helm') { t.rollt = true; t.vx = -(14 + Math.random() * 22); }
        } else {
          t.vy = 0;
          t.vx *= t.rollt ? 0.995 : 0.8;
          if (Math.abs(t.vx) < 3) {
            szene.liegendes.push({
              art: t.art, x: t.x,
              farbe: t.art === 'schild' ? t.schild : t.art === 'helm' ? t.metall : t.farbe,
              haut: t.haut,
              verbeult: Math.random() < 0.6
            });
            if (szene.liegendes.length > 16) szene.liegendes.shift();
            lacheSetzen(welt, t.x, 3);
            szene.truemmer.splice(i, 1);
            continue;
          }
        }
        // Manchmal rollt ein Schädel über die Kante.
        if (t.rollt && t.art === 'schaedel' && Math.random() < 0.02) {
          t.faellt = true; t.vy = 20; t.rollt = false;
        }
      } else {
        t.faellt = true;
      }
    }

    if (t.faellt && !t.geplatscht && t.y > MASSE.planke + 8 && t.y < MASSE.planke + 30) {
      t.geplatscht = true;
      szene.ringe.push({ x: t.x, y: MASSE.hoehe - 16 - Math.random() * 8, radius: 0, deckkraft: 1 });
    }
    if (t.y > MASSE.hoehe + 14 || t.lebensdauer <= 0) szene.truemmer.splice(i, 1);
  }
}

function spritzerPhysik(welt, dt) {
  const { szene } = welt;
  for (let i = szene.spritzer.length - 1; i >= 0; i--) {
    const s = szene.spritzer[i];
    s.vy += 210 * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.lebensdauer -= dt;
    if (s.y >= MASSE.planke - 1 && s.x > MASSE.klippe - 4 && s.x < MASSE.torRechts) {
      lacheSetzen(welt, s.x, 2);
      szene.spritzer.splice(i, 1);
      continue;
    }
    if (s.y > MASSE.hoehe + 6 || s.lebensdauer <= 0) szene.spritzer.splice(i, 1);
  }
}

function tropfenUndRinge(welt, dt) {
  const { szene } = welt;
  for (const lache of szene.lachen) {
    lache.tropfRest -= dt;
    if (lache.tropfRest <= 0 && szene.tropfen.length < 70) {
      lache.tropfRest = 1.6 + Math.random() * 4.5;
      szene.tropfen.push({
        x: lache.x + (Math.random() * 4 - 2),
        y: MASSE.planke + 6,
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
    if (t.deckkraft <= 0 || t.y > MASSE.hoehe) szene.tropfen.splice(i, 1);
  }
  for (let i = szene.ringe.length - 1; i >= 0; i--) {
    const ring = szene.ringe[i];
    ring.radius += 16 * dt;
    ring.deckkraft -= dt * 0.9;
    if (ring.deckkraft <= 0) szene.ringe.splice(i, 1);
  }
}

/* ---------------- Raben und Fledermäuse ---------------- */

function tiere(welt, dt) {
  const { szene } = welt;

  for (const rabe of szene.raben) {
    if (rabe.flugRest > 0) {
      rabe.flugRest -= dt;
      rabe.x += rabe.vx * dt;
      rabe.y += rabe.vy * dt;
      rabe.vy += 24 * dt;
      rabe.schlag += dt * 14;
      if (rabe.flugRest <= 0) { rabe.y = 0; rabe.x = 132 + Math.random() * 150; }
    } else {
      rabe.huepfRest -= dt;
      if (rabe.huepfRest <= 0) {
        rabe.huepfRest = 2 + Math.random() * 6;
        rabe.x = Math.max(126, Math.min(286, rabe.x + (Math.random() * 12 - 6)));
      }
    }
  }

  szene.naechsteFledermaus -= dt;
  if (!szene.fledermaeuse && szene.naechsteFledermaus <= 0) {
    szene.naechsteFledermaus = 26 + Math.random() * 30;
    const anzahl = 5 + ((Math.random() * 5) | 0);
    const richtung = Math.random() < 0.5 ? 1 : -1;
    szene.fledermaeuse = { richtung, liste: [] };
    for (let i = 0; i < anzahl; i++) {
      szene.fledermaeuse.liste.push({
        x: richtung > 0 ? -10 - i * 9 : MASSE.breite + 10 + i * 9,
        y: 22 + Math.random() * 46,
        phase: Math.random() * 6.28,
        tempo: 44 + Math.random() * 20
      });
    }
  }
  if (szene.fledermaeuse) {
    let nochDa = false;
    for (const f of szene.fledermaeuse.liste) {
      f.x += szene.fledermaeuse.richtung * f.tempo * dt;
      f.phase += dt * 11;
      f.y += Math.sin(f.phase * 0.4) * 7 * dt;
      if (f.x > -20 && f.x < MASSE.breite + 20) nochDa = true;
    }
    if (!nochDa) szene.fledermaeuse = null;
  }
}
