// Die drei Händlerporträts und die vier Zaubersymbole.
//
// Das Grundbild jedes Porträts wird genau einmal auf eine unsichtbare
// Leinwand gemalt und danach nur noch kopiert. Darüber kommen die
// beweglichen Teile: Grommsch blinzelt, ihm läuft die Nase und er leckt
// sich die Lippen; Pips schlägt mit den Flügeln und wirft eine Münze;
// Malvina blinzelt und lässt Funken steigen.
//
// Gezeichnet wird nur alle 0,07 Sekunden, also mit etwa 14 Bildern je
// Sekunde. Das reicht für Pixelfiguren und spart den Großteil der Arbeit.

import {
  PORTRAET_GROMMSCH, PORTRAET_PIPS, PORTRAET_MALVINA
} from './daten/portraets-daten.js';

const BREITE = 28;
const HOEHE = 32;
/** Abstand zwischen zwei Porträtbildern, in Sekunden. */
const TAKT = 0.07;

/** Malt das unbewegte Grundbild und merkt es sich am Datensatz. */
function grundbild(P) {
  if (P._bild) return P._bild;
  const c = document.createElement('canvas');
  c.width = BREITE;
  c.height = HOEHE;
  const ctx = c.getContext('2d');
  for (let y = 0; y < HOEHE; y++) {
    const zeile = P.zeilen[y] || '';
    for (let x = 0; x < BREITE; x++) {
      ctx.fillStyle = P.palette[zeile[x] || '.'] || P.palette['.'];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  P._bild = c;
  return c;
}

export function portraetsAnlegen(leinwaende) {
  const satz = [
    { cv: leinwaende.grommsch, daten: PORTRAET_GROMMSCH, bewegung: grommschBewegt },
    { cv: leinwaende.pips, daten: PORTRAET_PIPS, bewegung: pipsBewegt },
    { cv: leinwaende.malvina, daten: PORTRAET_MALVINA, bewegung: malvinaBewegt }
  ].filter((e) => e.cv);

  let angesammelt = 0;

  return {
    schritt(dt, zeit) {
      angesammelt += dt;
      if (angesammelt < TAKT) return;
      angesammelt = 0;
      for (const e of satz) {
        const ctx = e.cv.getContext('2d');
        if (!ctx) continue;
        ctx.clearRect(0, 0, BREITE, HOEHE);
        ctx.drawImage(grundbild(e.daten), 0, 0);
        e.bewegung(ctx, zeit);
      }
    }
  };
}

/** Kurzschreibweise fürs Setzen einzelner Bildpunkte. */
function stift(ctx) {
  return (farbe, x, y, b, h) => {
    ctx.fillStyle = farbe;
    ctx.fillRect(x, y, b || 1, h || 1);
  };
}

/* ---------------- Grommsch, Zeugmeister ---------------- */

function grommschBewegt(ctx, t) {
  const px = stift(ctx);

  // Augen: meist offen, gelegentlich zu
  if ((t % 3.4) < 0.13) { px('#a3bd74', 10, 15); px('#a3bd74', 12, 15); }
  else if ((t % 5.9) < 0.5) { px('#17130f', 9, 14, 2); px('#17130f', 12, 14, 2); }

  // Der Nasenlauf: sieben Sekunden wachsen, dann fällt der Tropfen
  const zyklus = t % 7;
  if (zyklus < 4.6) {
    const laenge = Math.max(0, Math.min(6, (zyklus - 0.6) * 1.5));
    if (laenge > 0.4) {
      px('#9fb85a', 9, 16, 1, Math.round(laenge));
      px('#c3d97a', 9, 16 + Math.round(laenge) - 1);
      if (laenge > 3) px('#9fb85a', 8, 16 + Math.round(laenge) - 1, 2, 2);
    }
  } else if (zyklus < 5.4) {
    const k = (zyklus - 4.6) / 0.8;
    px('#9fb85a', 9, Math.round(20 + k * 11), 2, 2);
    px('#9fb85a', 9, 16, 1, 2);
  }

  // Zunge
  const lecken = t % 9;
  if (lecken < 0.7) px('#c46a72', 9 + Math.round(lecken * 8), 17, 2);
  // Ohren zucken
  if ((t % 4.3) < 0.22) { px('#42582a', 1, 11, 4); px('#42582a', 22, 11, 4); }
}

/* ---------------- Pips, Hortdrachling ---------------- */

function pipsBewegt(ctx, t) {
  const px = stift(ctx);

  const hoch = Math.sin(t * 5.6) > 0;
  if (hoch) {
    px('#a34322', 1, 12, 4, 2); px('#6e2a16', 0, 13, 3);
    px('#a34322', 23, 12, 4, 2); px('#6e2a16', 25, 13, 3);
  } else {
    px('#a34322', 1, 19, 4, 2); px('#6e2a16', 0, 20, 3);
    px('#a34322', 23, 19, 4, 2); px('#6e2a16', 25, 20, 3);
  }

  if ((t % 4.1) < 0.14) { px('#fce97a', 8, 9); px('#fce97a', 14, 9); }

  // Alle sechs Sekunden wirft er eine Münze hoch
  const wurf = t % 6;
  if (wurf < 1.4) {
    const k = wurf / 1.4;
    const cy = Math.round(23 - Math.sin(k * Math.PI) * 16);
    const cx = Math.round(19 + k * 5);
    px('#f2ce6a', cx, cy, 2, 2);
    px('#fff6c8', cx, cy);
  }

  const schwanz = Math.sin(t * 3.2) > 0 ? 1 : 0;
  px('#c65a28', 24 + schwanz, 22, 2, 2);
}

/* ---------------- Malvina, Hexenmeisterin ---------------- */

function malvinaBewegt(ctx, t) {
  const px = stift(ctx);

  if ((t % 4.7) < 0.14) { px('#d8dce8', 9, 13); px('#d8dce8', 15, 13); }

  // Glitzern in den Augen
  const glanz = t % 5.5;
  if (glanz < 0.9) {
    const i = Math.round(glanz / 0.9 * 3);
    px('#ffffff', 7 + i, 12);
    px('#f4f6ff', 13 + i, 12);
  }

  // Der Hut wiegt sich
  const wiegen = Math.sin(t * 1.5) > 0 ? 0 : 1;
  px('#3b2a58', 5 + wiegen, 6, 1, 3);
  px('#241a36', 21 - wiegen, 6, 1, 3);

  // Funken aus dem Kessel
  const funke = t % 3.6;
  if (funke < 0.5) {
    px('#fff6c8', 13, 24);
    px('#f2ce6a', 12, 25);
    px('#fff6c8', 15, 26);
  }
}

/* ---------------- Währungszeichen ---------------- */

/**
 * Zeichnet ein 10x10-Zeichen für eine Währung auf eine kleine Leinwand.
 * Wird in den Ladenknöpfen neben dem Preis gezeigt — einmal gemalt,
 * dann gemerkt.
 */
export function waehrungZeichnen(cv, art) {
  if (!cv || cv.__art === art) return;
  cv.__art = art;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, 10, 10);
  const px = (c, a, b, w, h) => {
    ctx.fillStyle = c;
    ctx.fillRect(a, b, w || 1, h || 1);
  };

  if (art === 'blut') {
    // Ein fallender Tropfen
    px('#c1444f', 4, 1, 2, 2); px('#c1444f', 3, 3, 4, 3); px('#c1444f', 2, 4, 6, 3);
    px('#c1444f', 3, 7, 4, 1); px('#c1444f', 4, 8, 2, 1);
    px('#e8867e', 3, 4, 1, 2); px('#7e1a22', 6, 5, 1, 2);
  } else if (art === 'gold') {
    // Eine Münze mit Glanz
    px('#a5761f', 2, 2, 6, 6); px('#a5761f', 3, 1, 4, 8); px('#a5761f', 1, 3, 8, 4);
    px('#e0b64f', 3, 2, 4, 6); px('#e0b64f', 2, 3, 6, 4);
    px('#f6d492', 3, 3, 2, 2); px('#fff6c8', 3, 3, 1, 1);
    px('#a5761f', 5, 4, 2, 2);
  } else {
    // Ein Zahnrad aus Schrott
    px('#9aa0b0', 3, 3, 4, 4);
    px('#9aa0b0', 4, 1, 2, 2); px('#9aa0b0', 4, 7, 2, 2);
    px('#9aa0b0', 1, 4, 2, 2); px('#9aa0b0', 7, 4, 2, 2);
    px('#6a6f7d', 6, 3, 1, 4); px('#6a6f7d', 3, 6, 3, 1);
    px('#2b2d38', 4, 4, 2, 2);
    px('#c6ccda', 3, 3, 1, 1);
  }
}

/* ---------------- Zaubersymbole ---------------- */

/**
 * Zeichnet ein 16x16-Symbol für die Aktionsleiste.
 * Wird nur einmal je Leinwand gemalt und dann gemerkt.
 */
export function symbolZeichnen(cv, k) {
  if (!cv || cv.__symbol === k) return;
  cv.__symbol = k;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, 16, 16);
  const px = stift(ctx);

  if (k === 'klick') {
    // Eine zupackende Hand — der eigene Angriff.
    px('#c39066', 5, 3, 6, 2); px('#c39066', 4, 5, 8, 5);
    px('#b07f57', 4, 8, 8, 2);
    px('#c39066', 3, 6, 2, 3); px('#c39066', 11, 6, 2, 3);
    px('#fff6c8', 7, 1, 2, 1); px('#fff6c8', 5, 2, 1, 1); px('#fff6c8', 10, 2, 1, 1);
    px('#6e161c', 6, 12, 4, 2); px('#a82430', 5, 13, 2, 1); px('#a82430', 9, 13, 2, 1);
  } else if (k === 'pranke') {
    px('#33202c', 3, 5, 10, 7); px('#4d3046', 3, 5, 10, 2); px('#1b0f18', 3, 10, 10, 2);
    px('#d8cfc0', 2, 11, 2, 3); px('#d8cfc0', 6, 11, 2, 4);
    px('#d8cfc0', 10, 11, 2, 4); px('#d8cfc0', 13, 11, 2, 3);
    px('#6e161c', 4, 14, 8);
  } else if (k === 'donner') {
    px('#3f4258', 3, 2, 10, 3); px('#4f5370', 4, 1, 7, 2);
    px('#cfc8ff', 8, 5, 3, 4); px('#cfc8ff', 6, 8, 4, 3); px('#cfc8ff', 7, 11, 2, 4);
    px('#f5f2ff', 8, 6, 1, 3); px('#f5f2ff', 7, 9, 1, 2);
  } else if (k === 'flamme') {
    px('#b32a12', 4, 9, 8, 6); px('#ff7a2a', 5, 5, 6, 9);
    px('#ffd08a', 7, 3, 2, 8); px('#fff1c8', 7, 6, 1, 3);
    px('#b32a12', 3, 12, 2, 3); px('#b32a12', 11, 12, 2, 3);
  } else {
    px('#ffd08a', 13, 1); px('#ffd08a', 12, 3); px('#ff7a2a', 11, 4);
    px('#b32a12', 6, 6, 5, 5); px('#ff7a2a', 7, 7, 3, 3); px('#ffd08a', 7, 7, 2, 2);
    px('#4a4640', 2, 13, 12, 2); px('#6e161c', 4, 12, 3);
  }
}
