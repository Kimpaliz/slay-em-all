// Der Dienst im Hintergrund: macht das Spiel installierbar und offline
// spielbar.
//
// **Netz zuerst, Vorrat als Rückhalt.** Das ist bewusst so herum. Der
// umgekehrte Weg (Vorrat zuerst) wäre schneller, würde aber nach jeder
// Veröffentlichung den alten Stand zeigen — genau der Ärger, den der
// Browser-Zwischenspeicher schon einmal gemacht hat. So ist online
// immer das Neueste zu sehen, und ohne Netz läuft trotzdem alles.
//
// Nur eigene Dateien werden angefasst. Fremde Adressen gibt es in
// diesem Spiel ohnehin nicht.

const VORRAT = 'slayemall-v1';

/** Wird beim ersten Besuch eingelagert, damit es offline sofort läuft. */
const GRUNDAUSSTATTUNG = [
  './',
  'index.html',
  'stil.css',
  'manifest.webmanifest',
  'schriften/inter-latein.woff2',
  'symbole/symbol-192.png',
  'symbole/symbol-512.png'
];

self.addEventListener('install', (e) => {
  // Sofort übernehmen statt auf das Schließen aller Tabs zu warten.
  self.skipWaiting();
  e.waitUntil(
    caches.open(VORRAT)
      // `reload` umgeht den normalen Browser-Zwischenspeicher — sonst
      // legten wir womöglich gleich veraltete Dateien ein.
      .then((v) => v.addAll(GRUNDAUSSTATTUNG.map((u) => new Request(u, { cache: 'reload' }))))
      .catch(() => { /* Einzelne Fehlschläge dürfen die Installation nicht kippen */ })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== VORRAT).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const anfrage = e.request;
  if (anfrage.method !== 'GET') return;
  if (new URL(anfrage.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(anfrage)
      .then((antwort) => {
        // Gelungenes wandert in den Vorrat, damit es beim nächsten Mal
        // auch ohne Netz da ist.
        if (antwort && antwort.ok) {
          const kopie = antwort.clone();
          caches.open(VORRAT).then((v) => v.put(anfrage, kopie)).catch(() => {});
        }
        return antwort;
      })
      .catch(() => caches.match(anfrage).then((treffer) => {
        if (treffer) return treffer;
        // Eine Seitenanfrage ohne Netz und ohne Treffer bekommt die
        // Startseite — sonst stünde da die Fehlerseite des Browsers.
        if (anfrage.mode === 'navigate') return caches.match('index.html');
        return Response.error();
      }))
  );
});
