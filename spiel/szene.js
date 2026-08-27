// Das Bild. Ein Aufruf zeichnet die Leinwand einmal komplett neu.
//
// Die Reihenfolge ist die Tiefenstaffelung, von hinten nach vorn:
// Himmel, Hügel, Abgrund, Klippe, Mauer, Tor, Planken, Liegendes,
// Lebendes, Wirkungen, Licht. Wer etwas verschiebt, verschiebt es vor
// oder hinter andere Dinge — es gibt keine Ebenenverwaltung, die
// Reihenfolge *ist* die Ebene.
//
// Nichts hier verändert den Spielzustand. Das Zeichnen darf jederzeit
// ausfallen, ohne dass das Spiel etwas davon merkt.

import { MASSE, bogenHoehe, streu } from './masse.js';
import { NACHT_PALETTEN, TAG_PALETTE } from './daten/paletten.js';
import {
  reckeZeichnen, brennendenZeichnen, truemmerZeichnen, restZeichnen,
  muenzeZeichnen, rabeZeichnen, schuetzeZeichnen, drachlingZeichnen,
  fackelZeichnen, ketteZeichnen, statueZeichnen
} from './figuren.js';
import {
  prankeZeichnen, flammeZeichnen, meteorZeichnen, explosionZeichnen,
  blitzZeichnen, belegungZeichnen, spruchbandZeichnen, zahlZeichnen
} from './effekte.js';

/** Oberkante der Burgmauer. */
const MAUER_OBEN = 30;

export function zeichnen(ctx, welt, einstellungen = {}) {
  if (!ctx) return;
  const { zustand, szene } = welt;
  const P = szene.sichtbarTag
    ? TAG_PALETTE
    : (NACHT_PALETTEN[einstellungen.palette] || NACHT_PALETTEN.Nacht);
  const W = MASSE.BREITE;
  const H = MASSE.HOEHE;
  const DECK = MASSE.DECK;
  const zeit = szene.zeit;

  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // Erschütterung — das ganze Bild wackelt, nicht einzelne Teile
  const staerke = szene.ruettelt > 0.05 ? szene.ruettelt : 0;
  ctx.save();
  ctx.translate(
    staerke ? Math.round((Math.random() * 2 - 1) * staerke) : 0,
    staerke ? Math.round((Math.random() * 2 - 1) * staerke * 0.6) : 0
  );

  himmelZeichnen(ctx, P, szene, zeit, W, DECK);
  huegelZeichnen(ctx, P, W, DECK);
  abgrundZeichnen(ctx, P, szene, zeit, W, H, DECK);
  klippeZeichnen(ctx, P, H, DECK);
  mauerZeichnen(ctx, P, zustand, szene, W, H, DECK, zeit);
  torZeichnen(ctx, P, zustand, szene, DECK, zeit);
  plankenZeichnen(ctx, DECK);
  bodenZeichnen(ctx, szene, DECK);

  for (const st of szene.statuen) statueZeichnen(ctx, st, zeit);
  for (const m of szene.muenzen) muenzeZeichnen(ctx, m, zeit);
  for (const rabe of szene.raben) rabeZeichnen(ctx, rabe);
  for (const r of szene.recken) reckeZeichnen(ctx, r, zeit);
  for (const b of szene.brennende) brennendenZeichnen(ctx, b);

  if (szene.pranke) prankeZeichnen(ctx, szene.pranke);
  if (szene.flamme) flammeZeichnen(ctx, szene.flamme);
  for (const m of szene.meteore) meteorZeichnen(ctx, m);
  for (const e of szene.explosionen) explosionZeichnen(ctx, e);

  for (const p of szene.pfeile) {
    ctx.fillStyle = '#6b5238';
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 1);
    ctx.fillStyle = '#d8d2b8';
    ctx.fillRect(Math.round(p.x - p.vx * 0.012), Math.round(p.y - p.vy * 0.012), 1, 1);
  }
  for (const b of szene.blitze) blitzZeichnen(ctx, b);
  for (const t of szene.truemmer) truemmerZeichnen(ctx, t);
  for (const s of szene.spritzer) {
    ctx.fillStyle = s.farbe;
    ctx.fillRect(Math.round(s.x), Math.round(s.y), 1 + (s.lebt > 1.2 ? 1 : 0), 1);
  }
  for (const t of szene.tropfen) {
    ctx.globalAlpha = Math.max(0, t.deckkraft);
    ctx.fillStyle = '#6e161c';
    ctx.fillRect(Math.round(t.x), Math.round(t.y), 1, 2);
    ctx.globalAlpha = 1;
  }
  if (szene.phase === 'nacht' && zustand.stufenP.sammler > 0) {
    drachlingZeichnen(ctx, szene.drachling, zeit);
  }

  fackelnZeichnen(ctx, szene, zeit);
  torlichtZeichnen(ctx, szene, DECK);
  for (const z of szene.zahlen) zahlZeichnen(ctx, z);

  ctx.restore();

  // Dämmerung und Randabdunklung liegen über allem und wackeln nicht mit
  if (szene.daemmerung > 0) {
    ctx.globalAlpha = Math.sin(Math.PI * Math.max(0, Math.min(1, szene.daemmerung / 1.1))) * 0.72;
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (szene.spruchband) spruchbandZeichnen(ctx, szene.spruchband);

  const rand = ctx.createRadialGradient(W * 0.5, H * 0.52, H * 0.34, W * 0.5, H * 0.52, H * 1.05);
  rand.addColorStop(0, 'rgba(0,0,0,0)');
  rand.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = rand;
  ctx.fillRect(0, 0, W, H);
}

/* ---------------- Hintergrund ---------------- */

function himmelZeichnen(ctx, P, szene, zeit, W, DECK) {
  const himmel = ctx.createLinearGradient(0, 0, 0, DECK);
  himmel.addColorStop(0, P.himmelOben);
  himmel.addColorStop(1, P.himmelUnten);
  ctx.fillStyle = himmel;
  ctx.fillRect(-6, -6, W + 12, DECK + 6);

  if (P.sonne) {
    const schein = ctx.createRadialGradient(86, 30, 2, 86, 30, 34);
    schein.addColorStop(0, 'rgba(232,226,200,0.5)');
    schein.addColorStop(1, 'rgba(232,226,200,0)');
    ctx.fillStyle = schein;
    ctx.fillRect(50, -6, 80, 76);
    ctx.fillStyle = '#e8e2c8';
    ctx.fillRect(83, 26, 6, 8);
    ctx.fillRect(82, 27, 8, 6);
    ctx.fillRect(84, 25, 4, 10);
  }

  if (P.stern) {
    for (const s of szene.sterne) {
      ctx.globalAlpha = s.helligkeit * (0.55 + 0.45 * Math.sin(zeit * 1.6 + s.phase));
      ctx.fillStyle = P.stern;
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  // Der Mond braucht 260 Sekunden für einen Bogen über den Himmel
  if (P.mond) {
    const umlauf = 260;
    const anteil = (zeit % umlauf) / umlauf;
    const mx = Math.round(40 + anteil * 380);
    const my = Math.round(46 - Math.sin(anteil * Math.PI) * 28);
    const schein = ctx.createRadialGradient(mx + 4, my + 4, 1, mx + 4, my + 4, 26);
    schein.addColorStop(0, 'rgba(' + P.licht + ',0.30)');
    schein.addColorStop(1, 'rgba(' + P.licht + ',0)');
    ctx.fillStyle = schein;
    ctx.fillRect(mx - 24, my - 24, 60, 60);
    ctx.fillStyle = P.mond;
    ctx.fillRect(mx + 2, my, 4, 8);
    ctx.fillRect(mx + 1, my + 1, 6, 6);
    ctx.fillRect(mx, my + 2, 8, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(mx + 4, my + 2, 2, 2);
    ctx.fillRect(mx + 2, my + 5, 1, 1);
  }

  if (szene.fledermaeuse) {
    ctx.fillStyle = '#0a0910';
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

/** Zwei Hügelketten aus überlagerten Sinuswellen. */
function huegelZeichnen(ctx, P, W, DECK) {
  ctx.fillStyle = P.huegelFern;
  for (let x = 0; x < W; x++) {
    const y = 104 + Math.round(Math.sin(x * 0.021) * 7 + Math.sin(x * 0.007 + 2) * 5);
    ctx.fillRect(x, y, 1, DECK - y);
  }
  ctx.fillStyle = P.huegelNah;
  for (let x = 0; x < W; x++) {
    const y = 116 + Math.round(Math.sin(x * 0.031 + 1.4) * 5 + Math.sin(x * 0.011) * 4);
    ctx.fillRect(x, y, 1, DECK - y);
  }
}

function abgrundZeichnen(ctx, P, szene, zeit, W, H, DECK) {
  const breite = MASSE.MAUER - MASSE.KLIPPE + 6;
  ctx.fillStyle = P.abgrund;
  ctx.fillRect(MASSE.KLIPPE - 2, DECK - 2, breite, H - DECK + 4);

  const tiefe = ctx.createLinearGradient(0, DECK, 0, H);
  tiefe.addColorStop(0, 'rgba(0,0,0,0.35)');
  tiefe.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = tiefe;
  ctx.fillRect(MASSE.KLIPPE - 2, DECK, breite, H - DECK);

  // Sechs Nebelbänder, jedes mit eigenem Tempo
  for (let i = 0; i < 6; i++) {
    const y = 158 + i * 7;
    const w = 60 + i * 14;
    const x = ((zeit * (5 + i * 2) + i * 90) % (W + w)) - w;
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

function klippeZeichnen(ctx, P, H, DECK) {
  const K = MASSE.KLIPPE;
  ctx.fillStyle = P.stein[0]; ctx.fillRect(0, DECK, K, H - DECK);
  ctx.fillStyle = P.stein[1]; ctx.fillRect(0, DECK, K, 3);
  for (let i = 0; i < 26; i++) {
    const hx = Math.floor(streu(i) * K);
    const hy = DECK + 4 + Math.floor(streu(i + 40) * (H - DECK - 6));
    ctx.fillStyle = streu(i + 9) > 0.5 ? P.stein[2] : P.abgrund;
    ctx.fillRect(hx, hy, 2 + Math.floor(streu(i + 3) * 4), 1);
  }
  ctx.fillStyle = P.huegelFern;
  for (let x = 0; x < K; x++) {
    const y = DECK - 1 - Math.round(Math.max(0, Math.sin(x * 0.06) * 2 + (x > 100 ? (x - 100) * 0.05 : 0)));
    ctx.fillRect(x, y, 1, DECK - y);
  }
}

function mauerZeichnen(ctx, P, zustand, szene, W, H, DECK, zeit) {
  const M = MASSE.MAUER;
  ctx.fillStyle = P.stein[0]; ctx.fillRect(M, DECK, W - M, H - DECK);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(M, DECK + 10, W - M, H - DECK - 10);
  ctx.fillStyle = P.stein[1]; ctx.fillRect(M, MAUER_OBEN, W - M, DECK - MAUER_OBEN);

  // Fugen
  for (let y = MAUER_OBEN + 4; y < DECK; y += 5) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(M, y, W - M, 1);
    for (let x = M + ((y % 10 === 0) ? 5 : 11); x < W; x += 13) {
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(x, y - 4, 1, 4);
    }
  }
  // Einzelne hellere und dunklere Steine
  for (let i = 0; i < 40; i++) {
    const bx = M + Math.floor(streu(i + 70) * (W - M));
    const by = MAUER_OBEN + Math.floor(streu(i + 120) * (DECK - MAUER_OBEN));
    ctx.fillStyle = streu(i + 200) > 0.55 ? P.stein[2] : 'rgba(0,0,0,0.18)';
    ctx.fillRect(bx, by, 3 + Math.floor(streu(i + 5) * 5), 2);
  }
  // Zinnen
  ctx.fillStyle = P.stein[2];
  for (let x = M; x < W; x += 9) ctx.fillRect(x, MAUER_OBEN - 6, 6, 6);
  ctx.fillRect(M, MAUER_OBEN - 1, W - M, 2);
  // Turm
  ctx.fillStyle = P.stein[1]; ctx.fillRect(M + 2, 12, 16, 18);
  ctx.fillStyle = P.stein[2]; ctx.fillRect(M, 8, 20, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(M + 6, 16, 5, 7);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(M - 1, MAUER_OBEN - 6, 1, DECK - MAUER_OBEN + 6);

  for (let a = 0; a < zustand.stufenG.schuetze; a++) {
    schuetzeZeichnen(ctx, 306 + a * 24, MAUER_OBEN, a, zeit);
  }
  void szene;
}

/**
 * Das glühende Tor.
 *
 * Der Puls schlägt schneller, wenn die Burg voll ist — das ist die
 * zweite Warnung neben der Belegungsanzeige, und sie fällt auch dann
 * auf, wenn man nicht auf die Zahlen schaut.
 */
function torZeichnen(ctx, P, zustand, szene, DECK, zeit) {
  const kapazitaet = 3 + zustand.stufenG.hallen;
  const schlund = 1 + (zustand.stufenG.schlund || 0);
  const drin = szene.imTor.length;
  const fastVoll = drin >= kapazitaet;
  const puls = 0.82 + 0.18 * Math.sin(zeit * (fastVoll ? 5 : 1.9)) + szene.blitzlicht * 0.5;

  for (let x = MASSE.TOR_LINKS; x <= MASSE.TOR_RECHTS; x++) {
    const oben = bogenHoehe(x);
    const glut = ctx.createLinearGradient(0, oben, 0, DECK);
    glut.addColorStop(0, 'rgba(20,6,4,0.98)');
    glut.addColorStop(0.45, 'rgba(' + Math.round((fastVoll ? 160 : 120) * puls) + ',' + Math.round(40 * puls) + ',12,1)');
    glut.addColorStop(1, 'rgba(' + Math.round(255 * puls) + ',' + Math.round((fastVoll ? 80 : 126) * puls) + ',30,1)');
    ctx.fillStyle = glut;
    ctx.fillRect(x, oben, 1, DECK - oben);
  }

  const maul = ctx.createLinearGradient(MASSE.TOR_LINKS, 0, MASSE.TOR_LINKS + 12, 0);
  maul.addColorStop(0, 'rgba(8,4,4,0.92)');
  maul.addColorStop(1, 'rgba(8,4,4,0)');
  ctx.fillStyle = maul;
  const maulOben = bogenHoehe(MASSE.TOR_LINKS + 2);
  ctx.fillRect(MASSE.TOR_LINKS, maulOben, 12, DECK - maulOben);

  ctx.fillStyle = P.stein[2];
  for (let x = MASSE.TOR_LINKS - 2; x <= MASSE.TOR_RECHTS + 2; x++) {
    const oben = bogenHoehe(Math.max(MASSE.TOR_LINKS, Math.min(MASSE.TOR_RECHTS, x)));
    ctx.fillRect(x, oben - 3, 1, 3);
  }
  const kanteOben = bogenHoehe(MASSE.TOR_LINKS + 1);
  ctx.fillRect(MASSE.TOR_LINKS - 2, kanteOben, 2, DECK - kanteOben);

  const ausstrahlung = ctx.createRadialGradient(
    MASSE.TOR_LINKS + 2, DECK - 8, 2, MASSE.TOR_LINKS + 2, DECK - 8, 74
  );
  ausstrahlung.addColorStop(0, 'rgba(255,120,36,' + (0.30 * puls).toFixed(3) + ')');
  ausstrahlung.addColorStop(0.5, 'rgba(255,110,40,' + (0.10 * puls).toFixed(3) + ')');
  ausstrahlung.addColorStop(1, 'rgba(255,110,40,0)');
  ctx.fillStyle = ausstrahlung;
  ctx.fillRect(MASSE.TOR_LINKS - 80, DECK - 70, 160, 80);

  belegungZeichnen(ctx, szene.imTor, kapazitaet, schlund, zeit);

  // Aufhängung der Zugbrücke
  ctx.fillStyle = P.stein[2];
  ctx.fillRect(MASSE.TOR_LINKS - 4, 74, 8, 3);
  ketteZeichnen(ctx, MASSE.TOR_LINKS - 2, 77, MASSE.KLIPPE + 4, DECK - 3, P.stein[2]);
  ketteZeichnen(ctx, MASSE.TOR_LINKS + 2, 78, MASSE.KLIPPE + 16, DECK - 3, P.stein[1]);
}

function plankenZeichnen(ctx, DECK) {
  const von = MASSE.KLIPPE - 4;
  const breite = MASSE.TOR_RECHTS - MASSE.KLIPPE + 4;

  ctx.fillStyle = '#4a3a26'; ctx.fillRect(von, DECK, breite, 5);
  ctx.fillStyle = '#3b2e1e'; ctx.fillRect(von, DECK + 5, breite, 2);
  ctx.fillStyle = '#5b4830'; ctx.fillRect(von, DECK, breite, 1);
  for (let x = MASSE.KLIPPE - 2; x < MASSE.TOR_RECHTS; x += 7) {
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(x, DECK, 1, 5);
  }
  for (let i = 0; i < 12; i++) {
    const x = MASSE.KLIPPE + Math.floor(streu(i + 300) * breite);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(x, DECK + 1, 2, 1);
  }
  // Stützbalken unter der Brücke
  ctx.fillStyle = '#2d2317';
  for (let x = MASSE.KLIPPE + 6; x < MASSE.MAUER; x += 18) {
    ctx.fillRect(x, DECK + 7, 2, 5);
    ctx.fillRect(x - 4, DECK + 7, 10, 1);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(MASSE.KLIPPE - 4, DECK, 2, 6);
  ctx.fillRect(MASSE.MAUER - 4, DECK, 2, 6);
}

/** Brandflecken, Blutlachen, liegende Reste und steckende Pfeile. */
function bodenZeichnen(ctx, szene, DECK) {
  for (const f of szene.brandflecken) {
    ctx.fillStyle = 'rgba(16,14,12,0.8)';
    ctx.fillRect(Math.round(f.x - f.breite / 2), DECK, Math.round(f.breite), 2);
    ctx.fillStyle = 'rgba(40,34,26,0.6)';
    ctx.fillRect(Math.round(f.x - f.breite / 2) + 1, DECK, Math.round(f.breite) - 2, 1);
  }
  // Drei Schichten je Lache: außen hell, innen dunkel
  for (const l of szene.lachen) {
    const x = Math.round(l.x - l.breite / 2);
    const w = Math.round(l.breite);
    ctx.globalAlpha = Math.min(0.95, l.deckkraft);
    ctx.fillStyle = '#8d1f26'; ctx.fillRect(x, DECK, w, 1);
    ctx.globalAlpha = Math.min(0.85, l.deckkraft);
    ctx.fillStyle = '#5c1218'; ctx.fillRect(x + 1, DECK + 1, Math.max(1, w - 2), 1);
    ctx.globalAlpha = Math.min(0.5, l.deckkraft * 0.8);
    ctx.fillStyle = '#3a0d11'; ctx.fillRect(x + 2, DECK + 2, Math.max(1, w - 4), 1);
    ctx.globalAlpha = 1;
  }
  for (const rest of szene.reste) restZeichnen(ctx, rest);
  for (const p of szene.steckende) {
    ctx.globalAlpha = Math.min(1, p.zeit);
    ctx.fillStyle = '#6b5238'; ctx.fillRect(Math.round(p.x), DECK - 4, 1, 4);
    ctx.fillStyle = '#d8d2b8'; ctx.fillRect(Math.round(p.x), DECK - 5, 1, 1);
    ctx.globalAlpha = 1;
  }
}

/** Tagsüber brennen die Fackeln nicht — es bleiben die Halterungen. */
function fackelnZeichnen(ctx, szene, zeit) {
  if (!szene.sichtbarTag) {
    fackelZeichnen(ctx, 356, 104, zeit);
    fackelZeichnen(ctx, 402, 96, zeit + 1.3);
    fackelZeichnen(ctx, 448, 104, zeit + 2.6);
  } else {
    ctx.fillStyle = '#3a2c1c';
    ctx.fillRect(356, 106, 2, 5);
    ctx.fillRect(402, 98, 2, 5);
    ctx.fillRect(448, 106, 2, 5);
  }
}

/** Kurzes Aufleuchten aus dem Tor, wenn drinnen jemand gefressen wurde. */
function torlichtZeichnen(ctx, szene, DECK) {
  if (szene.blitzlicht <= 0.02) return;
  ctx.globalAlpha = Math.min(0.4, szene.blitzlicht * 0.38);
  const licht = ctx.createRadialGradient(
    MASSE.TOR_LINKS + 2, DECK - 10, 2, MASSE.TOR_LINKS + 2, DECK - 10, 60
  );
  licht.addColorStop(0, '#ffd9a0');
  licht.addColorStop(0.4, 'rgba(255,110,40,0.5)');
  licht.addColorStop(1, 'rgba(255,80,20,0)');
  ctx.fillStyle = licht;
  ctx.fillRect(MASSE.TOR_LINKS - 60, DECK - 70, 122, 80);
  ctx.globalAlpha = 1;
}
