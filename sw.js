// Der Selbstabschalter.
//
// Bis zum Zweigwechsel am 29.08.2026 lief hier ein Dienst-Arbeiter, der
// das Spiel für den Offline-Betrieb vorrätig hielt. Der heutige Stand
// hat keinen — aber jeder Browser, der die Seite vorher besucht hat,
// trägt den alten Arbeiter noch in sich und würde ihn ewig behalten:
// Eine gelöschte sw.js meldet 404, und ein 404 lässt den alten Arbeiter
// unangetastet weiterlaufen.
//
// Deshalb liegt hier bewusst eine Datei, die sich selbst beseitigt.
// Der Browser prüft diese Adresse bei jedem Besuch, findet die neue
// Fassung, tauscht sie ein — und die räumt dann Vorrat und Anmeldung ab.

self.addEventListener('install', () => {
  // Nicht auf das Schließen alter Fenster warten — sofort übernehmen.
  self.skipWaiting();
});

self.addEventListener('activate', (ereignis) => {
  ereignis.waitUntil((async () => {
    // Alle Vorratslager des alten Arbeiters leeren.
    const lager = await caches.keys();
    await Promise.all(lager.map((name) => caches.delete(name)));
    // Sich selbst abmelden.
    await self.registration.unregister();
    // Offene Seiten übernehmen und neu laden lassen, damit sie ohne
    // Arbeiter weiterlaufen.
    const fenster = await self.clients.matchAll({ type: 'window' });
    for (const f of fenster) {
      try { f.navigate(f.url); } catch (fehler) { /* dann eben beim nächsten Besuch */ }
    }
  })());
});
