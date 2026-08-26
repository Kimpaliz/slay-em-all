// Malt ein Bild des Spiels ohne Browser und schreibt es als PNG.
//
//   node werkzeuge/bild-erzeugen.mjs grutz [vergroesserung]
//
// Wozu? Um am Aussehen zu arbeiten, ohne jedes Mal die Seite zu öffnen —
// und um ein Vorschaubild fürs Repository zu haben.
//
// Dafür braucht es zwei Dinge, die Node nicht mitbringt: einen sehr
// kleinen Nachbau des Zeichenstifts (nur das, was die Zeichenfunktionen
// tatsächlich benutzen) und einen PNG-Schreiber. Beides steht hier;
// Abhängigkeiten gibt es keine.

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { goblinZeichnen, GOBLIN_BREITE, GOBLIN_HOEHE } from '../spiel/goblin.js';

/* ================= Ein sehr kleiner Zeichenstift ================= */

class Farbflaeche {
  constructor(art, werte) {
    this.art = art;
    this.werte = werte;
    this.stopps = [];
  }
  addColorStop(stelle, farbe) {
    this.stopps.push({ stelle, farbe: farbeLesen(farbe) });
    this.stopps.sort((a, b) => a.stelle - b.stelle);
  }
  /** Farbe an einem Bildpunkt. */
  bei(x, y) {
    if (!this.stopps.length) return [0, 0, 0, 0];
    let t;
    if (this.art === 'linear') {
      const [x0, y0, x1, y1] = this.werte;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const laenge = dx * dx + dy * dy;
      t = laenge === 0 ? 0 : ((x - x0) * dx + (y - y0) * dy) / laenge;
    } else {
      const [x0, y0, r0, x1, y1, r1] = this.werte;
      const abstand = Math.hypot(x - x1, y - y1);
      t = r1 === r0 ? 0 : (abstand - r0) / (r1 - r0);
    }
    t = Math.max(0, Math.min(1, t));

    let vor = this.stopps[0];
    let nach = this.stopps[this.stopps.length - 1];
    for (let i = 0; i < this.stopps.length - 1; i++) {
      if (t >= this.stopps[i].stelle && t <= this.stopps[i + 1].stelle) {
        vor = this.stopps[i];
        nach = this.stopps[i + 1];
        break;
      }
    }
    const spanne = nach.stelle - vor.stelle;
    const f = spanne === 0 ? 0 : (t - vor.stelle) / spanne;
    return [0, 1, 2, 3].map((i) => vor.farbe[i] + (nach.farbe[i] - vor.farbe[i]) * f);
  }
}

/** Wandelt "#rrggbb" oder "rgba(r,g,b,a)" in [r,g,b,a] mit a von 0 bis 1. */
function farbeLesen(text) {
  if (typeof text !== 'string') return [0, 0, 0, 1];
  if (text[0] === '#') {
    const h = text.slice(1);
    const voll = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return [
      parseInt(voll.slice(0, 2), 16),
      parseInt(voll.slice(2, 4), 16),
      parseInt(voll.slice(4, 6), 16),
      1
    ];
  }
  const m = text.match(/rgba?\(([^)]+)\)/);
  if (!m) return [0, 0, 0, 1];
  const teile = m[1].split(',').map((s) => parseFloat(s.trim()));
  return [teile[0] || 0, teile[1] || 0, teile[2] || 0, teile.length > 3 ? teile[3] : 1];
}

class Stift {
  constructor(breite, hoehe) {
    this.breite = breite;
    this.hoehe = hoehe;
    this.daten = new Float64Array(breite * hoehe * 4);
    this._fillStyle = '#000000';
    this.globalAlpha = 1;
    this.imageSmoothingEnabled = false;
  }

  set fillStyle(wert) { this._fillStyle = wert; }
  get fillStyle() { return this._fillStyle; }

  setTransform() {}

  clearRect(x, y, b, h) {
    for (let yy = Math.max(0, y | 0); yy < Math.min(this.hoehe, y + h); yy++) {
      for (let xx = Math.max(0, x | 0); xx < Math.min(this.breite, x + b); xx++) {
        const i = (yy * this.breite + xx) * 4;
        this.daten[i] = this.daten[i + 1] = this.daten[i + 2] = this.daten[i + 3] = 0;
      }
    }
  }

  fillRect(x, y, b, h) {
    const verlauf = this._fillStyle instanceof Farbflaeche ? this._fillStyle : null;
    const fest = verlauf ? null : farbeLesen(this._fillStyle);
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.breite, Math.round(x + b));
    const y1 = Math.min(this.hoehe, Math.round(y + h));

    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const farbe = verlauf ? verlauf.bei(xx, yy) : fest;
        this.punktMischen(xx, yy, farbe[0], farbe[1], farbe[2], farbe[3] * this.globalAlpha);
      }
    }
  }

  /** Ganz normales Überblenden: neue Farbe über die alte, nach Deckkraft. */
  punktMischen(x, y, r, g, b, a) {
    if (a <= 0) return;
    const i = (y * this.breite + x) * 4;
    const altA = this.daten[i + 3];
    const neuA = a + altA * (1 - a);
    if (neuA <= 0) return;
    this.daten[i] = (r * a + this.daten[i] * altA * (1 - a)) / neuA;
    this.daten[i + 1] = (g * a + this.daten[i + 1] * altA * (1 - a)) / neuA;
    this.daten[i + 2] = (b * a + this.daten[i + 2] * altA * (1 - a)) / neuA;
    this.daten[i + 3] = neuA;
  }

  createLinearGradient(x0, y0, x1, y1) {
    return new Farbflaeche('linear', [x0, y0, x1, y1]);
  }
  createRadialGradient(x0, y0, r0, x1, y1, r1) {
    return new Farbflaeche('radial', [x0, y0, r0, x1, y1, r1]);
  }
}

/* ================= PNG schreiben ================= */

const CRC_TABELLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(puffer) {
  let c = 0xffffffff;
  for (let i = 0; i < puffer.length; i++) c = CRC_TABELLE[(c ^ puffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function abschnitt(name, inhalt) {
  const kopf = Buffer.alloc(4);
  kopf.writeUInt32BE(inhalt.length, 0);
  const typ = Buffer.from(name, 'ascii');
  const pruef = Buffer.alloc(4);
  pruef.writeUInt32BE(crc32(Buffer.concat([typ, inhalt])), 0);
  return Buffer.concat([kopf, typ, inhalt, pruef]);
}

export function alsPng(stift, vergroesserung = 1) {
  const b = stift.breite * vergroesserung;
  const h = stift.hoehe * vergroesserung;

  // Jede Zeile beginnt mit einem Filterbyte (0 = kein Filter).
  const zeilen = Buffer.alloc((b * 4 + 1) * h);
  let p = 0;
  for (let y = 0; y < h; y++) {
    zeilen[p++] = 0;
    const qy = Math.floor(y / vergroesserung);
    for (let x = 0; x < b; x++) {
      const qx = Math.floor(x / vergroesserung);
      const i = (qy * stift.breite + qx) * 4;
      zeilen[p++] = Math.round(Math.max(0, Math.min(255, stift.daten[i])));
      zeilen[p++] = Math.round(Math.max(0, Math.min(255, stift.daten[i + 1])));
      zeilen[p++] = Math.round(Math.max(0, Math.min(255, stift.daten[i + 2])));
      zeilen[p++] = Math.round(Math.max(0, Math.min(255, stift.daten[i + 3] * 255)));
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(b, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;   // 8 Bit je Kanal
  ihdr[9] = 6;   // Farbe mit Deckkraft
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    abschnitt('IHDR', ihdr),
    abschnitt('IDAT', deflateSync(zeilen, { level: 9 })),
    abschnitt('IEND', Buffer.alloc(0))
  ]);
}

/* ================= Aufruf ================= */

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const was = process.argv[2] || 'grutz';
const gross = Number(process.argv[3]) || 3;

if (was === 'grutz') {
  const stift = new Stift(GOBLIN_BREITE, GOBLIN_HOEHE);
  goblinZeichnen(stift, 1.0);
  const ordner = join(WURZEL, 'vorschau');
  mkdirSync(ordner, { recursive: true });
  const ziel = join(ordner, 'grutz.png');
  const png = alsPng(stift, gross);
  writeFileSync(ziel, png);
  console.log(`${ziel} geschrieben — ${GOBLIN_BREITE * gross}×${GOBLIN_HOEHE * gross}, ${png.length} Bytes`);
} else {
  console.log('Unbekannt. Bekannt ist: grutz');
  process.exit(1);
}

export { Stift };
