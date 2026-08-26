// Alles, was sich bewegt und einzeln gezeichnet wird: Recken, Trümmer,
// Raben, die Klaue, Fackeln, der Knochenhaufen.
//
// Jede Funktion bekommt den Zeichenstift (`ctx`) und malt in Bildpunkten.
// Bewusst ohne Kantenglättung — die Optik lebt von den harten Pixeln.

import { MASSE } from './masse.js';

/** Stabiler Pseudozufall: gleiche Zahl ergibt immer denselben Wert. */
export function streu(i) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

export function reckeZeichnen(ctx, recke, zeit) {
  if (recke.sichtbarkeit <= 0) return;
  const k = recke.klasse;
  const x = Math.round(recke.x);
  const fuss = MASSE.planke;
  const hoehe = k.hoehe;

  ctx.globalAlpha = recke.sichtbarkeit;
  const geht = !(recke.zweifelt && recke.zweifelZeit > 0);
  const schritt = geht ? Math.sin(zeit * 8.5 + recke.phase) : 0;
  const wippen = geht && Math.sin(zeit * 17 + recke.phase) < 0 ? 1 : 0;
  const oben = fuss - hoehe - wippen;
  const vorn = schritt > 0;

  // Schatten
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x, fuss, 6, 1);

  // Umhang hinter dem Körper
  if (k.umhang) {
    ctx.fillStyle = k.umhang;
    ctx.fillRect(x - 2, oben + 5, 2, hoehe - 7);
    ctx.fillRect(x - 3, oben + 7, 1, hoehe - 10);
  }

  // Beine im Schritt
  ctx.fillStyle = k.stiefel;
  if (geht) {
    ctx.fillRect(x + (vorn ? 4 : 1), fuss - 3, 2, 3);
    ctx.fillRect(x + (vorn ? 1 : 4), fuss - 2, 2, 2);
  } else {
    ctx.fillRect(x + 1, fuss - 3, 2, 3);
    ctx.fillRect(x + 4, fuss - 3, 2, 3);
  }

  // Rumpf
  ctx.fillStyle = k.koerper;
  ctx.fillRect(x + 1, oben + 4, 5, hoehe - 6);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x + 1, oben + 4, 1, hoehe - 6);
  ctx.fillStyle = k.arm;
  ctx.fillRect(x + 2, oben + 4, 4, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + 2, oben + Math.max(7, hoehe - 5), 4, 1);

  // Arm am Schaft
  ctx.fillStyle = k.arm;
  ctx.fillRect(x + 5, oben + 5, 2, 2);

  // Kopf
  ctx.fillStyle = k.haut;
  ctx.fillRect(x + 2, oben + 1, 3, 3);
  if (k.helm) {
    ctx.fillStyle = k.metall;
    ctx.fillRect(x + 2, oben - 1, 4, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x + 2, oben + 1, 3, 1);
    if (k.umhang) { ctx.fillStyle = k.schild; ctx.fillRect(x + 3, oben - 3, 1, 2); }
  } else {
    ctx.fillStyle = k.kopf;
    ctx.fillRect(x + 1, oben, 5, 2);
  }

  // Waffe: Schaft und Kopf
  ctx.fillStyle = '#4a3a26';
  ctx.fillRect(x + 7, oben + 1, 1, hoehe - 2);
  ctx.fillStyle = k.metall;
  if (k.id === 'bauer') {
    ctx.fillRect(x + 6, oben - 1, 3, 1);
    ctx.fillRect(x + 6, oben - 2, 1, 1);
    ctx.fillRect(x + 8, oben - 2, 1, 1);
  } else if (k.id === 'soeldner') {
    ctx.fillRect(x + 7, oben - 3, 1, 4);
    ctx.fillRect(x + 6, oben + 1, 3, 1);
  } else {
    ctx.fillRect(x + 7, oben - 4, 1, 5);
    ctx.fillRect(x + 6, oben - 4, 3, 1);
  }

  // Schild davor
  if (k.schild) {
    ctx.fillStyle = k.schild;
    ctx.fillRect(x - 1, oben + 5, 2, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(x - 1, oben + 5, 2, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, oben + 7, 1, 3);
  }

  // Denkblase beim Zweifeln
  if (recke.zweifelt && recke.zweifelZeit > 0.1) {
    const bx = x + 6;
    const by = oben - 9;
    ctx.fillStyle = 'rgba(233,233,237,0.9)';
    ctx.fillRect(bx, by, 5, 6);
    ctx.fillRect(bx + 1, by + 6, 1, 1);
    ctx.fillStyle = '#1a1420';
    ctx.fillRect(bx + 1, by + 1, 3, 1);
    ctx.fillRect(bx + 3, by + 2, 1, 1);
    ctx.fillRect(bx + 2, by + 3, 1, 1);
    ctx.fillRect(bx + 2, by + 5, 1, 1);
  }

  ctx.globalAlpha = 1;
}

export function truemmerZeichnen(ctx, t) {
  const x = Math.round(t.x);
  const y = Math.round(t.y);
  const gedreht = Math.sin(t.drehung) > 0;

  if (t.art === 'helm') {
    ctx.fillStyle = t.metall; ctx.fillRect(x, y - 2, 5, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x + (gedreht ? 1 : 3), y - 1, 1, 1);
    ctx.fillStyle = '#5b1216'; ctx.fillRect(x + 1, y, 3, 1);
    return;
  }
  if (t.art === 'schild') {
    ctx.fillStyle = t.schild; ctx.fillRect(x, y - 5, 4, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x, y - 5, 4, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x + (gedreht ? 1 : 2), y - 3, 1, 3);
    ctx.fillStyle = '#6e161c'; ctx.fillRect(x + 1, y - 1, 2, 1);
    return;
  }
  if (t.art === 'schaedel') {
    ctx.fillStyle = '#cfcbb6'; ctx.fillRect(x, y - 3, 4, 3); ctx.fillRect(x + 1, y, 2, 1);
    ctx.fillStyle = '#2c2a26'; ctx.fillRect(x, y - 2, 1, 1); ctx.fillRect(x + 3, y - 2, 1, 1);
    ctx.fillStyle = '#7c1a20'; ctx.fillRect(x + 1, y - 3, 2, 1);
    return;
  }
  if (t.art === 'kopf') {
    ctx.fillStyle = t.haut; ctx.fillRect(x, y - 3, 3, 3);
    ctx.fillStyle = '#2a1f1a'; ctx.fillRect(x, y - 3, 3, 1);
    ctx.fillStyle = '#8e1f28'; ctx.fillRect(x, y, 3, 1);
    return;
  }
  if (t.art === 'rumpf') {
    ctx.fillStyle = t.farbe; ctx.fillRect(x, y - 4, 4, 4);
    ctx.fillStyle = '#8e1f28'; ctx.fillRect(x, y - 4, 4, 1); ctx.fillRect(x, y, 4, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x, y - 3, 1, 2);
    return;
  }

  // Arm oder Bein
  const laenge = t.art === 'bein' ? 5 : 4;
  ctx.fillStyle = t.farbe;
  if (gedreht) ctx.fillRect(x, y - 1, laenge, 2);
  else ctx.fillRect(x, y - laenge, 2, laenge);
  ctx.fillStyle = '#8e1f28';
  if (gedreht) ctx.fillRect(x, y - 1, 1, 2);
  else ctx.fillRect(x, y - 1, 2, 1);
  ctx.fillStyle = t.haut;
  if (gedreht) ctx.fillRect(x + laenge - 1, y - 1, 1, 2);
  else ctx.fillRect(x, y - laenge, 2, 1);
}

export function rabeZeichnen(ctx, rabe) {
  const x = Math.round(rabe.x);
  const fliegt = rabe.flugRest > 0;
  const y = Math.round(MASSE.planke - 4 + (fliegt ? rabe.y : 0));

  ctx.fillStyle = '#1b1d2c';
  ctx.fillRect(x, y + 1, 4, 3);
  ctx.fillRect(x + 3, y, 2, 2);
  ctx.fillStyle = '#2e3145'; ctx.fillRect(x + 1, y + 1, 2, 1);
  ctx.fillStyle = '#c48a3a'; ctx.fillRect(x + 5, y + 1, 1, 1);
  ctx.fillStyle = '#1b1d2c';
  if (fliegt) {
    const hoch = Math.sin(rabe.schlag) > 0;
    ctx.fillRect(x - 2, y + (hoch ? -1 : 3), 3, 1);
    ctx.fillRect(x + 1, y + (hoch ? -2 : 4), 2, 1);
  } else {
    ctx.fillRect(x, y + 4, 1, 1);
    ctx.fillRect(x + 2, y + 4, 1, 1);
  }
}

export function klaueZeichnen(ctx, klaue) {
  const rein = Math.min(1, klaue.zeit / 0.28);
  const raus = klaue.zeit > 0.4 ? Math.max(0, 1 - (klaue.zeit - 0.4) / 0.5) : rein;
  const weite = Math.round(raus * 34);
  const x = MASSE.torLinks - weite;
  const y = MASSE.planke - 9;

  ctx.fillStyle = '#120a12';
  ctx.fillRect(x, y, weite + 4, 4);
  ctx.fillRect(x - 2, y - 1, 3, 2);
  ctx.fillRect(x - 3, y + 2, 4, 1);
  ctx.fillRect(x - 2, y + 4, 3, 1);
  ctx.fillStyle = '#3a2436';
  ctx.fillRect(x + 2, y + 1, weite, 1);
}

export function fackelZeichnen(ctx, x, y, zeit, scheinStaerke = 1) {
  const flackern = Math.sin(zeit * 7.3) * 0.5 + Math.sin(zeit * 12.1) * 0.5;
  const hoehe = 3 + Math.round(Math.abs(flackern) * 2);

  const schein = ctx.createRadialGradient(x + 1, y, 1, x + 1, y, 16 + hoehe);
  schein.addColorStop(0, 'rgba(255,150,60,' + (0.34 * scheinStaerke).toFixed(3) + ')');
  schein.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = schein;
  ctx.fillRect(x - 18, y - 18, 40, 40);

  ctx.fillStyle = '#3a2c1c'; ctx.fillRect(x, y + 2, 2, 5);
  ctx.fillStyle = '#ff7a2a'; ctx.fillRect(x, y - hoehe, 2, hoehe + 2);
  ctx.fillStyle = '#ffd08a'; ctx.fillRect(x, y - hoehe + 1, 1, Math.max(1, hoehe - 1));
  if (Math.random() < 0.3) {
    ctx.fillStyle = 'rgba(255,180,90,0.7)';
    ctx.fillRect(x + (Math.random() < 0.5 ? 0 : 1), y - hoehe - 2 - Math.round(Math.random() * 3), 1, 1);
  }
}

export function knochenhaufenZeichnen(ctx, anzahl) {
  for (let i = 0; i < anzahl; i++) {
    const a = streu(i + 500);
    const b = streu(i + 900);
    const c = streu(i + 1300);
    const lage = Math.floor(i / 14);
    const x = Math.round(MASSE.mauer - 4 + a * 40);
    const y = MASSE.planke - 1 - Math.floor(lage * 1.5 + b * 3);
    if (y < MASSE.planke - 16) continue;

    if (c < 0.18) {
      ctx.fillStyle = '#cfcbb6'; ctx.fillRect(x, y - 2, 3, 3);
      ctx.fillStyle = '#3a3730'; ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x + 2, y - 1, 1, 1);
    } else {
      ctx.fillStyle = c < 0.6 ? '#bdb9a4' : '#a29e8b';
      ctx.fillRect(x, y, 3 + Math.floor(b * 3), 1);
    }
  }
  ctx.fillStyle = 'rgba(90,20,22,0.35)';
  ctx.fillRect(MASSE.mauer - 4, MASSE.planke, 42, 1);
}

export function ketteZeichnen(ctx, x0, y0, x1, y1, farbe) {
  const glieder = 46;
  for (let i = 0; i <= glieder; i++) {
    const t = i / glieder;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 5);
    ctx.fillStyle = i % 2 ? farbe : 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, 1, 1);
  }
}
