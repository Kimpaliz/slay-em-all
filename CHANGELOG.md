# Änderungsprotokoll

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
