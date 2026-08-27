# Änderungsprotokoll

## 0.6.0 — 27.08.2026

**Der Klick wird eine Waffe, die Burg bekommt eine Warteschlange.** Sieben
Wünsche von Jannik in einer Fassung:

### Der eigene Angriff

Bei Malvina kaufbar (15 Blut): **Berührung des Bösen** — ein Klick auf einen
Recken verwundet ihn. Startschaden 1, Abklingzeit 2 s, 5 % kritische Treffer
(doppelter Schaden), mit Treffer-Blitz und Blutspritzern. Drei Ausbauachsen:
Schaden +1, Abklingzeit −12 %, Krit +4 %.

Dazu drei kaufbare Spielarten, jederzeit umschaltbar:

- **Midas-Berührung** (350): Stirbt das Ziel am Klick, erstarrt es zur
  **Goldstatue** — anklicken bringt das Zweieinhalbfache des üblichen Golds.
  Nach 25 Sekunden zahlt sie sich selbst aus.
- **Infernale Berührung** (500): Das Ziel brennt (1 Schaden je Sekunde,
  4 Sekunden). Stirbt es brennend, **explodiert** es und zündet Nachbarn an —
  Kettenreaktionen sind möglich und beabsichtigt.
- **Faust des Titanen** (900): Flächenschlag, achtfacher Klickschaden plus
  Sockel, 36 px Wirkbereich, 30 s Abklingzeit.

Beim Klicken gilt eine feste Rangfolge: scharfer Blitz vor Statue vor Münze
vor Angriff — Aufsammeln wirft nie versehentlich die Abklingzeit an.

### Die Fressschlange

Recken in der Burg werden nicht mehr alle gleichzeitig verdaut, sondern
**einer nach dem anderen**. Über dem Gefressenen läuft ein Balken ab.
**Zweiter Schlund** bei Grommsch (max 4) lässt mehrere zugleich fressen.
Kapazität ist jetzt der Puffer, der Schlund der Durchsatz — zwei getrennte
Käufe, zwei Nöte. Die Lage-Zeile zeigt beides („Burg 2/3 · frisst 1/2").

### Rund um die Werte

- **Schwebende Schadenszahlen** über Getroffenen; kritische in Gold und größer.
- **Tooltip an der Aktionsleiste**: farbig, mit Zeichen je Wert, Basiswert und
  Bonus getrennt („⚔ 10 **+15**", „⏱ 22 s **−5,0 s**").
- **Zielwasser** bei Grommsch (max 5): +6 % kritische Pfeile je Stufe.
- **Drachenpranke** startet träger: 22 s statt 14 s Abklingzeit.
- **Sammel-Drachling** jetzt bis Stufe 10; je Stufe +1 % Chance, dass er eine
  Münze **doppelt** wertet (mit „×2!"-Anzeige).
- **Währungszeichen** (Tropfen, Münze, Zahnrad) in allen Ladenknöpfen.

### Die Nacht kündigt an, was kommt

Die nächste Welle wird **vorab ausgelost** und im Nachtlager als Chips
angezeigt („Gleich kommen: 7× Bauer · 6× Söldner …"). Gespawnt wird genau
diese Liste. Lockrufe und Köder losen neu aus; die Ankündigung überlebt das
Neuladen, weil sie im Spielstand liegt.

### Geprüft

- `pruefe-wirtschaft.mjs` — jetzt **1.910 Prüfungen**, 0 Fehler (Klickwerte,
  Deckel, Preise, neue Waren).
- `balance.mjs` über 30 Wellen mit klickendem Bot: **alle neun Kennzahlen
  grün**, 0 Niederlagen trotz Fressschlange.
- Im Browser mit echten Klicks: Kauf, Angriff, Abklingzeit, Midas-Statue
  samt Aufsammeln, Inferno mit Brand-Ticks und Kettenexplosion (ein
  zufälliger Krit im Test hat die Kette gleich mitbelegt), Titan gegen vier
  Ritter, Fressschlange (nur der Vorderste verliert Lebenspunkte, mit
  zweitem Schlund zwei), Tooltip auf und zu, Vorschau nach Sieg, Speichern
  und Laden aller neuen Felder.

### Technisch

Klick-Zustand und Ankündigung liegen im Spielstand (`slayemall.wellen.v1`,
Felder werden beim Laden defensiv aufgefüllt — alte Stände laufen weiter).
Eine gewählte, aber nicht gekaufte Spielart wird beim Laden auf `normal`
zurückgestellt.


## 0.5.0 — 27.08.2026

**Die Wellen-Fassung ersetzt das Idle-Spiel.** Jannik hat in der
Claude-Design-Werkbank eine deutlich weiter entwickelte Fassung gebaut und
übergeben. Sie ist kein Nachfolger des hier liegenden Stands, sondern ein
eigener Zweig aus derselben Wurzel — belegt am Speicherschlüssel
(`burgtor.scene.v1` → `waves.v2` → `v5`) und daran, dass Grutz, Schatzkammer
und Knochen-Neuanfang darin **nirgends** vorkommen.

**Entscheidung Jannik, 27.08.2026:** Das Repository wird die Quelle. Die
Werkbank wird für dieses Spiel nicht mehr benutzt, weil ihr Export bei jedem
Mal die Aufteilung überschreiben würde. Die alte Idle-Fassung bleibt
vollständig erhalten unter dem Etikett **`v0.4.1-idle`**.

### Was das Spiel jetzt ist

Kein reines Zusehen mehr, sondern Wellen mit Gegenwehr:

- **Tag ist Angriffswelle, Nacht ist Lager.** Die Welle startet man selbst;
  mit dem gekauften *Morgenritual* nach 22 Sekunden von allein.
- **Verlieren ist möglich.** Nicht durch Schaden, sondern durch Stau: Passen
  mehr Recken gleichzeitig ins Tor, als die Burg fasst, geht es **fünf Wellen
  zurück**. Die Beute bleibt.
- **Drei Händler** mit bewegten Pixelporträts — Grommsch (Schrott), Pips
  (Gold), Malvina (Blut).
- **Vier aktive Fähigkeiten** auf den Tasten 1 bis 4, jede mit drei
  Ausbauachsen: Schaden, Abklingzeit, Wirkbereich.
- **Gold muss aufgesammelt werden.** Es fällt als Münze auf die Brücke; wer
  nicht klickt, kauft nichts. Der *Sammel-Drachling* nimmt einem das nachts ab.
- **Zwei Wischseiten** auf schmalen Bildschirmen.

### Aufteilung: aus einer Datei wurden 24

Die Übergabe war wieder ein Ausgabepaket der Werkbank — 533 KB in einer
`index.html`, mit React 18, sieben Schriftschnitten und 1.912 Zeilen fremder
Laufzeit. Das eigentliche Spiel darin: 1.602 Zeilen Logik und 210 Zeilen
Schablone.

Jetzt: **24 Dateien, 4.150 Zeilen, kein React, keine fremde Laufzeit.** Die
drei Porträts (je 28 × 32 Punkte) wurden maschinell übertragen statt
abgetippt — alle drei mit 32 Zeilen zu 28 Zeichen nachgeprüft.

| Bereich | Dateien |
| --- | --- |
| Regeln und Preise | `werkzeuge/wirtschaft.mjs` — ohne Browser, ohne Zufall |
| Zustand | `spiel/welt.js`, `spiel/speicher.js` |
| Ablauf | `spiel/simulation.js`, `spiel/wellen.js`, `spiel/kampf.js`, `spiel/zauber.js`, `spiel/handel.js` |
| Bild | `spiel/szene.js`, `spiel/figuren.js`, `spiel/effekte.js`, `spiel/portraets.js` |
| Bedienung | `spiel/anzeige.js`, `spiel/eingabe.js`, `spiel/marktschreier.js` |
| Daten | `spiel/daten/*.js` |

### Zwei Fehler beim Umbau gefunden und behoben

1. **Die Beute kam nie an.** Die Gutschrift lag in der Uhr statt in der
   Simulation. Gemessen: eine ganze Welle durchgespielt, 5 Recken tot,
   28 Blutlachen — und **Blut, Gold und Schrott blieben auf null**. Jeder
   andere Antrieb als die Bildschleife ging leer aus. Gutgeschrieben wird
   jetzt sofort; nur das Schreiben ins Dokument bleibt gedrosselt.
2. **Der Söldner ist schneller als der Bauer** (24 gegen 20). Das war in der
   Übergabe schon so und ist offenbar Absicht — die Prüfung wurde an die
   Daten angepasst, nicht die Daten an die Prüfung.

### Bewusst anders als die Übergabe

- **Fester Zeitschritt von 1/60 Sekunde** mit Nachholen statt der
  schwankenden Bildrate. Sonst fliegen Trümmer auf einem 144-Hz-Bildschirm
  anders als auf einem 60-Hz-Bildschirm.
- **Pause im Hintergrund.** Läuft die Seite unsichtbar weiter, kann man eine
  Welle nur verlieren — man sieht sie ja nicht. Beim Zurückkommen geht es
  dort weiter, wo man war.
- **Neuer Speicherschlüssel** `slayemall.wellen.v1`; die fünf alten
  `burgtor.*` werden beim Start entfernt.

### Geprüft

- `node werkzeuge/pruefe-wirtschaft.mjs` — **1.592 Prüfungen, 0 Fehler**
- `node werkzeuge/balance.mjs 60` — 60 Wellen ohne Browser durchgespielt,
  **neun Kennzahlen grün**
- Im Browser mit echten Klicks: Kaufen bei allen drei Händlern, Zauber lernen
  und verbessern, Münze aufsammeln (7 Gold; mit *Sammlerstolz* 10 statt 8),
  Donnerschlag scharf machen und einschlagen lassen, Niederlage erzwungen
  (Welle 20 → 15, alle vier fliehen, danach Nacht).
- Bildpunkte der Leinwand ausgelesen: **7.688 verschiedene Farben**,
  Himmelverlauf, Torglut, Abgrund und Mauer an den erwarteten Stellen.
- `node --check` über alle 24 Dateien.

### Offen: Ab Welle 20 wird es leichter statt schwerer

Gemessen über 60 Wellen. Die Wellengröße stößt bei **80 Recken** an ihren
Deckel, der Spieler wächst aber weiter:

| Welle | Recken | Dauer | Käufe je Welle | Gold am Ende |
| --- | --- | --- | --- | --- |
| 15 | 46 | 91 s | 7 | 963 |
| 20 | 80 | 129 s | 11 | 8,5 k |
| 30 | 80 | 82 s | 2 | 13,9 k |
| 60 | 80 | 75 s | 0 | 137 k |

Ab Welle 20 sinkt die Dauer, die Käufe versiegen, und Gold häuft sich
ungenutzt an — es gibt nichts mehr dafür. Niederlagen kommen nicht mehr vor.
Das ist der Punkt, an dem das Spiel aufhört, Fragen zu stellen. Eine
Entscheidung dazu steht noch aus.

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
