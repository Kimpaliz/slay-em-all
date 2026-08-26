# Slay'Em All!

Ein Idle-Spiel aus der Seitenansicht: Zugbrücke links, Burgtor rechts, dazwischen ein
stetiger Strom tapferer Recken. Sie gehen hinein. Was herauskommt, kommt einzeln.

Es gibt keine Niederlage. Das Böse in der Burg gewinnt grundsätzlich — die einzige Frage
ist, wie schnell und wie viele.

## Spielen

**Doppelklick auf `Vorschau-starten.cmd`.** Der Browser öffnet sich von selbst.
Zum Beenden das schwarze Fenster schließen.

Warum nicht einfach `index.html` doppelklicken? Das Spiel besteht aus mehreren
Dateien, und Browser verbieten aus Sicherheitsgründen, dass eine direkt von der
Festplatte geöffnete Seite weitere Dateien nachlädt. Über einen kleinen lokalen
Server geht es. Der steckt mit im Projekt, es muss nichts installiert werden
außer [Node.js](https://nodejs.org).

Auf GitHub Pages läuft es ohne diesen Umweg, weil dort ein echter Server steht.

## Aufbau

```
index.html              die Seite: Kopfzeile, Bild, Laufband, drei Karten
stil.css                Gestaltung
schriften/              Inter, nur der lateinische Teil (48 KB)

spiel/
  spiel.js              Taktgeber — hält die Uhr, ruft alles andere auf
  welt.js               der gesamte veränderliche Zustand
  masse.js              feste Maße der Szene (wo Brücke, Tor und Mauer liegen)
  simulation.js         was passiert, wenn Zeit vergeht
  szene.js              das Bild: Himmel, Schlucht, Burg, Tor, Brücke
  figuren.js            Recken, Trümmer, Raben, Klaue, Fackeln
  marktschreier.js      das Laufband unter dem Bild
  anzeige.js            schreibt Zahlen und Listen in die Seite
  speicher.js           Spielstand sichern und laden
  daten/
    recken.js           die fünf Reckenklassen
    ausbauten.js        die fünf Ausbauten und die Kaufsprüche
    texte.js            Namen, Beinamen, Reime
    paletten.js         die drei Farbwelten

werkzeuge/
  wirtschaft.mjs        die gesamte Rechnerei — ohne Browser, in Node prüfbar
  pruefe-wirtschaft.mjs Prüfungen und Verlaufsrechnung
  vorschau-server.mjs   der lokale Server
```

**Die wichtigste Trennung:** `werkzeuge/wirtschaft.mjs` enthält alle Formeln und
kennt weder Bildschirm noch Browser. Dadurch kann Node sie durchrechnen, ohne
dass jemand zusehen muss. Wer an der Balance schrauben will, tut es dort.

## Balance prüfen

```bash
node werkzeuge/pruefe-wirtschaft.mjs
```

Das läuft in einer Sekunde und zeigt zwei Dinge: ob die Formeln noch das tun,
was sie sollen (25 feste Prüfungen), und wie sich eine Stunde Spielzeit
tatsächlich entwickelt — Erledigte, Blut, Käufe, Engpass, Freischaltungen.

## Was passiert

- **Zulauf** — Recken kommen von links über die Zugbrücke und verschwinden im glühenden Torbogen.
- **Gemetzel** — der Kampf bleibt unsichtbar. Sichtbar sind Arme, Beine, Rümpfe, rollende Helme,
  Schädel, die in den Burggraben plumpsen, und Blutlachen, die auf den Planken liegen bleiben
  und in die Tiefe tropfen.
- **Bestiarium** — mit steigender Zahl an Erledigten kommen stärkere Klassen dazu:
  Bauer → Söldner → Ritter → Paladin → Großmeister.
- **Ausbau** — die Burg kauft **selbst** ein: Lockrufe, scharfe Klingen, breiteres Tor,
  fettere Beute, Kobold-Diener.
- **Marktschreier** — ein Nachrichten-Laufband kommentiert jeden Toten in gereimten Zweizeilern.
- **Währungen** — Blut, Knochen, Schrott.

Der Spielstand liegt im Browser unter `slayemall.stand.v2` und läuft beim Neuladen weiter.
Ein alter Stand unter `burgtor.scene.v1` wird beim ersten Start übernommen.

## Stand der Dinge

Das hier ist bislang eine **Szene**, kein Spiel: Es gibt kein einziges Bedienelement,
und Blut, Knochen und Schrott werden nirgends ausgegeben. Sie zählen nur hoch.
Der Ausbau läuft von allein und kostet nichts.

Was daraus eine echte Idle-Schleife macht, ist der nächste Arbeitsschritt.

## Lizenz

Noch keine gewählt.
