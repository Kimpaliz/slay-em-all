// Das ganze Bild in einem Durchgang, von hinten nach vorne:
// Himmel, Sterne, Mond, Fledermäuse, Hügel, Schlucht, Klippe, Burgmauer,
// Tor, Ketten, Brücke, Knochen, Blut, Figuren, Fackeln, Randabdunklung.
//
// Nichts hier verändert die Welt — hier wird nur angeschaut und gemalt.

import { MASSE } from './masse.js';
import { paletteFuer, PALETTE_STANDARD, SONNE } from './daten/paletten.js';
import { tagesStand } from './tageslauf.js';
import {
  streu, reckeZeichnen, truemmerZeichnen, rabeZeichnen, klaueZeichnen,
  fackelZeichnen, knochenhaufenZeichnen, ketteZeichnen
} from './figuren.js';

const MAUER_OBEN = 30;

/** Höhe des Torbogens an einer bestimmten Stelle. */
export function bogenHoehe(x) {
  const d = x - MASSE.torMitteX;
  const rest = MASSE.torRadius * MASSE.torRadius - d * d;
  return rest <= 0 ? MASSE.planke : MASSE.torMitteY - Math.floor(Math.sqrt(rest));
}

export function zeichnen(ctx, welt, einstellungen = {}) {
  const { szene } = welt;
  const stand = tagesStand(szene.zeit);
  const P = paletteFuer(einstellungen.palette || PALETTE_STANDARD, stand.helligkeit);
  const B = MASSE.breite;
  const H = MASSE.hoehe;
  const PL = MASSE.planke;

  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, B, H);

  // Erschütterung nach einem Treffer
  const staerke = szene.beben > 0.05 ? szene.beben : 0;
  const vx = staerke ? Math.round((Math.random() * 2 - 1) * staerke) : 0;
  const vy = staerke ? Math.round((Math.random() * 2 - 1) * staerke * 0.6) : 0;
  ctx.save();
  ctx.translate(vx, vy);

  himmel(ctx, P, szene, B, PL, stand);
  huegel(ctx, P, B, PL);
  schlucht(ctx, P, szene, B, H, PL);
  klippeLinks(ctx, P, H, PL);
  burgmauer(ctx, P, B, H, PL);
  tor(ctx, P, szene, PL);
  ketten(ctx, P, PL);
  bruecke(ctx, PL);

  knochenhaufenZeichnen(ctx, szene.knochenhaufen);
  blutlachen(ctx, szene, PL);
  liegendes(ctx, szene, PL);

  for (const rabe of szene.raben) rabeZeichnen(ctx, rabe);
  for (const recke of szene.recken) reckeZeichnen(ctx, recke, szene.zeit);
  if (szene.klaue) klaueZeichnen(ctx, szene.klaue);
  for (const t of szene.truemmer) truemmerZeichnen(ctx, t);
  for (const s of szene.spritzer) {
    ctx.fillStyle = s.farbe;
    ctx.fillRect(Math.round(s.x), Math.round(s.y), 1 + (s.lebensdauer > 1.2 ? 1 : 0), 1);
  }
  for (const t of szene.tropfen) {
    ctx.globalAlpha = Math.max(0, t.deckkraft);
    ctx.fillStyle = '#6e161c';
    ctx.fillRect(Math.round(t.x), Math.round(t.y), 1, 2);
    ctx.globalAlpha = 1;
  }

  // Bei Tageslicht fällt der Feuerschein kaum auf.
  const schein = 1 - stand.helligkeit * 0.7;
  fackelZeichnen(ctx, 356, 104, szene.zeit, schein);
  fackelZeichnen(ctx, 402, 96, szene.zeit + 1.3, schein);
  fackelZeichnen(ctx, 448, 104, szene.zeit + 2.6, schein);

  torblitz(ctx, szene, PL);
  ctx.restore();
  randAbdunkeln(ctx, B, H);
}

/* ---------------- Hintergrund ---------------- */

function himmel(ctx, P, szene, B, PL, stand) {
  const verlauf = ctx.createLinearGradient(0, 0, 0, PL);
  verlauf.addColorStop(0, P.himmelOben);
  verlauf.addColorStop(1, P.himmelUnten);
  ctx.fillStyle = verlauf;
  ctx.fillRect(-6, -6, B + 12, PL + 6);

  const nachtAnteil = 1 - stand.helligkeit;

  // Sterne verschwinden, sobald es hell wird
  if (P.stern && nachtAnteil > 0.02) {
    for (const s of szene.sterne) {
      const funkeln = 0.55 + 0.45 * Math.sin(szene.zeit * 1.6 + s.phase);
      ctx.globalAlpha = s.helligkeit * funkeln * nachtAnteil;
      ctx.fillStyle = P.stern;
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  // Sonne am Tag, Mond in der Nacht — beide wandern von links nach rechts.
  if (stand.helligkeit > 0.05) {
    gestirn(ctx, bahn(stand.fortschritt), SONNE.scheibe, SONNE.hof, stand.helligkeit, true);
  }
  if (P.mond && nachtAnteil > 0.05) {
    // Nachts von vorn, tagsüber steht er schon halb am Himmel und verblasst.
    const lauf = stand.istTag ? 0.5 + stand.fortschritt * 0.5 : stand.fortschritt;
    gestirn(ctx, bahn(lauf), P.mond, P.licht, nachtAnteil, false);
  }

  if (szene.fledermaeuse) {
    ctx.fillStyle = P.himmelOben === '#101219' ? '#0b0c11' : '#0a0910';
    for (const f of szene.fledermaeuse.liste) {
      const x = Math.round(f.x);
      const y = Math.round(f.y);
      const hoch = Math.sin(f.phase) > 0;
      ctx.fillRect(x, y, 2, 1);
      ctx.fillRect(x - 2, y + (hoch ? -1 : 1), 2, 1);
      ctx.fillRect(x + 2, y + (hoch ? -1 : 1), 2, 1);
    }
  }
}

/** Wo ein Gestirn bei diesem Phasenfortschritt steht. */
function bahn(anteil) {
  return {
    x: Math.round(40 + anteil * 380),
    y: Math.round(46 - Math.sin(anteil * Math.PI) * 28)
  };
}

/** Sonne und Mond werden gleich gebaut — nur Farbe und Gesicht unterscheiden sich. */
function gestirn(ctx, pos, scheibe, hofFarbe, deckkraft, istSonne) {
  const { x, y } = pos;
  ctx.globalAlpha = Math.max(0, Math.min(1, deckkraft));

  const hof = ctx.createRadialGradient(x + 4, y + 4, 1, x + 4, y + 4, istSonne ? 34 : 26);
  hof.addColorStop(0, 'rgba(' + hofFarbe + ',' + (istSonne ? 0.26 : 0.3) + ')');
  hof.addColorStop(1, 'rgba(' + hofFarbe + ',0)');
  ctx.fillStyle = hof;
  ctx.fillRect(x - 30, y - 30, 72, 72);

  ctx.fillStyle = scheibe;
  if (istSonne) {
    // Etwas größer und rund, ohne Krater
    ctx.fillRect(x + 1, y - 1, 6, 10);
    ctx.fillRect(x, y, 8, 8);
    ctx.fillRect(x - 1, y + 1, 10, 6);
  } else {
    ctx.fillRect(x + 2, y, 4, 8);
    ctx.fillRect(x + 1, y + 1, 6, 6);
    ctx.fillRect(x, y + 2, 8, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(x + 4, y + 2, 2, 2);
    ctx.fillRect(x + 2, y + 5, 1, 1);
  }
  ctx.globalAlpha = 1;
}

function huegel(ctx, P, B, PL) {
  ctx.fillStyle = P.huegelFern;
  for (let x = 0; x < B; x++) {
    const y = 104 + Math.round(Math.sin(x * 0.021) * 7 + Math.sin(x * 0.007 + 2) * 5);
    ctx.fillRect(x, y, 1, PL - y);
  }
  ctx.fillStyle = P.huegelNah;
  for (let x = 0; x < B; x++) {
    const y = 116 + Math.round(Math.sin(x * 0.031 + 1.4) * 5 + Math.sin(x * 0.011) * 4);
    ctx.fillRect(x, y, 1, PL - y);
  }
}

function schlucht(ctx, P, szene, B, H, PL) {
  const breite = MASSE.mauer - MASSE.klippe + 6;
  ctx.fillStyle = P.schlucht;
  ctx.fillRect(MASSE.klippe - 2, PL - 2, breite, H - PL + 4);

  const tiefe = ctx.createLinearGradient(0, PL, 0, H);
  tiefe.addColorStop(0, 'rgba(0,0,0,0.35)');
  tiefe.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = tiefe;
  ctx.fillRect(MASSE.klippe - 2, PL, breite, H - PL);

  // Nebelbänder, die langsam durchziehen
  for (let i = 0; i < 6; i++) {
    const y = 158 + i * 7;
    const w = 60 + i * 14;
    const x = ((szene.zeit * (5 + i * 2) + i * 90) % (B + w)) - w;
    ctx.fillStyle = 'rgba(' + P.dunst + ',' + (0.10 + i * 0.02).toFixed(2) + ')';
    ctx.fillRect(Math.round(x), y, w, 2 + (i % 2));
  }

  for (const ring of szene.ringe) {
    ctx.globalAlpha = Math.max(0, ring.deckkraft) * 0.6;
    ctx.fillStyle = '#6a1c22';
    ctx.fillRect(Math.round(ring.x - ring.radius), Math.round(ring.y), Math.round(ring.radius * 2), 1);
    ctx.globalAlpha = 1;
  }
}

function klippeLinks(ctx, P, H, PL) {
  ctx.fillStyle = P.stein[0];
  ctx.fillRect(0, PL, MASSE.klippe, H - PL);
  ctx.fillStyle = P.stein[1];
  ctx.fillRect(0, PL, MASSE.klippe, 3);
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(streu(i) * MASSE.klippe);
    const y = PL + 4 + Math.floor(streu(i + 40) * (H - PL - 6));
    ctx.fillStyle = streu(i + 9) > 0.5 ? P.stein[2] : P.schlucht;
    ctx.fillRect(x, y, 2 + Math.floor(streu(i + 3) * 4), 1);
  }
  ctx.fillStyle = P.huegelFern;
  for (let x = 0; x < MASSE.klippe; x++) {
    const y = PL - 1 - Math.round(Math.max(0, Math.sin(x * 0.06) * 2 + (x > 100 ? (x - 100) * 0.05 : 0)));
    ctx.fillRect(x, y, 1, PL - y);
  }
}

function burgmauer(ctx, P, B, H, PL) {
  const breite = B - MASSE.mauer;
  ctx.fillStyle = P.stein[0];
  ctx.fillRect(MASSE.mauer, PL, breite, H - PL);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(MASSE.mauer, PL + 10, breite, H - PL - 10);
  ctx.fillStyle = P.stein[1];
  ctx.fillRect(MASSE.mauer, MAUER_OBEN, breite, PL - MAUER_OBEN);

  // Steinlagen
  for (let y = MAUER_OBEN + 4; y < PL; y += 5) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(MASSE.mauer, y, breite, 1);
    for (let x = MASSE.mauer + (y % 10 === 0 ? 5 : 11); x < B; x += 13) {
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(x, y - 4, 1, 4);
    }
  }
  for (let i = 0; i < 40; i++) {
    const x = MASSE.mauer + Math.floor(streu(i + 70) * breite);
    const y = MAUER_OBEN + Math.floor(streu(i + 120) * (PL - MAUER_OBEN));
    ctx.fillStyle = streu(i + 200) > 0.55 ? P.stein[2] : 'rgba(0,0,0,0.18)';
    ctx.fillRect(x, y, 3 + Math.floor(streu(i + 5) * 5), 2);
  }

  // Zinnen und Windenturm
  ctx.fillStyle = P.stein[2];
  for (let x = MASSE.mauer; x < B; x += 9) ctx.fillRect(x, MAUER_OBEN - 6, 6, 6);
  ctx.fillRect(MASSE.mauer, MAUER_OBEN - 1, breite, 2);
  ctx.fillStyle = P.stein[1];
  ctx.fillRect(MASSE.mauer + 2, 12, 16, 18);
  ctx.fillStyle = P.stein[2];
  ctx.fillRect(MASSE.mauer, 8, 20, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(MASSE.mauer + 6, 16, 5, 7);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(MASSE.mauer - 1, MAUER_OBEN - 6, 1, PL - MAUER_OBEN + 6);
}

function tor(ctx, P, szene, PL) {
  const puls = 0.82 + 0.18 * Math.sin(szene.zeit * 1.9) + szene.aufblitzen * 0.5;

  for (let x = MASSE.torLinks; x <= MASSE.torRechts; x++) {
    const oben = bogenHoehe(x);
    const glut = ctx.createLinearGradient(0, oben, 0, PL);
    glut.addColorStop(0, 'rgba(20,6,4,0.98)');
    glut.addColorStop(0.45, 'rgba(' + Math.round(120 * puls) + ',' + Math.round(40 * puls) + ',12,1)');
    glut.addColorStop(1, 'rgba(' + Math.round(255 * puls) + ',' + Math.round(126 * puls) + ',30,1)');
    ctx.fillStyle = glut;
    ctx.fillRect(x, oben, 1, PL - oben);
  }

  // Dunkelheit, die den linken Teil des Mauls verschluckt
  const maul = ctx.createLinearGradient(MASSE.torLinks, 0, MASSE.torLinks + 12, 0);
  maul.addColorStop(0, 'rgba(8,4,4,0.92)');
  maul.addColorStop(1, 'rgba(8,4,4,0)');
  ctx.fillStyle = maul;
  const obenLinks = bogenHoehe(MASSE.torLinks + 2);
  ctx.fillRect(MASSE.torLinks, obenLinks, 12, PL - obenLinks);

  // Bogensteine
  ctx.fillStyle = P.stein[2];
  for (let x = MASSE.torLinks - 2; x <= MASSE.torRechts + 2; x++) {
    const oben = bogenHoehe(Math.max(MASSE.torLinks, Math.min(MASSE.torRechts, x)));
    ctx.fillRect(x, oben - 3, 1, 3);
  }
  const kante = bogenHoehe(MASSE.torLinks + 1);
  ctx.fillRect(MASSE.torLinks - 2, kante, 2, PL - kante);

  // Lichtschein auf die Planken
  const schein = ctx.createRadialGradient(MASSE.torLinks + 2, PL - 8, 2, MASSE.torLinks + 2, PL - 8, 74);
  schein.addColorStop(0, 'rgba(255,120,36,' + (0.30 * puls).toFixed(3) + ')');
  schein.addColorStop(0.5, 'rgba(255,110,40,' + (0.10 * puls).toFixed(3) + ')');
  schein.addColorStop(1, 'rgba(255,110,40,0)');
  ctx.fillStyle = schein;
  ctx.fillRect(MASSE.torLinks - 80, PL - 70, 160, 80);
}

function ketten(ctx, P, PL) {
  ctx.fillStyle = P.stein[2];
  ctx.fillRect(MASSE.torLinks - 4, 74, 8, 3);
  ketteZeichnen(ctx, MASSE.torLinks - 2, 77, MASSE.klippe + 4, PL - 3, P.stein[2]);
  ketteZeichnen(ctx, MASSE.torLinks + 2, 78, MASSE.klippe + 16, PL - 3, P.stein[1]);
}

function bruecke(ctx, PL) {
  const breite = MASSE.torRechts - MASSE.klippe + 4;
  ctx.fillStyle = '#4a3a26'; ctx.fillRect(MASSE.klippe - 4, PL, breite, 5);
  ctx.fillStyle = '#3b2e1e'; ctx.fillRect(MASSE.klippe - 4, PL + 5, breite, 2);
  ctx.fillStyle = '#5b4830'; ctx.fillRect(MASSE.klippe - 4, PL, breite, 1);
  for (let x = MASSE.klippe - 2; x < MASSE.torRechts; x += 7) {
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(x, PL, 1, 5);
  }
  for (let i = 0; i < 12; i++) {
    const x = MASSE.klippe + Math.floor(streu(i + 300) * breite);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(x, PL + 1, 2, 1);
  }
  // Streben von unten
  ctx.fillStyle = '#2d2317';
  for (let x = MASSE.klippe + 6; x < MASSE.mauer; x += 18) {
    ctx.fillRect(x, PL + 7, 2, 5);
    ctx.fillRect(x - 4, PL + 7, 10, 1);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(MASSE.klippe - 4, PL, 2, 6);
  ctx.fillRect(MASSE.mauer - 4, PL, 2, 6);
}

function blutlachen(ctx, szene, PL) {
  for (const l of szene.lachen) {
    const x = Math.round(l.x - l.breite / 2);
    const w = Math.round(l.breite);
    ctx.globalAlpha = Math.min(0.95, l.deckkraft);
    ctx.fillStyle = '#8d1f26';
    ctx.fillRect(x, PL, w, 1);
    ctx.globalAlpha = Math.min(0.85, l.deckkraft);
    ctx.fillStyle = '#5c1218';
    ctx.fillRect(x + 1, PL + 1, Math.max(1, w - 2), 1);
    ctx.globalAlpha = Math.min(0.5, l.deckkraft * 0.8);
    ctx.fillStyle = '#3a0d11';
    ctx.fillRect(x + 2, PL + 2, Math.max(1, w - 4), 1);
    ctx.globalAlpha = 1;
  }
}

function liegendes(ctx, szene, PL) {
  for (const p of szene.liegendes) {
    const x = Math.round(p.x);
    if (p.art === 'helm') {
      ctx.fillStyle = p.farbe || '#949aaa'; ctx.fillRect(x, PL - 3, 5, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + (p.verbeult ? 1 : 3), PL - 3, 1, 1);
      ctx.fillStyle = '#5b1216'; ctx.fillRect(x + 1, PL - 1, 3, 1);
    } else if (p.art === 'schild') {
      ctx.fillStyle = p.farbe || '#4d4380'; ctx.fillRect(x, PL - 6, 4, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x, PL - 6, 4, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x + 2, PL - 4, 1, 3);
    } else if (p.art === 'schaedel') {
      ctx.fillStyle = '#cfcbb6'; ctx.fillRect(x, PL - 3, 4, 3);
      ctx.fillStyle = '#2c2a26'; ctx.fillRect(x, PL - 2, 1, 1); ctx.fillRect(x + 3, PL - 2, 1, 1);
    } else if (p.art === 'kopf') {
      ctx.fillStyle = p.haut || '#c39066'; ctx.fillRect(x, PL - 3, 3, 3);
      ctx.fillStyle = '#2a1f1a'; ctx.fillRect(x, PL - 3, 3, 1);
      ctx.fillStyle = '#7c1a20'; ctx.fillRect(x, PL - 1, 3, 1);
    } else if (p.art === 'rumpf') {
      ctx.fillStyle = p.farbe; ctx.fillRect(x, PL - 3, 5, 3);
      ctx.fillStyle = '#8e1f28'; ctx.fillRect(x, PL - 1, 5, 1); ctx.fillRect(x, PL - 3, 1, 3);
    } else {
      ctx.fillStyle = p.farbe;
      ctx.fillRect(x, PL - 2, p.art === 'bein' ? 5 : 4, 2);
      ctx.fillStyle = '#8e1f28'; ctx.fillRect(x, PL - 2, 1, 2);
      ctx.fillStyle = p.haut || '#c39066';
      ctx.fillRect(x + (p.art === 'bein' ? 4 : 3), PL - 2, 1, 2);
    }
  }
}

function torblitz(ctx, szene, PL) {
  if (szene.aufblitzen <= 0.02) return;
  ctx.globalAlpha = Math.min(0.4, szene.aufblitzen * 0.38);
  const blitz = ctx.createRadialGradient(MASSE.torLinks + 2, PL - 10, 2, MASSE.torLinks + 2, PL - 10, 60);
  blitz.addColorStop(0, '#ffd9a0');
  blitz.addColorStop(0.4, 'rgba(255,110,40,0.5)');
  blitz.addColorStop(1, 'rgba(255,80,20,0)');
  ctx.fillStyle = blitz;
  ctx.fillRect(MASSE.torLinks - 60, PL - 70, 122, 80);
  ctx.globalAlpha = 1;
}

function randAbdunkeln(ctx, B, H) {
  const rand = ctx.createRadialGradient(B * 0.5, H * 0.52, H * 0.34, B * 0.5, H * 0.52, H * 1.05);
  rand.addColorStop(0, 'rgba(0,0,0,0)');
  rand.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = rand;
  ctx.fillRect(0, 0, B, H);
}
