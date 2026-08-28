# Slay'Em All!

Ein Wellen-Idle aus der Seitenansicht: Zugbrücke links, Burgtor rechts,
dazwischen ein Strom tapferer Recken. Sie gehen hinein. Was herauskommt,
kommt einzeln.

**Du bist die Burg.** Du kämpfst nie selbst — du siehst zu und entscheidest.

## Spielen

### → **[kimpaliz.github.io/slay-em-all](https://kimpaliz.github.io/slay-em-all/)**

Läuft im Browser und auf dem Handy. Nichts anzumelden. Der Spielstand
liegt im Browser und läuft beim nächsten Besuch weiter.

**Als App aufs Handy:** Im Browsermenü „Zum Startbildschirm hinzufügen"
(Chrome: „App installieren"). Dann startet es im **Vollbild**, quer, mit
eigenem Symbol — und läuft auch ohne Netz.

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

### Eine Währung: Gold

Gold fällt als Münze auf die Brücke und **muss aufgesammelt werden** — von
Hand oder nachts vom Sammel-Drachling. Alle drei Händler kassieren es.

Besondere Tode — Pfeil, Blitz, Pranke, Feuer — werfen mehr Gold ab als das
bloße Verdauen. Seit Gold die einzige Währung ist, ist das der einzige
Grund, überhaupt einzugreifen.

**Blut** ist geblieben, aber keine Währung mehr: Der Literzähler in der
Kopfzeile ist die Bilanz des Hauses, nichts weiter. Schrott ist fort.

### Dein Klick ist auch eine Waffe

Bei Malvina für 10 Gold: **Berührung des Bösen**. Ein Klick auf einen Recken
verwundet ihn — mit Abklingzeit, Schadenszahl und Chance auf kritische
Treffer. Drei Ausbauachsen: Schaden, Abklingzeit, Krit. Der Angriff geht
**vor** dem Goldsammeln: Läuft seine Abklingzeit, fällt der Klick auf die
Münze durch. Wer schnell klickt, greift an; wer nach dem Schlag klickt,
sammelt.

### Die Wellen wachsen von selbst

Pro Welle steigen ohne jeden Kauf: **Menge**, **Lebenspunkte** (+5 %),
**Tempo** (+1 %, höchstens +50 %) und alle fünf Wellen die **Truppgröße** —
ab Welle 5 zu zweit, ab 10 zu dritt, und so weiter **ohne Deckel**. Der
Spawn-Abstand wächst mit, die Gesamtmenge bleibt also gleich; nur die
Spitzenlast am Tor steigt. Genau das macht Schlund und Kapazität wertvoll.

### Alle fünf Wellen ein Boss

Welle 5, 10, 15 … bringt **halbes Gefolge plus einen Boss**: ein Recke des
höchsten Rangs mit dem 25-fachen Leben, doppelt so groß gezeichnet, mit
eigenem Namen und dauerhaftem Lebensbalken. Er ist langsam, hat keine
Sonderfähigkeit und braucht keine — er blockiert lange einen Fressplatz,
und das Gefolge staut sich dahinter. Er wirft das zehnfache Gold ab und
**garantiert ein Artefakt**, mindestens Selten.

### Artefakte

Der dritte Reiter. Oben ein **Regal mit fünf Fassungen** — was dort liegt,
wirkt. Darunter ein **Lager mit 20 Plätzen** — wartet. Antippen öffnet eine
Karte mit Anlegen, Ablegen und Verkaufen.

Gegner lassen mit **0,05 %** Chance ein Artefakt fallen; **Bosswellen immer**
(mindestens Selten). Der *Schatzjäger* bei Pips legt je Stufe +0,1 % drauf.
Vier Seltenheiten — Gewöhnlich, Selten, Episch, Legendär — mit einem bis
vier Affixen und Verkaufswerten von 100 bis 6.400 Gold.

Der Kern des Systems sind Affixe, die **pro ausgerüstetem Tag** skalieren:
„Klick zündet an, 10 Schaden je Sekunde und Feuer-Artefakt". Wer drei
Feuer-Artefakte trägt, macht aus jedem Klick einen Flammenwerfer. Daraus
entstehen Bauweisen statt Bestenlisten.

Legendäre tragen einen einzigartigen Affix: **Der Zweite Schlund**,
**Blutzoll** (je 500 vergossene Liter eine Münze), **Rabenpakt**,
**Hungriges Gemäuer**, **Aschenkrone**.

### Fünf Schadensarten

Jeder Schaden hat eine Art, und die schwebenden Zahlen färben sich danach:
**Physisch** (Klick, Pfeile, Pranke), **Feuer** (Flamme, Meteor — Getroffene
zerfallen zu Asche und qualmen nach), **Blitz** (Donnerschlag), **Eis** und
**Gift**. Eis und Gift kommen ausschließlich über Artefakte — Gift ist
stapelbar, Frost verlangsamt.

### Vier Fähigkeiten, Tasten 1 bis 4

**Drachenpranke** stößt aus dem Tor und zermalmt die Brücke ·
**Donnerschlag** bewaffnet den Mauszeiger, Blitz auf Klick ·
**Flammenstoß** verbrennt zu Asche ·
**Meteoritenschauer** sechs Sekunden Steinregen.

Jede hat drei Ausbauachsen bei Malvina: Schaden, Abklingzeit, Wirkbereich.
Beim Überfahren zeigt jeder Knopf seine Werte — Basis und Boni getrennt.

### Die Burg frisst der Reihe nach

Verschluckte Recken warten in einer **Schlange**; über dem, der gerade
verdaut wird, läuft ein Balken ab. „Zweiter Schlund" bei Grommsch lässt
mehrere zugleich fressen — Kapazität ist der Puffer, der Schlund der
Durchsatz. Und nachts kündigt das Lager an, **was die nächste Welle
bringt** — die Aufstellung ist dann schon ausgelost.

### Bedienung

Am Schreibtisch zeigt jeder Knopf seine Werte, wenn die Maus darüberfährt.
**Am Handy gilt: antippen kauft, gedrückt halten zeigt.** Das funktioniert
bei allen Waren, bei den Fähigkeiten in der Aktionsleiste und bei
Artefakten. Der Tooltip erscheint über dem Finger und bleibt stehen, bis
man woanders hintippt — sonst läge die eigene Hand davor.

### Die fünf Ränge

Bauer → Söldner → Ritter → Paladin → Großmeister, ab den Wellen 1, 3, 7, 12
und 18 — feste Grenzen, der „Edle Köder" ist gestrichen. Lebenspunkte sind
zugleich Verdauzeit: Das Monster frisst 10 LP je Sekunde, ein Großmeister
hat 160 und blockiert damit 16 Sekunden lang einen Platz.

## Aufbau

```
index.html                  das Gerüst der Seite
stil.css                    Gestaltung
spiel/
  spiel.js                  Taktgeber: Uhr, Aufrufe, Sicherung
  welt.js                   der gesamte veränderliche Zustand
  simulation.js             ein Zeitschritt der Welt
  wellen.js                 Tag, Nacht, Niederlage
  kampf.js                  Tode, Beute, Blut, Drops
  artefakte.js              Artefakte erzeugen, bewerten, wirken lassen
  artefakt-bild.js          das Symbol eines Artefakts
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
  daten/                    Recken, Bosse, Texte, Paletten, Porträtbilder
manifest.webmanifest        macht es als App installierbar
sw.js                       Dienst im Hintergrund: offline spielbar
symbole/                    App-Symbole, erzeugt
werkzeuge/
  symbole-erzeugen.mjs      malt die App-Symbole als PNG
  wirtschaft.mjs            alle Regeln und Preise, ohne Browser
  pruefe-wirtschaft.mjs     2.203 Prüfungen
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

- **Die Prüfskripte sind noch nicht nachgezogen.** `pruefe-wirtschaft.mjs`
  und `balance.mjs` kennen Blut, Schrott und die Klick-Spielarten noch als
  Währungen und Waren; sie laufen gegen die neue `wirtschaft.mjs` nicht mehr
  durch. Dazu fehlt `pruefe-artefakte.mjs` ganz — `artefakte.js` ist mit
  austauschbarem Zufall genau dafür gebaut. Das ist der erste Schritt der
  nächsten Runde.
- **Die neue Kostenkurve ist unvermessen.** Ob Lebenspunkte (×1,05 je Welle)
  und Scharfe Klauen (+1,5 % je Stufe bei ×1,35 Preis) langfristig
  zusammenpassen, sagt erst der Balance-Rechner. Verdacht: Die Klauen laufen
  irgendwann aus dem Preis, während die Lebenspunkte weiter steigen.
- **Kein Ton.** Weder Matsch noch Donner noch Münzklimpern.
- **Der Spielstand hält nur eine Welle fest, keine laufende.** Wer mitten in
  einer Welle neu lädt, steht wieder im Nachtlager derselben Welle.

## Der Spielstand

Liegt im Browser unter `slayemall.wellen.v3`. Beim Umstieg auf eine
Währung wurden alte Stände verworfen statt umgerechnet. Der Knopf **Neustart** fragt
einmal nach und löscht ihn dann.

## Lizenz

Für den Programmcode ist noch keine gewählt.

Die mitgelieferte Schrift **Inter** von Rasmus Andersson steht unter der
SIL Open Font License 1.1 — Einzelheiten in [schriften/LIESMICH.md](schriften/LIESMICH.md).
