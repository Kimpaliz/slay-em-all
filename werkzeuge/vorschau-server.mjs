// Kleiner Server, damit das Spiel örtlich läuft.
//
// Nötig ist er, weil das Spiel aus mehreren Dateien besteht: Browser
// verbieten das Nachladen von Modulen, wenn eine Seite per Doppelklick
// direkt von der Festplatte geöffnet wird. Über einen Server geht es.
//
// Nur Lesen, nur die eigene Maschine, keine Konfiguration nötig.
//
//   node werkzeuge/vorschau-server.mjs
//
// oder bequemer: Vorschau-starten.cmd doppelklicken.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 4200);

const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

const server = createServer(async (anfrage, antwort) => {
  if (anfrage.method !== 'GET' && anfrage.method !== 'HEAD') {
    antwort.writeHead(405, { allow: 'GET, HEAD' });
    return antwort.end('Nur Lesen erlaubt.');
  }

  let pfad = decodeURIComponent(new URL(anfrage.url, 'http://x').pathname);
  if (pfad.endsWith('/')) pfad += 'index.html';

  // normalize() räumt ".." weg; der anschließende Vergleich stellt sicher,
  // dass wirklich nichts außerhalb des Projektordners ausgeliefert wird.
  const datei = join(WURZEL, normalize(pfad).replace(/^[/\\]+/, ''));
  if (!datei.startsWith(WURZEL)) {
    antwort.writeHead(403);
    return antwort.end('Außerhalb des Projekts.');
  }

  try {
    const inhalt = await readFile(datei);
    antwort.writeHead(200, {
      'content-type': TYPEN[extname(datei).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    antwort.end(anfrage.method === 'HEAD' ? undefined : inhalt);
  } catch {
    antwort.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    antwort.end('Nicht gefunden: ' + pfad);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  Slay\'Em All! läuft.');
  console.log('  Im Browser öffnen:  http://127.0.0.1:' + PORT + '/');
  console.log('');
  console.log('  Zum Beenden dieses Fenster schließen oder Strg+C drücken.');
  console.log('');
});
