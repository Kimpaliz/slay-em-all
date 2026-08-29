// Erzeugt die App-Symbole als PNG.
//
//   node werkzeuge/symbole-erzeugen.mjs
//
// Warum ein eigener Erzeuger und keine Bilddatei im Repository: Das
// Motiv ist dasselbe wie das Lesezeichen-Symbol in `index.html` — ein
// glühender Torbogen auf dunklem Grund. Es hier zu rechnen hält beide
// Fassungen zusammen und spart ein Malprogramm. Außerdem bleibt das
// Ergebnis vorhersagbar: gleicher Lauf, gleiche Datei.
//
// Geschrieben wird ohne fremde Pakete. Ein PNG ist eine Handvoll
// Blöcke mit Prüfsumme, und `zlib` steckt in Node.

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = join(WURZEL, 'symbole');

/* ---------------- PNG schreiben ---------------- */

const CRC_TABELLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(puffer) {
  let c = -1;
  for (let i = 0; i < puffer.length; i++) c = CRC_TABELLE[(c ^ puffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function block(art, inhalt) {
  const kopf = Buffer.alloc(4);
  kopf.writeUInt32BE(inhalt.length, 0);
  const koerper = Buffer.concat([Buffer.from(art, 'latin1'), inhalt]);
  const pruef = Buffer.alloc(4);
  pruef.writeUInt32BE(crc32(koerper), 0);
  return Buffer.concat([kopf, koerper, pruef]);
}

/** `punkte` ist RGBA, vier Bytes je Bildpunkt, zeilenweise. */
function alsPng(breite, hoehe, punkte) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(breite, 0);
  ihdr.writeUInt32BE(hoehe, 4);
  ihdr[8] = 8;    // Bittiefe
  ihdr[9] = 6;    // Farbtyp: Wahrfarben mit Alpha
  // 10..12 bleiben 0: Standardverfahren für Kompression, Filter, Verschachtelung

  // Jede Zeile bekommt ein führendes Filterbyte. 0 heißt: kein Filter.
  const roh = Buffer.alloc((breite * 4 + 1) * hoehe);
  for (let y = 0; y < hoehe; y++) {
    const von = y * breite * 4;
    roh[y * (breite * 4 + 1)] = 0;
    punkte.copy(roh, y * (breite * 4 + 1) + 1, von, von + breite * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    block('IHDR', ihdr),
    block('IDAT', deflateSync(roh, { level: 9 })),
    block('IEND', Buffer.alloc(0))
  ]);
}

/* ---------------- Das Motiv ---------------- */

function farbe(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
}

/**
 * Zeichnet den Torbogen.
 *
 * `randlos` ist für das maskierbare Symbol: Android schneidet daraus
 * einen Kreis oder ein abgerundetes Quadrat. Der Grund läuft dann bis
 * an die Kante, und das Motiv sitzt kleiner in der Mitte, damit beim
 * Zuschneiden nichts Wichtiges verlorengeht.
 */
function zeichnen(groesse, randlos) {
  const px = Buffer.alloc(groesse * groesse * 4);
  const setzen = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= groesse || y >= groesse) return;
    const i = (y * groesse + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
  };

  const grund = farbe('#161826');
  const stein = farbe('#2b2d38');
  const glutAussen = farbe('#b32a12');
  const glutMitte = farbe('#ff7a2a');
  const glutKern = farbe('#ffd08a');

  // Grund. Ohne Maske mit weichen Ecken, damit es auch dort gut
  // aussieht, wo das Betriebssystem nichts zuschneidet.
  const radius = randlos ? 0 : Math.round(groesse * 0.22);
  for (let y = 0; y < groesse; y++) {
    for (let x = 0; x < groesse; x++) {
      if (radius > 0) {
        const dx = Math.max(radius - x, x - (groesse - 1 - radius), 0);
        const dy = Math.max(radius - y, y - (groesse - 1 - radius), 0);
        if (dx * dx + dy * dy > radius * radius) continue;
      }
      setzen(x, y, grund);
    }
  }

  // Das Motiv sitzt in einem Feld, das beim maskierbaren Symbol kleiner
  // ist — Android darf bis zu einem Fünftel ringsum wegschneiden.
  const feld = randlos ? groesse * 0.58 : groesse * 0.78;
  const x0 = (groesse - feld) / 2;
  const y0 = (groesse - feld) / 2;
  const e = (w) => Math.round(w * feld);   // Anteil des Feldes in Bildpunkten

  // Mauerstreifen links und rechts des Tores
  const mauerBreite = e(0.16);
  const torLinks = Math.round(x0 + e(0.26));
  const torBreite = e(0.48);
  const torOben = Math.round(y0 + e(0.30));
  const bogenRadius = torBreite / 2;
  const bogenMitte = torLinks + bogenRadius;
  const boden = Math.round(y0 + feld);

  for (let y = Math.round(y0 + e(0.16)); y < boden; y++) {
    for (let d = 0; d < mauerBreite; d++) {
      setzen(Math.round(x0 + e(0.08)) + d, y, stein);
      setzen(Math.round(x0 + e(0.76)) + d, y, stein);
    }
  }
  // Zinnen
  for (let i = 0; i < 5; i++) {
    const zx = Math.round(x0 + e(0.08) + i * e(0.17));
    for (let y = Math.round(y0 + e(0.10)); y < Math.round(y0 + e(0.17)); y++) {
      for (let d = 0; d < e(0.09); d++) setzen(zx + d, y, stein);
    }
  }

  // Der glühende Torbogen: unten hell, oben fast schwarz.
  for (let y = torOben; y < boden; y++) {
    for (let x = torLinks; x < torLinks + torBreite; x++) {
      // Rundung oben
      const dy = torOben + bogenRadius - y;
      if (dy > 0) {
        const dx = x - bogenMitte;
        if (dx * dx + dy * dy > bogenRadius * bogenRadius) continue;
      }
      const tiefe = (y - torOben) / (boden - torOben);   // 0 oben, 1 unten
      let f;
      if (tiefe < 0.35) f = glutAussen;
      else if (tiefe < 0.72) f = glutMitte;
      else f = glutKern;
      // Nach oben hin abdunkeln, damit es nach Tiefe aussieht
      const dunkel = Math.min(1, 0.35 + tiefe * 1.1);
      setzen(x, y, [
        Math.round(f[0] * dunkel),
        Math.round(f[1] * dunkel),
        Math.round(f[2] * dunkel)
      ]);
    }
  }

  return px;
}

/* ---------------- Erzeugen ---------------- */

mkdirSync(ZIEL, { recursive: true });

const dateien = [
  { name: 'symbol-192.png', groesse: 192, randlos: false },
  { name: 'symbol-512.png', groesse: 512, randlos: false },
  { name: 'symbol-maske-512.png', groesse: 512, randlos: true }
];

for (const d of dateien) {
  const png = alsPng(d.groesse, d.groesse, zeichnen(d.groesse, d.randlos));
  writeFileSync(join(ZIEL, d.name), png);
  console.log('  ' + d.name.padEnd(22) + String(png.length).padStart(7) + ' Bytes');
}
console.log('\nFertig — ' + dateien.length + ' Symbole in symbole/');
