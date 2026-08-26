# Änderungsprotokoll

## 0.4.1 — 26.08.2026

**Öffentlich und spielbar** (Entscheidung Jannik): <https://kimpaliz.github.io/slay-em-all/>

Vor dem Umschalten geprüft, weil mit einem öffentlichen Repository auch die
ganze Versionsgeschichte sichtbar wird:

- Alle 30 Dateien, die je im Repository lagen, auf Zugangsdaten, Schlüssel,
  Tokens, E-Mail-Adressen und persönliche Pfade durchsucht — **keine Treffer**,
  auch nicht in älteren Fassungen.
- Sichtbar wird die Absenderadresse in den Commits. Das ist bei
  `Kimpaliz/age-of-beast` bereits so und damit nichts Neues.

**Nachgetragen:** Die mitgelieferte Schrift **Inter** steht unter der SIL Open
Font License 1.1. Deren Text muss bei jeder Weitergabe dabeibleiben — beim
Schritt in ein öffentliches Repository wird das relevant. Liegt jetzt in
`schriften/LIESMICH.md`, samt Begründung, warum nur der lateinische Teil
mitgeliefert wird.

**Live nachgeprüft:** Alle Teile werden mit korrektem Typ ausgeliefert (auch
die `.mjs` als `text/javascript` — die einzige offene Frage bei GitHub Pages).
Auf der echten Adresse: Spiel startet, beide Ansichten da, Inter geladen,
**null fremde Skripte**, keine Konsolenmeldung. Ein voller Tag-Nacht-Zyklus
durchgespielt: 46 Recken gefallen, 294 Liter Blut, nächtliche Ernte brachte
40 Knochen und 2 Schrott.


## 0.4.0 — 26.08.2026

**Die Schatzkammer.** Das Spiel hat jetzt zwei Ansichten, zwischen denen man
wischt (oder klickt, oder die Pfeiltasten benutzt).

- **Das Tor** — die Szene, der Tageslauf, das Bestiarium und alles, was mit
  **Blut** bezahlt wird: Lockrufe und breiteres Tor.
- **Die Schatzkammer** — **Grutz**, der Kobold, und alles, was mit **Schrott**
  bezahlt wird: Klingen, Presse, Kobold-Diener. Dazu der Schädelhandel und
  der Knopf zum Abtragen des Haufens.

Die Trennung folgt der Fiktion: Blut ist die Sache des Hausherrn, Eisen und
Knochen sind Grutz’ Geschäft. Er kommentiert die Lage — ob Schrott da ist,
ob Schädel im Keller liegen, ob der Haufen an der Mauer hoch wird — und
handelt wie das Haus nur bei Dunkelheit.

### Grutz

Ein Brustbild in einem Steinbogen, 120 × 150 Bildpunkte, im Geist der
Gesprächsporträts von *Das Schwarze Auge — Die Schicksalsklinge* (1992):
wenige Farben, harte Kanten, warmes Licht von unten links aus dem Gold,
kalter Rand von rechts. Er blinzelt alle paar Sekunden.

**Von Hand gesetzt, es gibt keine Bilddatei** — dieselbe Technik wie bei der
Torszene. Das ist eine gezeichnete Annäherung, kein gemaltes Porträt; wer
etwas anderes will, sagt es und es wird geändert.

### Neu: ein Renderer ohne Browser

`werkzeuge/bild-erzeugen.mjs` malt das Porträt in Node und schreibt es als
PNG nach `vorschau/`. Dafür stecken darin ein sehr kleiner Nachbau des
Zeichenstifts (nur das, was die Zeichenfunktionen benutzen: Rechtecke,
Deckkraft, zwei Verlaufsarten) und ein PNG-Schreiber auf Basis von Nodes
eingebautem zlib. Keine Abhängigkeiten.

Damit lässt sich am Aussehen arbeiten, ohne jedes Mal die Seite zu öffnen:

```bash
node werkzeuge/bild-erzeugen.mjs grutz 3
```

### Geprüft

- 101 Wirtschaftsprüfungen, sechs grüne Balance-Kennzahlen — unverändert.
- Im Browser mit echten Knopfdrücken über **beide** Ansichten durchgespielt:
  149 Käufe über zehn Tage, Ansichtswechsel in beide Richtungen, Neuanfang
  bereit.
- Porträt gerendert: 18.000 Bildpunkte, 211 Farben, Stichproben an Rahmen,
  Haut, Auge, Kapuze und Fell stimmen.
- Keine Konsolenmeldung, keine fremden Skripte.


## 0.3.0 — 26.08.2026

**Aus der Szene wird ein Spiel.** Vorher liefen drei Zähler hoch und das
Haus baute sich gratis selbst aus. Jetzt gibt es eine Schleife.

### Der Tag-und-Nacht-Takt

Ein Tag dauert 100 Sekunden, die Nacht 50.

- **Tagsüber** kommen die Recken in **Wellen** statt als gleichmäßiger
  Strom — drei bis sechs Glockenkurven mit Ruhe dazwischen, mehr Wellen mit
  steigender Tageszahl. Blut fließt sofort. Knochen und Schrott bleiben als
  **Beutehaufen** an der Mauer liegen.
- **Nachts** kommt niemand. Die Kobolde tragen den Haufen ab — daraus
  entstehen Knochen und Schrott. **Nur nachts wird eingekauft.**
- Ist der Haufen voll, fällt neue Beute in die Schlucht. Genau das macht
  Kobolde interessant: Sie ernten schneller *und* stapeln höher.
- Der Himmel zieht mit: Sonne und Mond wandern, Sterne verblassen im
  Morgengrauen, der Fackelschein tritt bei Tag zurück. Bewusst kein blauer
  Sommerhimmel, sondern ein trüber kalter Tag — sonst erschlägt das
  Tageslicht die Torglut, von der die Szene lebt.

Die Wellenkurve ist auf den Mittelwert 1 normiert. Ohne das würde jede
Änderung an der Wellenform still die gesamte Balance verschieben.

### Blut wird in Litern gerechnet

Ein Bauer trägt fünf davon. Unter der Zahl steht, was das bedeutet:
*etwa 1,8 Schwimmbecken*, *etwa 3 Bodenseen*. Die Leiter reicht vom Eimer
über Badewanne, Tankwagen, Schwimmbecken, Öltanker und Bodensee bis zu den
Weltmeeren — echte, gerundete Größen.

Das löst nebenbei das Zahlenproblem der letzten Fassung eleganter als
Zehnerpotenzen: Niemand kann sich 4·10¹³ Liter vorstellen, einen Bodensee
schon.

### Die Schleife

- **Blut** (Liter) kauft Zulauf und Torplätze — fließt schnell, geht schnell.
- **Schrott** kauft Maschinen: Klingen, Presse, Kobolde.
- **Knochen** werden **nie ausgegeben**. Sie sind der Fortschrittsbalken zum
  Neuanfang.
- **Neuanfang:** Die Burg trägt den Haufen ab. Blut, Schrott und alle
  Ausbauten gehen zurück auf null; dafür gibt es **Schädel**
  (Wurzel der Knochenzahl, damit ewiges Ausdehnen einer Runde sich nicht
  lohnt). Schädel kaufen Dauerhaftes: Blutzoll, Ruf im Tal, Erbe des Hauses
  — und den **Verwalter**, der wieder von selbst einkauft. Damit ist
  „Zusehen genügt" kein Anfangszustand mehr, sondern etwas, das man sich
  verdient.

Harte Regel für alle Preise: `preiswachstum > wirkung`. Sonst bringt jede
Stufe mehr ein, als die nächste kostet, und das Spiel ist nach zwanzig
Minuten vorbei. Wird geprüft.

### Behoben

- **Die sichtbare Brücke deckelte das ganze Spiel.** Auf die Planken passen
  18 Figuren, und dieser Grafikwert begrenzte den echten Zulauf. Gemessen:
  bei rechnerisch 6.148 fälligen Recken fielen **87**. Ab etwa drei Recken
  je Sekunde war damit jeder weitere Ausbau wirkungslos. Anzeige und
  Rechnung sind jetzt getrennt: Das Bild zeigt eine Auswahl, die Schlange
  im Dunkeln läuft weiter. Nachgemessen 92–100 % statt 1,4 %.
- Die Schlange im Dunkeln wächst nicht mehr unbegrenzt (vorher 15.337
  Einträge und 781 ms Rechenzeit für 30 Spielsekunden, jetzt 312 und 119 ms).
- Bewertungsfunktion des Verwalters maß nur Blut. Kobolde bringen kein Blut,
  sondern retten Knochen und Schrott — sie wurden deshalb **nie** gekauft,
  und im Rechendurchlauf gingen an Tag 20 46.359 von 46.429 Recken verloren.
  Jetzt zählen alle drei Währungen, und zwar relativ.
- Anzeige: „1,5 Badewanne" → „1,5 Badewannen".

### Geprüft

- `werkzeuge/pruefe-wirtschaft.mjs`: **101 Prüfungen**, alle bestanden.
- Neu `werkzeuge/balance.mjs`: spielt 25 Tage durch und bewertet sechs
  Kennzahlen — Käufe je Nacht 15,1; erster Schädel Tag 3; letzte
  Reckenklasse nach 27 Min; 13 von 25 Tagen mit Haufendruck; alle grün.
- Im Browser mit echten Knopfdrücken durchgespielt: 204 Käufe über zwölf
  Tage, Neuanfang mit 7 Schädeln, dauerhafter Kauf zieht korrekt ab.
- Durchsatz gegen die Rechnung gemessen (vier Ausbaustände): 92–100 %.
- Tageslauf im Bild nachgemessen: Mitternacht 42,41,68 gegen Mittag
  105,110,122.

## 0.2.0 — 26.08.2026

**Aus einer 481-KB-Datei wurden 18 lesbare Dateien.** Am Aussehen und am
Ablauf hat sich nichts geändert; nachgewiesen durch einen Bildpunktvergleich
gegen die alte Fassung.

### Was vorher drin war

Die alte `index.html` war kein handgeschriebenes Spiel, sondern ein
Ausgabepaket der Claude-Design-Werkbank: eine Schablone mit `{{ }}`-Platzhaltern,
React 18, sieben Schriftschnitte und eine 1.912 Zeilen lange fremde Laufzeit
(`dc-runtime`, im Kopf ausdrücklich mit „do not edit" versehen). Das eigentliche
Spiel waren 848 Zeilen in einem einzigen `<script>`-Block.

Solange dieses Format bestand, ließ sich die Datei nicht aufteilen — es ist
per Bauart eine Datei.

### Was jetzt drin ist

- **React und die fremde Laufzeit sind weg.** Die Anzeige schreibt ihre Werte
  direkt in die Seite (`spiel/anzeige.js`, 120 Zeilen statt 142 KB Bibliothek).
- **Reine Rechnung getrennt von allem anderen.** `werkzeuge/wirtschaft.mjs`
  kennt weder Browser noch Bildschirm und lässt sich deshalb in Node prüfen.
- **Daten getrennt vom Ablauf.** Reckenklassen, Ausbauten, Reime und Farbwelten
  liegen je in einer eigenen Datei unter `spiel/daten/`.
- **Zeichnen getrennt von Simulation.** `simulation.js` bewegt die Welt,
  `szene.js` und `figuren.js` malen sie. Keine Funktion tut beides.
- **Neu: `werkzeuge/pruefe-wirtschaft.mjs`** — 25 Prüfungen plus eine
  Verlaufsrechnung über eine Stunde Spielzeit.
- **Neu: `Vorschau-starten.cmd`** und ein lokaler Nur-Lese-Server.
- Schriften von sieben Schnitten (217 KB) auf einen (48 KB) reduziert.
  Nachgemessen: Alle im Spiel vorkommenden Sonderzeichen — `—`, `’`, `„` und
  sämtliche Umlaute — liegen im lateinischen Bereich.

### Behoben

- **Das Spiel lief im Hintergrund nur mit einem Viertel Geschwindigkeit.**
  Gemessen: In 10,35 echten Sekunden vergingen 2,5 Spielsekunden (24 %).
  Ursache war ein doppelter Zeitgeber, dessen Zeitschritt auf 0,25 s gedeckelt
  war, während der Browser den Ersatztakt im Hintergrund auf etwa 1 Hz drosselt.
  Der Taktgeber arbeitet jetzt mit festen Schritten von 1/60 s und holt
  angesammelte Zeit nach. Nachgemessen: **100 %** statt 24 %.
- `componentDidMount` startete eine **zweite** Bildschleife zusätzlich zu der,
  die `boot()` bereits angelegt hatte, und las den Spielstand ein zweites Mal
  ein. Beides entfällt.
- Im Hintergrund wird nicht mehr gezeichnet — nur noch gerechnet.

### Nachgeprüft

Alte und neue Fassung nebeneinander im Browser, gleicher eingefrorener Zustand:

- Szene in 240 Felder zerlegt: **239 zeichengleich**. Das eine abweichende Feld
  enthält die dritte Fackel, deren Funken schon im Original zufällig gesetzt
  wird — nachgewiesen, indem dasselbe Feld auch zwischen zwei Zeichnungen
  derselben Fassung schwankt, während die Planken über acht Zeichnungen stabil
  bleiben.
- Alle fünf Reckenklassen, dazu Denkblase, halbe Sichtbarkeit, Schrittstellung
  sowie sitzender und fliegender Rabe: **punktgenau gleich** (10 Fälle).
- Alle sieben Trümmerarten (Arm, Bein, Rumpf, Kopf, Helm, Schild, Schädel):
  **punktgenau gleich**.
- Seite lädt **null** fremde Skripte, keine Konsolenmeldung.

### Bekannt und offen

Die Verlaufsrechnung hat drei Dinge zutage gefördert, die noch niemand
entschieden hat:

1. **Blut, Knochen und Schrott werden nirgends ausgegeben.** Der Selbstkauf
   des Hauses prüft keinen Preis und zieht nichts ab. Die drei Zahlen sind
   reine Zähler.
2. **Nach rund 7 Minuten ist alles freigeschaltet.** Danach kommt nichts Neues.
3. **Nach rund 28 Minuten wird die Zahlanzeige unlesbar.** Die größte bekannte
   Einheit ist „Bio" (10¹²); darüber wächst nur noch eine Ziffernkette.

## 0.1.0 — 26.08.2026

Erster Stand, übernommen aus `Heldenschlacht Burg-Idle.zip`.
