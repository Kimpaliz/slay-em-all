# Übergabeprotokoll — Slay'Em All!

Stand **28.08.2026**, Version **0.8.0**. Zum Einfügen in einen neuen Chat.

---

## 1. Worum es geht

`Slay'Em All!` ist ein Wellen-Idle-Spiel am Burgtor. Recken laufen über eine
Brücke ins Tor, das Monster im Inneren frisst sie einzeln. Tag ist
Angriffswelle, Nacht ist Lager und Einkauf. Verlieren geht nur durch Stau:
Passen mehr Recken ins Tor als die Burg fasst, geht es fünf Wellen zurück.

- Repository: `Kimpaliz/slay-em-all`, Zweig `main`, öffentlich
- Live: <https://kimpaliz.github.io/slay-em-all/>
- Sprache im Code und in allen Texten: **Deutsch**, auch Dateinamen und
  Bezeichner (`wirtschaft.mjs`, `verbuchen()`, `REGAL_PLAETZE`)
- Kein React, keine fremde Laufzeit, keine Abhängigkeiten. Reines
  ES-Modul-JavaScript, ein `<canvas>`, ein Stylesheet.

Historie in Kurzform: 0.1.0 Übernahme aus einer 481-KB-Einzeldatei →
0.2.0 Aufteilung in Module → 0.3.0 Tag-Nacht-Schleife → 0.4.0 Schatzkammer →
0.5.0 Wellen-Fassung (heutiger Zweig, 24 Dateien) → 0.6.0 Klick als Waffe +
Fressschlange → 0.7.0 große Vereinfachung → 0.8.0 Artefakte.

---

## 2. Dateien

```
index.html            Seite
stil.css              Aussehen
spiel/                19 Module
  spiel.js            Start
  welt.js             Zustand
  speicher.js         Spielstand (Schlüssel slayemall.wellen.v3)
  simulation.js       Uhr, fester Schritt 1/60 s mit Nachholen
  wellen.js           Auslosen, Spawn, Bosswellen
  kampf.js            Schaden, Tod, verbuchen()
  zauber.js           Vier Fähigkeiten (Tasten 1–4)
  handel.js           Kauf bei den Händlern
  artefakte.js        Reine Logik, austauschbarer Zufall
  artefakt-bild.js    Symbol, zwei Größen
  szene.js            Bühne, Himmel, Tor, Abgrund
  figuren.js          Recken, Trümmer, Raben
  effekte.js          Partikel, Rauch, Gluten
  portraets.js        Drei Händlerporträts (28 × 32, von Hand gesetzt)
  anzeige.js          Schreibt Werte in die Seite
  eingabe.js          Maus, Tasten, Wischen
  marktschreier.js    Textzeilen
  masse.js            Liter in Badewannen und Bodenseen
  daten/              recken.js, bosse.js, texte.js, paletten.js
werkzeuge/
  wirtschaft.mjs      Regeln, Preise, Skalierung — ohne Browser, ohne Zufall
docs/
  ENTWURF.md          Der Umbauplan — vollständig abgearbeitet
  UEBERGABE.md        Diese Datei
CHANGELOG.md          Änderungsprotokoll, ausführlich, deutsch
github.md            Repo-Bindung und Sync-Stand
```

Daneben liegen im Projekt drei Vorschau-Hüllen für die Werkbank
(`Slay Em All.dc.html`, `Vorschau Desktop.dc.html`, `Vorschau Handy Quer.dc.html`)
— sie zeigen `index.html` in einem Rahmen und sind **nicht** Teil des Spiels.

**Nicht im Projekt, aber im Repo:** `werkzeuge/pruefe-wirtschaft.mjs`,
`werkzeuge/balance.mjs`, `werkzeuge/vorschau-server.mjs`.

---

## 3. Regeln, wie sie jetzt gelten

**Eine Währung.** Alles kostet Gold. Gold fällt als Münze auf die Brücke und
muss aufgesammelt werden. Blut steht nur noch als Bilanz in der Kopfzeile —
vergossene Liter, kein Zahlungsmittel. Schrott ist fort.

**Der Klick.** Eine Fassung, drei Achsen (Schaden / Abklingzeit / Krit).
Rangfolge beim Klicken: Blitz → Fundstück → Gegner → Münze.

**Zahlen ×10** gegenüber 0.6.0, Zeiten unverändert: 10 LP Fressen je Sekunde,
Bauer 20 LP.

**Fünf Schadensarten** mit eigener Farbe der schwebenden Zahl: Physisch weiß,
Feuer orange, Blitz lila-weiß, Eis blau, Gift grün. Krit golden und größer.

**Passive Wellenskalierung** je Welle: Menge (Deckel 80), Leben ×1,05,
Tempo +1 % (Deckel +50 %), Truppgröße `1 + ⌊w/5⌋` **ohne Deckel**. Der
Spawn-Abstand wächst mit — Gesamtmenge gleich, Spitzenlast am Tor steigt.

**Bosswellen** alle fünf Wellen: halbes Gefolge plus ein Boss mit 25-fachem
Leben, 0,6-fachem Tempo, doppelter Größe, goldenem Lebensbalken, eigenem
Namen. Zehnfaches Gold. Keine Sonderfähigkeit — die Blockade des
Fressplatzes trägt allein.

**Fressschlange.** Verdaut wird einer nach dem anderen; „Zweiter Schlund"
erhöht den Durchsatz, Kapazität ist der Puffer.

### Artefakte (0.8.0)

- Dritter Reiter, am Handy die dritte Wischseite
- **Regal 5 Fassungen** (wirkt) über **Lager 20 Plätze** (wartet)
- Antippen öffnet Detailkarte mit Anlegen / Ablegen / Verkaufen. Kein Ziehen.
- Lager voll → neuer Fund zahlt sich sofort als Gold aus
- Datenform: `{ name, seltenheit, fundwelle, affixe: [{ k, wert }] }`.
  **Tags werden nie gespeichert**, sondern beim Laden aus den Affixen abgeleitet.
- Güte skaliert mit der Fundwelle: `1 + 0,35 × ⌊Fundwelle/5⌋`
- Seltenheiten: Gewöhnlich 1 Affix / 100 G · Selten 2 / 400 · Episch 3 / 1.600 ·
  Legendär 4 / 6.400. Legendär erst ab Welle 15.
- **Fundchance 0,05 %** je getötetem Recken; Bosswellen **garantiert**,
  mindestens Selten. Pips-Ware „Schatzjäger" (50 G, ×2,0, max 10): +0,1 % je Stufe.
- 15 Affixe über sechs Tags — Feuer, Gift, Eis, Blitz, Gold, Burg. Kern ist
  „Brennende Berührung": Klick zündet an, 10 Schaden/s je ausgerüstetem
  Feuer-Artefakt. Gift stapelt (eigene Uhr je Treffer), Frost nicht (stärkster gewinnt).
- 5 legendäre Affixe: Der Zweite Schlund (+1 Maul) · Blutzoll (Münze je
  500 Liter) · Rabenpakt (Raben tragen Restgold ein) · Hungriges Gemäuer
  (Tod im Tor → +3 % Fresstempo, 6 s, ×10) · Aschenkrone (Verbrannter
  hinterlässt Glut, Ketten gewollt)
- **Kettenblitz nur als Affix**, nicht als Grundverhalten

---

## 4. Entscheidungen, die feststehen

Nicht neu aufrollen, sie sind bewusst so gefallen:

1. **Das Repository ist die Quelle.** Die Design-Werkbank wird für dieses
   Spiel nicht mehr als Exportziel benutzt — ihr Ausgabepaket würde die
   Aufteilung in 24 Dateien bei jedem Mal überschreiben.
2. **Midas-Berührung, Infernale Berührung und Faust des Titanen sind
   gestrichen**, samt Goldstatuen. Kommen nicht zurück.
3. Blut und Schrott sind **keine Währungen** mehr.
4. Seltenheitsnamen klassisch: Gewöhnlich / Selten / Episch / Legendär.
5. Kein Ziehen-und-Fallenlassen bei Artefakten — Antippen, weil es am Handy
   genauso gut geht.
6. Alte Spielstände werden **nicht umgerechnet**, sondern gelöscht. Bei jedem
   Schlüsselwechsel: neuer Schlüssel, alte werden beim Start entfernt.
7. Fester Zeitschritt 1/60 s mit Nachholen statt schwankender Bildrate; im
   Hintergrund pausiert das Spiel (unsichtbar kann man nur verlieren).
8. Harte Preisregel: **`preiswachstum > wirkung`**, sonst trägt jede Stufe die
   nächste und das Spiel ist nach zwanzig Minuten vorbei.
9. Die alte Idle-Fassung bleibt als `v0.4.1-idle` erhalten.

---

## 5. Was offen ist — in dieser Reihenfolge

### 5.1 Prüfskripte nachziehen (erster Schritt)

`pruefe-wirtschaft.mjs` und `balance.mjs` kennen noch Blut und Schrott als
Währungen, die drei gestrichenen Waren und die drei Klick-Spielarten. Sie
**laufen gegen die heutige `wirtschaft.mjs` nicht durch**. Zuletzt grün waren
sie bei 0.6.0 (1.910 Prüfungen, 0 Fehler; Balance über 30 Wellen, neun
Kennzahlen grün).

`pruefe-artefakte.mjs` **fehlt ganz**. `artefakte.js` ist genau dafür gebaut:
Der Zufall ist austauschbar, mit gesetztem Startwert ergibt derselbe Wurf
dasselbe Artefakt. Zu prüfen wären Verteilung der Seltenheiten, Güteskalierung
über die Fundwelle, Bossgarantie ≥ Selten, Affixe je Stufe, das Ableiten der
Tags, Regalsumme gegen Einzelaffixe.

### 5.2 Balance vermessen

Zwei konkrete Verdachtsfälle:

- **Scharfe Klauen ×1,35 gegen Leben ×1,05.** Stufe 40 kostet 660 k, die
  Recken wachsen weiter. Gewollte Härte oder eine Wand? Sagt erst der Rechner.
- **Truppgröße ohne Deckel.** `1 + ⌊w/5⌋` wächst endlos, die Spitzenlast am
  Tor mit. Ab welcher Welle ist Kapazität nicht mehr kaufbar schnell genug?

Dazu noch unvermessen: ob 0,05 % plus Bossgarantie sich richtig anfühlt.

Zum Vergleich der Befund aus 0.5.0 über 60 Wellen, der zum ganzen 0.7.0-Umbau
geführt hat — ab Welle 20 sank die Dauer, die Käufe versiegten, Gold häufte
sich ungenutzt an. Ob das jetzt behoben ist, ist **nicht** nachgemessen.

### 5.3 Ton

Es gibt keinen. Noch nie angefasst, kein Konzept, keine Dateien.

---

## 6. Arbeitsweise, die sich eingespielt hat

- **Deutsch, durchgehend.** Auch Dateinamen, Funktionsnamen, Konstanten,
  Commit-Texte, Changelog. Keine englischen Bezeichner.
- **Der Changelog ist ausführlich** und erklärt Entscheidungen mit Begründung,
  nicht nur Änderungen. Jeder Eintrag hat „Geprüft" und „Offen".
- **Geprüft heißt gemessen.** Nicht „sollte gehen", sondern eine Zahl:
  Bildpunkte ausgelesen, Prüfungen gezählt, Wellen durchgespielt, Durchsatz
  gegen die Rechnung gestellt. Beim Aufteilen wurde die Szene in 240 Felder
  zerlegt und zeichenweise verglichen.
- **Reine Rechnung getrennt.** `wirtschaft.mjs` kennt weder Browser noch
  Zufall, damit sie in Node prüfbar bleibt. Neue Regeln gehören dorthin, nicht
  in die Anzeige.
- **Eine Stelle je Sache.** `verbuchen()` ist die einzige Stelle, die bei jedem
  Tod genau einmal läuft — Drop, Blutzoll und Gutschrift hängen dort.
- Bei jedem Umbau wurden **echte Fehler gefunden**, weil gemessen wurde
  (Beute kam nie an; Brücke deckelte den Zulauf; doppelte Bildschleife;
  Hintergrund lief mit 24 % Geschwindigkeit). Das lohnt sich weiter.
- Kein Deckel, wo keiner sein muss; Deckel dort, wo die Anzeige sonst bricht.

---

## 7. Erster Satz für den neuen Chat

> Slay'Em All! steht auf 0.8.0, `docs/ENTWURF.md` ist vollständig umgesetzt.
> Nächster Schritt: die drei Prüfskripte in `werkzeuge/` gegen die heutige
> `wirtschaft.mjs` nachziehen und `pruefe-artefakte.mjs` neu schreiben, danach
> die Kurve aus Scharfe Klauen ×1,35 gegen Leben ×1,05 vermessen.
> Lies `docs/UEBERGABE.md` und `CHANGELOG.md` (Einträge 0.7.0 und 0.8.0).
