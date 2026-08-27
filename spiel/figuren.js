// Alles, was aus Einzelpunkten besteht: Recken, Trümmer, Münzen, Tiere.
//
// Jede Figur wird bei ganzen Bildpunkten gezeichnet (`Math.round`), weil
// die Leinwand ohne Glättung läuft. Ein halber Bildpunkt würde nicht
// weich aussehen, sondern die Farbe eines ganzen Punktes verfälschen.
//
// Die Recken sind sechs Punkte breit. Alles hängt an `oben`, dem
// Scheitelpunkt: Kopf, Rumpf, Arme und Waffe werden von dort nach unten
// gerechnet, damit große und kleine Klassen dieselbe Bauform teilen.

import { MASSE, streu } from './masse.js';

/* ---------------- Recken ---------------- */

export function reckeZeichnen(ctx, r, zeit) {
  const k = r.klasse;
  const x = Math.round(r.x);
  const fuesse = MASSE.DECK;
  const hoehe = k.hoehe;

  const laeuft = !r.wartet;
  const schritt = laeuft ? Math.sin(zeit * 8.5 + r.phase) : 0;
  const wippen = laeuft && Math.sin(zeit * 17 + r.phase) < 0 ? 1 : 0;
  const oben = fuesse - hoehe - wippen;
  const vorne = schritt > 0;

  // Schatten
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x, fuesse, 6, 1);

  if (k.umhang) {
    ctx.fillStyle = k.umhang;
    ctx.fillRect(x - 2, oben + 5, 2, hoehe - 7);
    ctx.fillRect(x - 3, oben + 7, 1, hoehe - 10);
  }

  // Beine
  ctx.fillStyle = k.stiefel;
  if (laeuft) {
    ctx.fillRect(x + (vorne ? 4 : 1), fuesse - 3, 2, 3);
    ctx.fillRect(x + (vorne ? 1 : 4), fuesse - 2, 2, 2);
  } else {
    ctx.fillRect(x + 1, fuesse - 3, 2, 3);
    ctx.fillRect(x + 4, fuesse - 3, 2, 3);
  }

  // Rumpf
  ctx.fillStyle = k.rumpf;
  ctx.fillRect(x + 1, oben + 4, 5, hoehe - 6);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x + 1, oben + 4, 1, hoehe - 6);
  ctx.fillStyle = k.arm;
  ctx.fillRect(x + 2, oben + 4, 4, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + 2, oben + Math.max(7, hoehe - 5), 4, 1);
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
    if (k.umhang) {
      ctx.fillStyle = k.schild;
      ctx.fillRect(x + 3, oben - 3, 1, 2);
    }
  } else {
    ctx.fillStyle = k.kopf;
    ctx.fillRect(x + 1, oben, 5, 2);
  }

  // Waffe — je höher der Rang, desto länger die Klinge
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

  if (k.schild) {
    ctx.fillStyle = k.schild;
    ctx.fillRect(x - 1, oben + 5, 2, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(x - 1, oben + 5, 2, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, oben + 7, 1, 3);
  }

  // Trefferblitz
  if (r.getroffen > 0) {
    ctx.globalAlpha = Math.min(0.8, r.getroffen * 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 1, oben, 5, hoehe - 2);
    ctx.globalAlpha = 1;
  }

  // Lebensbalken — nur bei Verletzten, sonst wäre das Bild voller Balken
  if (r.lp < r.maxLp) {
    const breite = 6;
    const gefuellt = Math.max(1, Math.round(breite * r.lp / r.maxLp));
    ctx.fillStyle = 'rgba(6,7,12,0.8)';
    ctx.fillRect(x, oben - 6, breite + 1, 2);
    ctx.fillStyle = '#c1444f';
    ctx.fillRect(x, oben - 6, gefuellt, 1);
  }
}

/** Ein Recke, der gerade zu Asche zerfällt. */
export function brennendenZeichnen(ctx, b) {
  const x = Math.round(b.x);
  const k = b.klasse;
  const anteil = Math.min(1, b.zeit / 1.1);
  const hoehe = Math.round(k.hoehe * (1 - anteil * 0.55));
  const oben = MASSE.DECK - hoehe;

  ctx.fillStyle = anteil < 0.3 ? k.rumpf : anteil < 0.6 ? '#3a2a22' : '#1c1712';
  ctx.fillRect(x + 1, oben + 2, 5, Math.max(1, hoehe - 2));
  ctx.fillStyle = anteil < 0.5 ? k.haut : '#2a211c';
  ctx.fillRect(x + 2, oben, 3, 3);

  if (b.zeit < 0.75) {
    for (let i = 0; i < 5; i++) {
      const fx = x + ((streu(i + b.zeit * 40) * 7) | 0);
      const fh = 2 + ((streu(i * 3 + b.zeit * 60) * 5) | 0);
      ctx.fillStyle = i % 2 ? '#ff7a2a' : '#ffd08a';
      ctx.fillRect(fx, oben - fh + 2, 1, fh);
    }
  }
  if (anteil > 0.5) {
    ctx.fillStyle = '#4a4640';
    for (let i = 0; i < 4; i++) {
      const px = x + ((streu(i + b.zeit * 30) * 7) | 0);
      ctx.fillRect(px, MASSE.DECK - 1 - ((streu(i * 7 + b.zeit * 20) * 3) | 0), 1, 1);
    }
  }
}

/* ---------------- Trümmer ---------------- */

export function truemmerZeichnen(ctx, t) {
  const x = Math.round(t.x);
  const y = Math.round(t.y);
  const quer = Math.sin(t.dreh) > 0;

  if (t.art === 'helm') {
    ctx.fillStyle = t.metall;
    ctx.fillRect(x, y - 2, 5, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x + (quer ? 1 : 3), y - 1, 1, 1);
    ctx.fillStyle = '#5b1216';
    ctx.fillRect(x + 1, y, 3, 1);
    return;
  }
  if (t.art === 'schild') {
    ctx.fillStyle = t.schild;
    ctx.fillRect(x, y - 5, 4, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x, y - 5, 4, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x + (quer ? 1 : 2), y - 3, 1, 3);
    ctx.fillStyle = '#6e161c';
    ctx.fillRect(x + 1, y - 1, 2, 1);
    return;
  }
  if (t.art === 'schaedel') {
    ctx.fillStyle = '#cfcbb6';
    ctx.fillRect(x, y - 3, 4, 3);
    ctx.fillRect(x + 1, y, 2, 1);
    ctx.fillStyle = '#2c2a26';
    ctx.fillRect(x, y - 2, 1, 1);
    ctx.fillRect(x + 3, y - 2, 1, 1);
    ctx.fillStyle = '#7c1a20';
    ctx.fillRect(x + 1, y - 3, 2, 1);
    return;
  }
  if (t.art === 'kopf') {
    ctx.fillStyle = t.haut;
    ctx.fillRect(x, y - 3, 3, 3);
    ctx.fillStyle = '#2a1f1a';
    ctx.fillRect(x, y - 3, 3, 1);
    ctx.fillStyle = '#8e1f28';
    ctx.fillRect(x, y, 3, 1);
    return;
  }
  if (t.art === 'rumpf') {
    ctx.fillStyle = t.farbe;
    ctx.fillRect(x, y - 4, 4, 4);
    ctx.fillStyle = '#8e1f28';
    ctx.fillRect(x, y - 4, 4, 1);
    ctx.fillRect(x, y, 4, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(x, y - 3, 1, 2);
    return;
  }

  // Arm oder Bein
  const laenge = t.art === 'bein' ? 5 : 4;
  ctx.fillStyle = t.farbe;
  if (quer) ctx.fillRect(x, y - 1, laenge, 2);
  else ctx.fillRect(x, y - laenge, 2, laenge);
  ctx.fillStyle = '#8e1f28';
  if (quer) ctx.fillRect(x, y - 1, 1, 2);
  else ctx.fillRect(x, y - 1, 2, 1);
  ctx.fillStyle = t.haut;
  if (quer) ctx.fillRect(x + laenge - 1, y - 1, 1, 2);
  else ctx.fillRect(x, y - laenge, 2, 1);
}

/** Was liegen geblieben ist — Helme, Schilde, Asche auf den Planken. */
export function restZeichnen(ctx, rest) {
  const x = Math.round(rest.x);
  const DECK = MASSE.DECK;

  if (rest.art === 'asche') {
    ctx.fillStyle = '#4a4640'; ctx.fillRect(x, DECK - 2, 5, 2);
    ctx.fillStyle = '#2f2c28'; ctx.fillRect(x + 1, DECK - 1, 3, 1);
    ctx.fillStyle = '#6a655c'; ctx.fillRect(x + 2, DECK - 2, 1, 1);
  } else if (rest.art === 'helm') {
    ctx.fillStyle = rest.farbe || '#949aaa'; ctx.fillRect(x, DECK - 3, 5, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + (rest.verbeult ? 1 : 3), DECK - 3, 1, 1);
    ctx.fillStyle = '#5b1216'; ctx.fillRect(x + 1, DECK - 1, 3, 1);
  } else if (rest.art === 'schild') {
    ctx.fillStyle = rest.farbe || '#4d4380'; ctx.fillRect(x, DECK - 6, 4, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x, DECK - 6, 4, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x + 2, DECK - 4, 1, 3);
  } else if (rest.art === 'schaedel') {
    ctx.fillStyle = '#cfcbb6'; ctx.fillRect(x, DECK - 3, 4, 3);
    ctx.fillStyle = '#2c2a26'; ctx.fillRect(x, DECK - 2, 1, 1); ctx.fillRect(x + 3, DECK - 2, 1, 1);
  } else if (rest.art === 'kopf') {
    ctx.fillStyle = rest.haut || '#c39066'; ctx.fillRect(x, DECK - 3, 3, 3);
    ctx.fillStyle = '#2a1f1a'; ctx.fillRect(x, DECK - 3, 3, 1);
    ctx.fillStyle = '#7c1a20'; ctx.fillRect(x, DECK - 1, 3, 1);
  } else if (rest.art === 'rumpf') {
    ctx.fillStyle = rest.farbe; ctx.fillRect(x, DECK - 3, 5, 3);
    ctx.fillStyle = '#8e1f28'; ctx.fillRect(x, DECK - 1, 5, 1); ctx.fillRect(x, DECK - 3, 1, 3);
  } else {
    ctx.fillStyle = rest.farbe; ctx.fillRect(x, DECK - 2, rest.art === 'bein' ? 5 : 4, 2);
    ctx.fillStyle = '#8e1f28'; ctx.fillRect(x, DECK - 2, 1, 2);
    ctx.fillStyle = rest.haut || '#c39066'; ctx.fillRect(x + (rest.art === 'bein' ? 4 : 3), DECK - 2, 1, 2);
  }
}

/* ---------------- Beute und Tiere ---------------- */

export function muenzeZeichnen(ctx, m, zeit) {
  const x = Math.round(m.x);
  const y = Math.round(m.y);
  ctx.fillStyle = '#a5761f'; ctx.fillRect(x - 1, y - 1, 4, 3);
  ctx.fillStyle = '#e0b64f'; ctx.fillRect(x - 1, y - 1, 3, 2);
  ctx.fillStyle = '#f6d492'; ctx.fillRect(x - 1, y - 1, 1, 1);
  // Größere Beträge liegen als Stapel
  if (m.wert > 3) {
    ctx.fillStyle = '#e0b64f'; ctx.fillRect(x, y - 3, 3, 2);
    ctx.fillStyle = '#a5761f'; ctx.fillRect(x + 2, y - 2, 1, 1);
  }
  // Gelegentliches Blinken, damit liegendes Gold auffällt
  if (m.liegt && Math.sin(zeit * 3 + m.phase) > 0.93) {
    ctx.fillStyle = '#fff6c8'; ctx.fillRect(x + 1, y - 2, 1, 1);
  }
}

export function rabeZeichnen(ctx, rabe) {
  const x = Math.round(rabe.x);
  const fliegt = rabe.fliegt > 0;
  const y = Math.round(MASSE.DECK - 4 + (fliegt ? rabe.y : 0));

  ctx.fillStyle = '#1b1d2c';
  ctx.fillRect(x, y + 1, 4, 3);
  ctx.fillRect(x + 3, y, 2, 2);
  ctx.fillStyle = '#2e3145'; ctx.fillRect(x + 1, y + 1, 2, 1);
  ctx.fillStyle = '#c48a3a'; ctx.fillRect(x + 5, y + 1, 1, 1);
  ctx.fillStyle = '#1b1d2c';
  if (fliegt) {
    const hoch = Math.sin(rabe.fluegel) > 0;
    ctx.fillRect(x - 2, y + (hoch ? -1 : 3), 3, 1);
    ctx.fillRect(x + 1, y + (hoch ? -2 : 4), 2, 1);
  } else {
    ctx.fillRect(x, y + 4, 1, 1);
    ctx.fillRect(x + 2, y + 4, 1, 1);
  }
}

export function schuetzeZeichnen(ctx, x, mauerOben, i, zeit) {
  const wippen = Math.sin(zeit * 2 + i * 1.7) > 0.7 ? 1 : 0;
  ctx.fillStyle = '#2f4022'; ctx.fillRect(x, mauerOben - 10 - wippen, 4, 5);
  ctx.fillStyle = '#5d7a3a'; ctx.fillRect(x + 1, mauerOben - 13 - wippen, 3, 3);
  ctx.fillStyle = '#42582a'; ctx.fillRect(x + 1, mauerOben - 14 - wippen, 3, 1);
  ctx.fillStyle = '#4a3a26'; ctx.fillRect(x - 2, mauerOben - 14 - wippen, 1, 8);
  ctx.fillStyle = '#d8d2b8'; ctx.fillRect(x - 2, mauerOben - 11 - wippen, 1, 1);
}

export function drachlingZeichnen(ctx, d, zeit) {
  const x = Math.round(d.x);
  const y = Math.round(d.y);
  const hoch = Math.sin(zeit * 9) > 0;

  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - 2, MASSE.DECK, 6, 1);
  ctx.fillStyle = '#a34322';
  ctx.fillRect(x - 4, y + (hoch ? -3 : 0), 3, 2);
  ctx.fillRect(x + 4, y + (hoch ? -3 : 0), 3, 2);
  ctx.fillStyle = '#c65a28'; ctx.fillRect(x - 2, y - 1, 7, 4);
  ctx.fillStyle = '#e07a36'; ctx.fillRect(x - 2, y - 1, 7, 2);
  ctx.fillStyle = '#e8b46a'; ctx.fillRect(x - 1, y + 1, 5, 1);
  ctx.fillStyle = '#e07a36'; ctx.fillRect(x + 4, y - 3, 3, 3);
  ctx.fillStyle = '#fce97a'; ctx.fillRect(x + 6, y - 2, 1, 1);
  ctx.fillStyle = '#c65a28'; ctx.fillRect(x - 4, y + 1, 2, 1);
}

/** Eine Fackel an der Mauer — Flamme und Lichtschein. */
export function fackelZeichnen(ctx, x, y, zeit) {
  const flackern = Math.sin(zeit * 7.3) * 0.5 + Math.sin(zeit * 12.1) * 0.5;
  const hoehe = 3 + Math.round(Math.abs(flackern) * 2);

  const schein = ctx.createRadialGradient(x + 1, y, 1, x + 1, y, 16 + hoehe);
  schein.addColorStop(0, 'rgba(255,150,60,0.34)');
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

/** Eine hängende Kette — die Zugbrücke hängt an zweien davon. */
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
