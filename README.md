# Slay'Em All!

Ein Idle-Spiel aus der Seitenansicht: Zugbrücke links, Burgtor rechts, dazwischen ein
stetiger Strom tapferer Recken. Sie gehen hinein. Was herauskommt, kommt einzeln.

Es gibt keine Niederlage. Das Böse in der Burg gewinnt grundsätzlich — die einzige Frage
ist, wie schnell und wie viele.

## Spielen

### → **[kimpaliz.github.io/slay-em-all](https://kimpaliz.github.io/slay-em-all/)**

Läuft im Browser und auf dem Handy. Nichts zu installieren, nichts anzumelden.
Der Spielstand liegt im Browser und läuft beim nächsten Besuch weiter.

### Örtlich, zum Weiterentwickeln

**Doppelklick auf `Vorschau-starten.cmd`.** Der Browser öffnet sich von selbst.
Zum Beenden das schwarze Fenster schließen.

Warum nicht einfach `index.html` doppelklicken? Das Spiel besteht aus mehreren
Dateien, und Browser verbieten aus Sicherheitsgründen, dass eine direkt von der
Festplatte geöffnete Seite weitere Dateien nachlädt. Über einen kleinen lokalen
Server geht es. Der steckt mit im Projekt, es muss nichts installiert werden
außer [Node.js](https://nodejs.org).

Im Netz läuft es ohne diesen Umweg, weil dort ein echter Server steht.

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
  anzeige.js            schreibt Zahlen und Listen in die Seite, nimmt Klicks an
  ansichten.js          Wischen und Reiter zwischen Tor und Schatzkammer
  goblin.js             Grutz — das Portraet, von Hand gesetzt
  tageslauf.js          Tag, Nacht und die Wellen
  speicher.js           Spielstand sichern und laden
  daten/
    recken.js           die fünf Reckenklassen
    ausbauten.js        die fünf Ausbauten und die Kaufsprüche
    texte.js            Namen, Beinamen, Reime
    paletten.js         die drei Farbwelten

werkzeuge/
  wirtschaft.mjs        die gesamte Rechnerei — ohne Browser, in Node prüfbar
  pruefe-wirtschaft.mjs 101 Prüfungen
  balance.mjs           spielt Tage durch und bewertet die Kurve
  bild-erzeugen.mjs     malt Bilder ohne Browser und schreibt PNG
  vorschau-server.mjs   der lokale Server
```

**Die wichtigste Trennung:** `werkzeuge/wirtschaft.mjs` enthält alle Formeln und
kennt weder Bildschirm noch Browser. Dadurch kann Node sie durchrechnen, ohne
dass jemand zusehen muss. Wer an der Balance schrauben will, tut es dort.

## Balance prüfen

```bash
node werkzeuge/pruefe-wirtschaft.mjs
node werkzeuge/balance.mjs 25
```

Das erste prüft in einer Sekunde 101 feste Erwartungen. Das zweite spielt
25 Tage durch und bewertet sechs Kennzahlen: Käufe je Nacht, wann der erste
Schädel kommt, wann die letzte Reckenklasse auftaucht, wie oft der Haufen
überläuft, wie stark das Blut wächst und ob die Zahlen lesbar bleiben.

## Wie es läuft

Ein Tag dauert 100 Sekunden, die Nacht 50.

**Tagsüber** kommen die Recken in Wellen über die Zugbrücke und verschwinden im
glühenden Torbogen. Der Kampf bleibt unsichtbar. Sichtbar sind Arme, Beine,
Rümpfe, rollende Helme, Schädel, die in den Burggraben plumpsen, und Blutlachen,
die auf den Planken liegen bleiben und in die Tiefe tropfen. **Blut** fließt
sofort ins Haus. **Knochen und Schrott** bleiben als Haufen an der Mauer liegen.

**Nachts** kommt niemand mehr. Die Kobolde tragen den Haufen ab — erst jetzt
werden Knochen und Schrott gutgeschrieben. Und nur jetzt wird eingekauft:
Das Haus handelt nicht bei Tageslicht.

Ist der Haufen voll, fällt neue Beute in die Schlucht. Deshalb lohnen sich
Kobolde: Sie ernten schneller und stapeln höher.

## Die zwei Ansichten

Gewischt wird zwischen **dem Tor** und **der Schatzkammer** (oder geklickt,
oder Pfeiltasten). Am Tor bezahlt der Hausherr mit Blut. In der Kammer sitzt
**Grutz**, der Kobold, und handelt mit Schrott und Schädeln.

## Die drei Währungen

| Währung | Woher | Wofür |
| --- | --- | --- |
| **Blut** (Liter) | fließt sofort beim Sterben | Lockrufe, breiteres Tor |
| **Schrott** | nachts geerntet | Klingen, Presse, Kobolde |
| **Knochen** | nachts geerntet | wird nie ausgegeben — daraus werden beim Neuanfang Schädel |

Blut wird in Litern gerechnet; ein Bauer trägt fünf davon. Unter der Zahl steht,
was sie bedeutet: *etwa 1,8 Schwimmbecken*, *etwa 3 Bodenseen*.

## Neuanfang

Der Knochenhaufen an der Mauer wächst sichtbar. Irgendwann trägt die Burg ihn ab:
Blut, Schrott und alle Ausbauten gehen zurück auf null, dafür gibt es **Schädel**.
Die kaufen Dauerhaftes — Blutzoll, Ruf im Tal, Erbe des Hauses und den
**Verwalter**, der wieder von selbst einkauft.

Wer lange spielt, bekommt nicht linear mehr Schädel, sondern nach der Wurzel.
Eine Runde ewig auszudehnen lohnt sich also nicht.

## Bestiarium

Mit steigender Zahl an Erledigten kommen stärkere Klassen dazu:
Bauer → Söldner → Ritter → Paladin → Großmeister. Der Letzte taucht nach
etwa einer halben Stunde auf.

## Lizenz

Für den Programmcode ist noch keine gewählt.

Die mitgelieferte Schrift **Inter** von Rasmus Andersson steht unter der
SIL Open Font License 1.1 — Einzelheiten in [schriften/LIESMICH.md](schriften/LIESMICH.md).
