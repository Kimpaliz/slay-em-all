// Die Zauberwirkungen und die zwei Einblendungen über der Szene.
//
// Alle Wirkungen zeichnen sich allein aus ihrem Eintrag in der Szene und
// kennen den Spielzustand nicht. Ob eine Pranke gerade Schaden macht,
// entscheidet die Simulation; hier wird nur gemalt, was sie beschlossen
// hat. Deshalb lässt sich jede Wirkung einzeln ansehen, ohne dass ein
// Spiel laufen muss.

import { MASSE, streu } from './masse.js';

/* ---------------- Drachenpranke ---------------- */

export function prankeZeichnen(ctx, p) {
  const DECK = MASSE.DECK;
  const vorne = Math.round(MASSE.TOR_LINKS - p.stand);
  const y = DECK - 13;
  if (p.stand < 2) return;

  // Arm
  ctx.fillStyle = '#1b0f18'; ctx.fillRect(vorne + 6, y, Math.round(p.stand), 11);
  ctx.fillStyle = '#120a12'; ctx.fillRect(vorne + 6, y + 8, Math.round(p.stand), 3);
  ctx.fillStyle = '#3a2436';
  for (let x = vorne + 8; x < MASSE.TOR_LINKS; x += 5) ctx.fillRect(x, y + 2, 3, 1);
  ctx.fillStyle = '#4d3046';
  for (let x = vorne + 10; x < MASSE.TOR_LINKS; x += 7) ctx.fillRect(x, y + 5, 2, 1);
  ctx.fillStyle = '#2a1a28';
  for (let x = vorne + 9; x < MASSE.TOR_LINKS - 4; x += 8) {
    ctx.fillRect(x, y - 2, 2, 2);
    ctx.fillRect(x, y - 3, 1, 1);
  }

  // Hand
  ctx.fillStyle = '#241318'; ctx.fillRect(vorne - 8, y - 3, 16, 15);
  ctx.fillStyle = '#33202c'; ctx.fillRect(vorne - 8, y - 3, 16, 3);
  ctx.fillStyle = '#1b0f18'; ctx.fillRect(vorne - 8, y + 8, 16, 4);
  ctx.fillStyle = '#4d3046';
  ctx.fillRect(vorne - 6, y - 2, 3, 2);
  ctx.fillRect(vorne - 1, y - 2, 3, 2);
  ctx.fillRect(vorne + 4, y - 2, 3, 2);

  // Krallen
  ctx.fillStyle = '#d8cfc0';
  ctx.fillRect(vorne - 9, y + 10, 2, 3); ctx.fillRect(vorne - 10, y + 12, 2, 2);
  ctx.fillRect(vorne - 4, y + 11, 2, 4); ctx.fillRect(vorne - 5, y + 14, 2, 1);
  ctx.fillRect(vorne + 1, y + 11, 2, 4); ctx.fillRect(vorne, y + 14, 2, 1);
  ctx.fillRect(vorne + 6, y + 10, 2, 3); ctx.fillRect(vorne + 5, y + 12, 2, 2);

  // Was unter ihr liegt, wird mitgeschleift
  for (const opfer of p.opfer) {
    const vx = Math.round(vorne + Math.min(14, opfer.versatz));
    ctx.fillStyle = '#7e1a22'; ctx.fillRect(vx - 3, DECK - 2, 7, 2);
    ctx.fillStyle = opfer.klasse.rumpf; ctx.fillRect(vx - 2, DECK - 2, 3, 1);
  }
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#6e161c';
  ctx.fillRect(vorne + 4, DECK - 1, Math.round(Math.min(p.stand, 30)), 1);
  ctx.globalAlpha = 1;
}

/* ---------------- Flammenstoß ---------------- */

export function flammeZeichnen(ctx, f) {
  const DECK = MASSE.DECK;
  const reichweite = f.reichweite || 0;
  const verblassen = f.zeit > 1.1 ? Math.max(0, 1 - (f.zeit - 1.1) / 0.4) : 1;
  if (reichweite < 2 || verblassen <= 0) return;

  const x0 = MASSE.TOR_LINKS - reichweite;
  for (let x = Math.round(x0); x < MASSE.TOR_LINKS; x += 2) {
    const anteil = (x - x0) / reichweite;
    const hoehe = 4 + Math.round((1 - anteil) * 5 + Math.sin(x * 1.3 + f.zeit * 30) * 2);
    ctx.globalAlpha = verblassen * (0.75 + Math.random() * 0.25);
    // Am Tor am heißesten, außen am dunkelsten
    ctx.fillStyle = anteil < 0.3 ? '#b32a12' : anteil < 0.7 ? '#ff7a2a' : '#ffd08a';
    ctx.fillRect(x, DECK - hoehe, 2, hoehe);
    if (Math.random() < 0.2) {
      ctx.fillStyle = '#ffd08a';
      ctx.fillRect(x, DECK - hoehe - 2, 1, 2);
    }
  }
  ctx.globalAlpha = verblassen * 0.3;
  const schein = ctx.createRadialGradient(
    x0 + reichweite / 2, DECK - 4, 2, x0 + reichweite / 2, DECK - 4, reichweite / 1.5
  );
  schein.addColorStop(0, 'rgba(255,150,60,0.8)');
  schein.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = schein;
  ctx.fillRect(x0 - 20, DECK - 40, reichweite + 40, 60);
  ctx.globalAlpha = 1;
}

/* ---------------- Meteoritenschauer ---------------- */

export function meteorZeichnen(ctx, m) {
  const x = Math.round(m.x);
  const y = Math.round(m.y);
  ctx.fillStyle = 'rgba(255,150,60,0.35)';
  ctx.fillRect(x + 2, y - 8, 1, 8);
  ctx.fillRect(x + 3, y - 12, 1, 8);
  ctx.fillStyle = '#b32a12'; ctx.fillRect(x - 1, y - 1, 4, 4);
  ctx.fillStyle = '#ff7a2a'; ctx.fillRect(x, y, 3, 3);
  ctx.fillStyle = '#ffd08a'; ctx.fillRect(x, y, 2, 2);
}

export function explosionZeichnen(ctx, e) {
  const x = Math.round(e.x);
  const radius = Math.round(4 + e.zeit * 26);
  const deckkraft = Math.max(0, 1 - e.zeit * 2);
  ctx.globalAlpha = deckkraft;
  ctx.fillStyle = '#ffd08a'; ctx.fillRect(x - 2, MASSE.DECK - 5, 4, 4);
  ctx.fillStyle = '#ff7a2a'; ctx.fillRect(x - radius, MASSE.DECK - 2, radius * 2, 1);
  for (let i = 0; i < 5; i++) {
    const px = x + Math.round((streu(i + e.zeit * 50) - 0.5) * radius * 2);
    ctx.fillRect(px, MASSE.DECK - 4 - Math.round(streu(i + 9) * radius * 0.6), 1, 2);
  }
  ctx.globalAlpha = 1;
}

/* ---------------- Donnerschlag ---------------- */

export function blitzZeichnen(ctx, b) {
  const deckkraft = Math.max(0, 1 - b.zeit * 2.8);
  if (deckkraft <= 0) return;
  ctx.globalAlpha = deckkraft;

  // Der Blitz zackt in festen Sprüngen — immer gleich für dieselbe Stelle
  let x = Math.round(b.x);
  let y = 0;
  ctx.fillStyle = b.zeit < 0.12 ? '#f5f2ff' : '#cfc8ff';
  while (y < MASSE.DECK - 2) {
    const stueck = 6 + ((streu(y + b.x) * 8) | 0);
    ctx.fillRect(x, y, 2, stueck);
    y += stueck;
    x += streu(y * 3 + b.x) > 0.5 ? 3 : -3;
  }
  ctx.fillStyle = 'rgba(207,200,255,0.25)';
  ctx.fillRect(Math.round(b.x) - 6, 0, 14, MASSE.DECK);
  ctx.globalAlpha = 1;
}

/* ---------------- Einblendungen ---------------- */

/**
 * Die Belegungsanzeige über dem Tor.
 *
 * Sie ist der wichtigste Wert des ganzen Spiels: Läuft sie voll, ist die
 * Welle verloren. Deshalb blinkt sie bei Vollstand und schreibt "VOLL!"
 * darüber — die reine Zahl wird im Getümmel übersehen.
 */
export function belegungZeichnen(ctx, imTor, kapazitaet, schlund, zeit) {
  const anzahl = imTor.length;
  const zeigen = Math.min(kapazitaet, 10);
  const abstand = 7;
  const breite = zeigen * abstand - 2;
  const x0 = Math.round(MASSE.TOR_MITTE - breite / 2);
  const y = 68;
  const voll = anzahl >= kapazitaet;

  ctx.fillStyle = 'rgba(6,7,12,0.55)';
  ctx.fillRect(x0 - 4, y - 7, breite + 8, 15);

  for (let i = 0; i < zeigen; i++) {
    const x = x0 + i * abstand;
    // Fressbalken: Über jedem Recken, der gerade im Maul steckt, läuft
    // sein Restleben ab — von voll (frisch geschluckt) bis leer (tot).
    if (i < anzahl && i < schlund) {
      const opfer = imTor[i];
      const anteil = Math.max(0, Math.min(1, opfer.lp / (opfer.maxLp || opfer.klasse.lp)));
      ctx.fillStyle = 'rgba(6,7,12,0.8)';
      ctx.fillRect(x, y - 5, 5, 2);
      ctx.fillStyle = anteil > 0.5 ? '#ff9a4a' : '#ff6a52';
      ctx.fillRect(x, y - 5, Math.max(1, Math.round(5 * anteil)), 1);
    }
    if (i < anzahl) {
      ctx.fillStyle = voll ? (Math.sin(zeit * 8) > 0 ? '#ff6a52' : '#c1444f') : '#c1444f';
      ctx.fillRect(x, y, 5, 4);
      ctx.fillRect(x + 1, y - 1, 3, 1);
      ctx.fillStyle = voll ? '#ffd9a0' : '#e8867e';
      ctx.fillRect(x + 1, y, 3, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x + 2, y + 2, 1, 2);
    } else {
      ctx.fillStyle = 'rgba(190,190,210,0.34)';
      ctx.fillRect(x, y, 5, 1);
      ctx.fillRect(x, y + 3, 5, 1);
      ctx.fillRect(x, y, 1, 4);
      ctx.fillRect(x + 4, y, 1, 4);
    }
  }

  ctx.font = 'bold 7px ui-monospace, monospace';
  ctx.fillStyle = voll ? '#ff8a6a' : '#d8d6e4';
  ctx.fillText(anzahl + '/' + kapazitaet, x0 + breite + 7, y + 5);
  if (voll) {
    ctx.fillStyle = Math.sin(zeit * 8) > 0 ? '#ff6a52' : 'rgba(255,106,82,0.4)';
    ctx.fillText('VOLL!', x0 - 3, y - 6);
  }
}

/** Das große Spruchband bei Wellenbeginn, Sieg und Niederlage. */
export function spruchbandZeichnen(ctx, band) {
  const deckkraft = Math.max(0, Math.min(1, Math.min(band.zeit * 2.5, (band.dauer - band.zeit) * 1.6)));
  if (deckkraft <= 0) return;

  ctx.globalAlpha = deckkraft * 0.85;
  ctx.fillStyle = 'rgba(6,7,12,0.85)';
  ctx.fillRect(110, 26, 260, 32);
  ctx.fillStyle = band.farbe;
  ctx.fillRect(110, 26, 260, 1);
  ctx.fillRect(110, 57, 260, 1);

  ctx.globalAlpha = deckkraft;
  ctx.font = 'bold 11px ui-monospace, monospace';
  let breite = ctx.measureText(band.text).width;
  ctx.fillStyle = band.farbe;
  ctx.fillText(band.text, Math.round(240 - breite / 2), 40);

  ctx.font = '8px ui-monospace, monospace';
  breite = ctx.measureText(band.unter).width;
  ctx.fillStyle = '#b9b7c9';
  ctx.fillText(band.unter, Math.round(240 - breite / 2), 51);
  ctx.globalAlpha = 1;
}

/** Aufsteigende Zahlen beim Münzensammeln. */
export function zahlZeichnen(ctx, z) {
  ctx.globalAlpha = Math.max(0, Math.min(1, 1.6 - z.zeit));
  // Kritische Treffer und Goldfunde sind eine Spur größer.
  ctx.font = z.gross ? 'bold 9px ui-monospace, monospace' : 'bold 8px ui-monospace, monospace';
  const breite = ctx.measureText(z.text).width;
  ctx.fillStyle = 'rgba(6,7,12,0.8)';
  ctx.fillRect(Math.round(z.x - breite / 2) - 2, Math.round(z.y) - 8, Math.ceil(breite) + 4, 10);
  ctx.fillStyle = z.farbe;
  ctx.fillText(z.text, Math.round(z.x - breite / 2), Math.round(z.y));
  ctx.globalAlpha = 1;
}
