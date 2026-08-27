# Slay'Em All!

Ein Wellen-Idle aus der Seitenansicht: Zugbrücke links, Burgtor rechts,
dazwischen ein Strom tapferer Recken. Sie gehen hinein. Was herauskommt,
kommt einzeln.

**Du bist die Burg.** Du kämpfst nie selbst — du siehst zu und entscheidest.

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

## Wie es läuft

**Tagsüber** kommen die Recken in Wellen über die Zugbrücke ins glühende Tor.
Was drinnen passiert, sieht man nicht — nur was herauskommt: Arme, Beine,
rollende Helme, Schädel im Burggraben. **Nachts** kommt keiner: Dann wird
eingekauft, und der Sammel-Drachling holt liegengebliebenes Gold.

**Verlieren geht nur auf eine Art.** Nicht durch Schaden, sondern durch Stau:
Passen mehr Recken gleichzeitig ins Tor, als die Burg fasst, ist das Monster
überfordert — und es geht **fünf Wellen zurück**. Die Beute bleibt. Deshalb ist
„Tiefere Hallen" bei Grommsch der eigentliche Verteidigungskauf.

### Drei Währungen, drei Aufgaben

| | fällt an | kauft |
| --- | --- | --- |
| **Blut** | bei jedem Tod, sofort | die vier Zauber bei Malvina |
| **Gold** | als Münze auf der Brücke — **muss aufgesammelt werden** | Zulauf und Bequemlichkeit bei Pips |
| **Schrott** | anteilig bei jedem Tod | den Ausbau der Burg bei Grommsch |

Besondere Tode — Pfeil, Blitz, Pranke, Feuer — werfen mehr Gold ab als das
bloße Verdauen. Das ist der Grund, überhaupt einzugreifen.

### Vier Fähigkeiten, Tasten 1 bis 4

**Drachenpranke** stößt aus dem Tor und zermalmt die Brücke ·
**Donnerschlag** bewaffnet den Mauszeiger, Blitz auf Klick ·
**Flammenstoß** verbrennt zu Asche ·
**Meteoritenschauer** sechs Sekunden Steinregen.

Jede hat drei Ausbauachsen bei Malvina: Schaden, Abklingzeit, Wirkbereich.

### Die fünf Ränge

Bauer → Söldner → Ritter → Paladin → Großmeister, ab den Wellen 1, 3, 7, 12
und 18. Der „Edle Köder" holt sie früher. Lebenspunkte sind zugleich
Verdauzeit: Ein Großmeister blockiert 16 Sekunden lang einen Platz.

## Aufbau

```
index.html                  das Gerüst der Seite
stil.css                    Gestaltung
spiel/
  spiel.js                  Taktgeber: Uhr, Aufrufe, Sicherung
  welt.js                   der gesamte veränderliche Zustand
  simulation.js             ein Zeitschritt der Welt
  wellen.js                 Tag, Nacht, Niederlage
  kampf.js                  Tode, Beute, Blut
  zauber.js                 die vier Fähigkeiten
  handel.js                 Einkaufen bei den Händlern
  szene.js                  das Bild
  figuren.js                Recken, Trümmer, Münzen, Tiere
  effekte.js                Zauberwirkungen und Einblendungen
  portraets.js              die bewegten Händlerporträts
  anzeige.js                Brücke zwischen Zustand und Oberfläche
  eingabe.js                Maus, Finger, Tastatur
  marktschreier.js          das Laufband
  masse.js                  die feste Bühne (480 × 200)
  speicher.js               Spielstand
  daten/                    Recken, Texte, Paletten, Porträtbilder
werkzeuge/
  wirtschaft.mjs            alle Regeln und Preise, ohne Browser
  pruefe-wirtschaft.mjs     1.592 Prüfungen
  balance.mjs               spielt Wellen durch und misst
  vorschau-server.mjs       örtlicher Server
```

Kein Baukasten, keine Abhängigkeiten, keine fremden Skripte zur Laufzeit.

## Prüfen

```bash
node werkzeuge/pruefe-wirtschaft.mjs
```

```bash
node werkzeuge/balance.mjs 60
```

Der Balance-Rechner spielt das Spiel ohne Browser durch — dieselben Module,
derselbe Zeitschritt — und urteilt über neun Kennzahlen.

## Bekannte offene Punkte

- **Ab Welle 20 wird es leichter statt schwerer.** Die Wellengröße stößt bei
  80 Recken an ihren Deckel, der Spieler wächst aber weiter. Gemessen über
  60 Wellen: Die Dauer sinkt von 129 s auf 75 s, die Käufe versiegen, und Gold
  häuft sich ungenutzt an (137 k bei Welle 60). Es gibt nichts mehr zu kaufen.
- **Kein Ton.** Weder Matsch noch Donner noch Münzklimpern.
- **Der Spielstand hält nur eine Welle fest, keine laufende.** Wer mitten in
  einer Welle neu lädt, steht wieder im Nachtlager derselben Welle.

## Der Spielstand

Liegt im Browser unter `slayemall.wellen.v1`. Der Knopf **Neustart** fragt
einmal nach und löscht ihn dann.

## Lizenz

Für den Programmcode ist noch keine gewählt.

Die mitgelieferte Schrift **Inter** von Rasmus Andersson steht unter der
SIL Open Font License 1.1 — Einzelheiten in [schriften/LIESMICH.md](schriften/LIESMICH.md).
