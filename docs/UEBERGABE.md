# Übergabeprotokoll — Slay'Em All!

Stand **29.08.2026**, Version **0.14.0**.

> **Achtung, wenn du eine ältere Fassung dieser Datei in der Hand hast.**
> Es kursiert ein Übergabeprotokoll mit Stand **0.8.0** vom 28.08.2026,
> auch als Werkbank-Export `Heldenschlacht Burg-Idle.zip`. Es ist **sechs
> Fassungen veraltet** und beschreibt Regeln, die nicht mehr gelten —
> unter anderem „Blut ist keine Währung", „Bosswellen alle fünf Wellen"
> und „es gibt keinen Ton". Wer danach arbeitet, baut gegen fertige
> Arbeit. Maßgeblich ist immer der Stand im Repository, siehe
> `CLAUDE.md`.

---

## 1. Worum es geht

`Slay'Em All!` ist ein Wellen-Idle-Spiel am Burgtor. Recken laufen über
eine lange Ebene und eine Brücke ins Tor, das Monster im Inneren frisst
sie einzeln. Tag ist Angriffswelle, Nacht ist Lager und Einkauf.

**Verloren wird auf zwei Arten:** Passen mehr Recken gleichzeitig ins Tor
als die Burg fasst, ist die Welle verloren. Und: Erreicht ein **Boss** das
Tor, ist sofort Schluss — er wird nicht gefressen, er muss auf der Brücke
sterben. Beides kostet fünf Wellen.

- Repository: `Kimpaliz/slay-em-all`, Zweig `main`, öffentlich
- Live: <https://kimpaliz.github.io/slay-em-all/>
- Sprache in Code und Texten: **Deutsch**, auch Dateinamen und Bezeichner
- Kein Baukasten, keine Abhängigkeiten, nichts von fremden Servern.
  Reine ES-Module, ein `<canvas>`, ein Stylesheet.

---

## 2. Dateien

```
CLAUDE.md             Arbeitsanweisung — wird beim Sitzungsstart gelesen
index.html            Seite samt Titelbild
stil.css              Aussehen
manifest.webmanifest  installierbare App, Vollbild, quer
sw.js                 Dienst-Arbeiter: Netz zuerst, Vorrat als Rückhalt
symbole/              drei App-Symbole, erzeugt statt gemalt
spiel/                20 Module
  spiel.js            Taktgeber, Titelbild, Uhr (fester Schritt 1/60 s)
  welt.js             Zustand
  speicher.js         Spielstand (Schlüssel slayemall.wellen.v3)
  simulation.js       ein Zeitschritt der Welt
  wellen.js           Auslosen, Phasen, Bosswellen
  kampf.js            Schaden, Tode, Beute, verbuchen()
  zauber.js           vier Fähigkeiten und der Klick
  handel.js           Kauf bei den drei Händlern
  artefakte.js        reine Logik, austauschbarer Zufall
  artefakt-bild.js    Symbol in zwei Größen
  klang.js            17 gerechnete Klänge, keine Tondatei
  vollbild.js         Vollbildknopf für den normalen Browser
  szene.js            das Bild
  figuren.js          Recken, Trümmer, Münzen, Putzgoblins
  effekte.js          Zauberwirkungen und Einblendungen
  portraets.js        drei bewegte Händlerporträts
  anzeige.js          Brücke zwischen Zustand und Oberfläche
  eingabe.js          Maus, Finger, Tastatur
  masse.js            die feste Bühne (800 × 200)
  daten/              recken.js, bosse.js, texte.js, paletten.js,
                      portraets-daten.js
werkzeuge/
  wirtschaft.mjs      Regeln, Preise, Skalierung — ohne Browser, ohne Zufall
  pruefe-wirtschaft.mjs   2.351 Prüfungen
  pruefe-artefakte.mjs    15.108 Prüfungen
  pruefe-simulation.mjs   26 Prüfungen
  balance.mjs             spielt Wellen durch und urteilt
  symbole-erzeugen.mjs    erzeugt die App-Symbole als PNG
  vorschau-server.mjs     örtlicher Server
docs/
  UEBERGABE.md        diese Datei
  ENTWURF.md          der 0.7er-Umbauplan, abgearbeitet
  ROADMAP.md          Janniks Wunschliste
  BALANCE-2026-08-28.md   Messbericht
CHANGELOG.md          Änderungsprotokoll, ausführlich
```

---

## 3. Regeln, wie sie **jetzt** gelten

### Zwei Währungen

- **Gold** fällt als Münze auf die Brücke und muss aufgesammelt werden.
  Ab 40 Gold je Stück fällt es als **Edelstein** statt als Kleingeld.
  Damit bezahlt man bei **Grommsch** (Burgausbau) und **Pips** (Beute).
- **Blut** ist seit 0.13.0 **wieder Zahlungsmittel** — aber es liegt am
  Boden. Wer stirbt, hinterlässt eine Lache; die ist noch kein Geld.
  **Putzgoblins** wischen sie auf und bringen das Blut heim. Eine Lache
  fasst 60 Liter, der Rest versickert — **Blut stapelt sich nicht**.
  Damit bezahlt man bei **Malvina** (Zauber, Klick, Morgenritual).
- Schrott ist fort.

### Bühne

800 × 200 Punkte, Landmarken um 320 nach rechts gerückt, links davor
offenes Land. Der Weg ins Tor ist 635 Punkte lang. Die Leinwand passt
nicht auf einen Schirm und **scrollt waagerecht**; der Blick beginnt am
Tor. Nur die Einblendungen folgen dem sichtbaren Ausschnitt.

### Fresszeit statt Lebensabbau

Seit 0.10.0 zwei getrennte Achsen: `lp` sagt, wie schwer einer auf der
Brücke zu töten ist, `fressZeit`, wie lange er das Tor blockiert.
Normale Recken 2 Sekunden, der **Panzerritter** 7 — er ist der
Verstopfer. Verdaut wird der Reihe nach; „Zweiter Schlund" erhöht den
Durchsatz, Kapazität ist der Puffer.

### Sieben Reckenklassen

Bauer (ab 1) · Söldner (3) · Ritter (7) · **Panzerritter** (9) ·
Paladin (12) · **Heilzauberer** (14, grüne Heilaura) · Großmeister (18).

### Wellenskalierung

Menge (Deckel 80), Leben ×1,05 je Welle, Truppgröße `1 + ⌊w/5⌋` **ohne
Deckel**. Das Tempo hat seit 0.14.0 eine **Schwelle bei Welle 10**:
davor +1 % je Welle, dort einmalig **+12 %**, danach **+5 % je Welle**,
Deckel +160 %. Am Anschlag braucht ein Bauer noch gut zwölf Sekunden
über die Brücke — schneller wäre unfair.

### Bosse

**Alle zehn Wellen.** Halbes Gefolge plus ein Boss mit 14-fachem Leben
eines gewöhnlichen Recken derselben Welle, 0,6-fachem Tempo, doppelter
Größe. **Er wird nicht gefressen** — erreicht er das Tor, ist sofort
Schluss. Er schüttelt Beeinträchtigungen ab: Frost und Raureif wirken nur
ein Zehntel so lang, danach zehn Sekunden gar nicht. **Gift und Brand
bleiben voll wirksam** — sie sind das Mittel, das gegen ihn wirken soll.

### Zauber und Klick

Vier Fähigkeiten auf den Tasten 1–4. **Donnerschlag** und
**Flammenstoß** zielen: erster Druck bewaffnet den Zeiger, der Klick
setzt. Der Flammenstoß ist seit 0.13.0 ein **Napalmwurf** — über zwei
Sekunden fallen Brocken ins gewählte Gebiet, danach brennt der Boden
drei Sekunden weiter. Der Klick hat drei Achsen (Schaden, Abklingzeit,
Krit); Rangfolge beim Klicken: Zauberziel → Fundstück → Gegner → Münze.

Fünf Schadensarten mit eigener Farbe: Physisch weiß, Feuer orange, Blitz
lila-weiß, Eis blau, Gift grün. Krits golden und größer. **Blitztote
platzen** — dreimal so viele Teile und Spritzer, steil nach oben.

### Artefakte

Dritter Reiter. Regal 5 Fassungen (wirkt) über Lager 20 Plätze (wartet),
Antippen öffnet die Detailkarte. Fundchance 0,05 % je Toter,
Bosswellen garantiert mindestens Selten, „Schatzjäger" bei Pips gibt
+0,1 % je Stufe. Tags werden nie gespeichert, sondern aus den Affixen
abgeleitet.

### Bedienung

Antippen kauft, **380 ms halten zeigt die Werte** — bei Waren,
Fähigkeiten, Artefakten und am **Wellensymbol** (Tempo, Leben, Trupp,
Fundchance, Gold je Recke). Der Tooltip steht über dem Druckpunkt und
bleibt nach dem Loslassen stehen. Sitzt das Element ganz oben, rutscht
er unter das Element statt an den Bildrand.

### Ton

17 Klänge, **beim Abspielen gerechnet**, keine einzige Tondatei. Der
Tonapparat wird im „Spielen"-Knopf des Titelbilds geweckt, weil Browser
eine echte Nutzergeste verlangen. Tonknopf in der Kopfzeile.

---

## 4. Entscheidungen, die feststehen

1. **Das Repository ist die Quelle.** Die Design-Werkbank wird für dieses
   Spiel nicht mehr als Exportziel benutzt — ihr Ausgabepaket würde die
   Aufteilung überschreiben. Der ZIP vom 29.08. ist Stand 0.8.0 und
   **darf nicht eingespielt werden**.
2. Midas-Berührung, Infernale Berührung und Faust des Titanen sind
   gestrichen, samt Goldstatuen. Kommen nicht zurück.
3. Der Marktschreier ist entfernt (0.11.0) — das Laufband kostete Platz.
4. Seltenheitsnamen klassisch: Gewöhnlich / Selten / Episch / Legendär.
5. Kein Ziehen-und-Fallenlassen bei Artefakten.
6. Alte Spielstände werden **nicht umgerechnet**, sondern gelöscht.
7. Fester Zeitschritt 1/60 s mit Nachholen; im Hintergrund pausiert das
   Spiel (unsichtbar kann man nur verlieren).
8. Harte Preisregel: **`preiswachstum > wirkung`**.
9. Die alte Idle-Fassung bleibt als `v0.4.1-idle` erhalten.
10. Die Simulation hängt nie am Zeichnen — `simulation.js` importiert
    nichts aus `szene.js`.

---

## 5. Was offen ist

### 5.1 Die Kapazitätswand (wichtigster Punkt)

„Tiefere Hallen" kostet 400 Gold, und so viel kommt früh nicht herein.
Gemessen am 28.08.2026: Ein Bot, der jede Münze spart und **nichts
anderes kauft**, hatte nach 30 Wellen erst 165 Gold. Ohne Kapazität
verliert man zuverlässig und fällt fünf Wellen zurück, was das Einkommen
weiter senkt. Seit 0.13.0 mildert der Blutkreislauf das (Zauber sind
jetzt erreichbar), gelöst ist es nicht.

### 5.2 Unvermessen

- Ob sich 0,05 % Fundchance plus Bossgarantie richtig anfühlt.
- Ob die Truppgröße ohne Deckel irgendwann unspielbar wird.
- Der Installationsvorgang am echten Gerät („Zum Startbildschirm
  hinzufügen") — nur das lässt sich nicht aus der Ferne prüfen.

### 5.3 Wunschliste

Siehe `docs/ROADMAP.md`: Bannerträger, weitere Einheiten und Kulturen,
andere Burglayouts, Musik, Prestige, Zauber als Fundstücke mit
gemeinsamen Werten.

---

## 6. Arbeitsweise

Steht verbindlich in **`CLAUDE.md`** im Wurzelverzeichnis. Kurz:

- **Erst lesen, dann anfassen** — `CHANGELOG.md`, `docs/ENTWURF.md`,
  `README.md`. Der Chatverlauf ist nicht die Quelle der Wahrheit.
- **Jede Änderung wird notiert**, mit Grund, gemessenen Zahlen und
  Fehlern samt Ursache.
- **Geprüft heißt gemessen.** Nicht „sollte gehen", sondern eine Zahl.
- **Jedes Modul einmal laden**, nicht nur `node --check` — das löst
  Importe nicht auf und übersieht tote Importe.
- **Am Handy nachmessen.** In 0.11.0 wurde das versäumt; zwei Fehler
  machten die Seite auf dem Telefon unbenutzbar.
- Reine Rechnung bleibt in `wirtschaft.mjs`, ohne Browser und ohne
  Zufall.
- **Eine Stelle je Sache.** `verbuchen()` läuft bei jedem Tod genau
  einmal.
