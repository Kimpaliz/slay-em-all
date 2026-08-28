# Entwurf: Gold, Artefakte, Bosse — der große Umbau

**Stand: 27.08.2026 · Grundlage: Fassung 0.6.0 · Beschlossen von Jannik, ausgearbeitet zur Weiterarbeit im Design.**

Dieses Dokument hält fest, wohin das Spiel als Nächstes geht. Es trennt
sauber zwischen **[BESCHLOSSEN]** (Janniks Ansagen, verbindlich) und
**[VORSCHLAG]** (konkrete Zahlen und Ausgestaltung von Claude — zum
Draufrumdenken, Ändern erwünscht). Am Ende stehen die offenen Designfragen.

Die Leitidee in einem Satz: **Vereinfachen, wo es kompliziert war
(Währungen, Klick-Spielarten), und vertiefen, wo das Spiel langfristig
Fragen stellen soll (Skalierung, Bosse, Artefakte).**

---

## 1. Der Klick wird wieder einfach **[BESCHLOSSEN]**

Die drei Spielarten **Midas-Berührung, Infernale Berührung und Faust des
Titanen fliegen raus**. Es bleibt genau eine Standard-Version des
Mausklick-Angriffs: kaufbar, Abklingzeit, Schaden, kritische Treffer,
Blutspritzer. Die drei Ausbauachsen (Schaden / Abklingzeit / Krit) bleiben.

**Neue Klick-Rangfolge:** Der Angriff geht **vor** dem Goldsammeln.

> Bisher: Blitz → Statue → Münze → Angriff.
> Neu: Blitz → **Gegner** → Münze. (Statuen entfallen mit Midas.)

**[VORSCHLAG]** Damit Gold nicht unerreichbar wird, wenn Gegner davorstehen:
Läuft die Klick-Abklingzeit gerade (Angriff nicht möglich), fällt der Klick
auf die Münze durch. Wer schnell klickt, greift an; wer nach dem Schlag
klickt, sammelt. Das fühlt sich natürlich an und braucht keinen Modus-Knopf.

**[VORSCHLAG]** Randnotiz für später: Die gestrichenen Spielarten müssen
nicht für immer tot sein — Midas („Klick-Tote werden zu Goldstatuen") und
Titan („Flächenschlag") wären hervorragende **legendäre Artefakt-Affixe**
(siehe Abschnitt 6). Dann sind sie seltene Funde statt Pflichtkäufe. Nur
eine Idee, kein Muss.

---

## 2. Drei Waren fliegen raus **[BESCHLOSSEN]**

Bei Pips entfallen ersatzlos:

| Ware | bisheriger Zweck | wird ersetzt durch |
| --- | --- | --- |
| **Lockrufe im Tal** | +8 % Wellengröße je Stufe | passive Skalierung (Abschnitt 4) |
| **Marschmusik** | Gegner +13 % Tempo je Stufe | passive Skalierung (Abschnitt 4) |
| **Edler Köder** | hohe Ränge früher | Ränge kommen fest ab Welle 1/3/7/12/18 |

Das ist folgerichtig: Wellengröße und Gegnertempo werden künftig vom Spiel
selbst gesteigert (Abschnitt 4) — ein Kauf, der dasselbe tut, wäre doppelt.

Pips behält: **Sammel-Drachling** (mit Doppelgold-Chance), **Sammlerstolz**,
**Makabre Ernte** — und bekommt neu den **Schatzjäger** (Abschnitt 6).

---

## 3. Eine Währung: Gold **[BESCHLOSSEN]**

**Blut und Schrott entfallen als Währungen.** Alle Preise werden in Gold
ausgezeichnet. Gold bleibt, wie es ist: Es fällt als Münze auf die Brücke
und muss aufgesammelt werden (selbst, per Drachling, oder es verfällt).

Folgen:

- Kopfzeile zeigt nur noch **Gold** (und die Welle).
- Malvina (Zauber + Klick) und Grommsch (Burgausbau) kassieren Gold.
- Die Regel „besondere Tode (Pfeil, Blitz, Pranke, Feuer) werfen mehr Gold
  ab" wird **wichtiger denn je** — sie ist jetzt der einzige Grund,
  überhaupt einzugreifen. Bleibt unverändert bestehen.
- Der Schrott-Bruchteilszähler und das Blut-Konto verschwinden aus dem
  Spielstand.

**[VORSCHLAG] Neue Preisliste** (kalibriert am Goldeinkommen: Bauer 1,
Söldner 2, Ritter 5, Paladin 9, Großmeister 16 Gold je Kill, besondere
Tode ×1,5):

| Kauf | Preis | Steigerung | Deckel |
| --- | --- | --- | --- |
| Berührung des Bösen (Klick) | 10 | — | einmalig |
| Klick-Achse (Schaden/Abkling/Krit) | 4 | ×1,6 je Stufe | — |
| Drachenpranke | 40 | — | einmalig |
| Donnerschlag | 90 | — | einmalig |
| Flammenstoß | 250 | — | einmalig |
| Meteoritenschauer | 600 | — | einmalig |
| Zauber-Achse | 40 % des Zauberpreises | ×1,6 je Stufe | — |
| Morgenritual | 400 | — | einmalig |
| Scharfe Klauen | 6 | ×1,35 je Stufe | **kein Deckel** (Idle-Senke!) |
| Zweiter Schlund | 25 | ×2,3 je Stufe | 4 |
| Tiefere Hallen | **400** | ×2,5 je Stufe | — (siehe Abschnitt 8) |
| Goblin-Bogenschütze | 15 | ×2,1 je Stufe | 4 |
| Widerhaken-Pfeile | 30 | ×2,2 je Stufe | — |
| Zielwasser | 20 | ×1,9 je Stufe | 5 |
| Sammel-Drachling | 40 | ×2,3 je Stufe | 10 |
| Sammlerstolz | 25 | ×1,8 je Stufe | — |
| Makabre Ernte | 35 | ×1,9 je Stufe | — |
| **Schatzjäger** (neu) | 50 | ×2,0 je Stufe | 10 |

Alle Zahlen sind Startwerte für den Balance-Rechner, nicht heilig.

---

## 4. Die Wellen skalieren von selbst **[BESCHLOSSEN]**

Pro Welle steigen **passiv**, ohne dass der Spieler etwas kauft:

1. die **Menge** der Gegner,
2. ihre **Lebenspunkte**,
3. ihre **Laufgeschwindigkeit**,
4. und alle paar Wellen die **gleichzeitig erscheinende Menge** (Trupps
   statt Einzelgänger).

**[VORSCHLAG] Konkrete Formeln** (Welle w, ab 1):

| Größe | Formel | Beispiel W1 → W10 → W25 |
| --- | --- | --- |
| Menge | `5 × 1,16^(w−1)`, Deckel 80 (wie bisher) | 5 → 19 → 80 |
| Lebenspunkte | Klassen-LP × `1,05^(w−1)` | Bauer 20 → 31 → 64 |
| Tempo | Klassen-Tempo × `(1 + 0,01·(w−1))`, Deckel +50 % | +0 % → +9 % → +24 % |
| Truppgröße | `1 + ⌊w/5⌋`, Deckel 4 | 1 → 3 → 4 zugleich |

Zur Truppgröße: Statt einzeln erscheint dann ein ganzer Stoßtrupp auf
einmal (gemeinsamer Spawn-Zeitpunkt, leicht versetzte Positionen). Der
Spawn-Abstand zwischen Trupps wächst entsprechend mit, damit die
Gesamtmenge stimmt — aber die **Spitzenlast** am Tor steigt. Genau das
macht Schlund und Kapazität wertvoll.

Die Nachtvorschau („Gleich kommen: …") bleibt und zeigt weiterhin die
ausgeloste Aufstellung.

---

## 5. Zahlen mal zehn und Schadensarten **[BESCHLOSSEN]**

### Die Rebasierung ×10

Alle Lebenspunkte und alle Schadenswerte werden verzehnfacht. **Die Zeiten
bleiben gleich**: Das Monster frisst künftig 10 LP je Sekunde (statt 1) —
ein Bauer braucht also weiterhin 2 Sekunden.

| Wert | alt | **neu** |
| --- | --- | --- |
| Bauer / Söldner / Ritter / Paladin / Großmeister LP | 2 / 4 / 7 / 11 / 16 | **20 / 40 / 70 / 110 / 160** |
| Goblin-Pfeil | 1 | **10** |
| Klick-Grundschaden | 1 | **10** |
| Fressgeschwindigkeit (Basis) | 1 LP/s | **10 LP/s** |
| Drachenpranke | 10 | **100** |
| Donnerschlag | 6 | **60** |
| Flammenstoß | 9 | **90** |
| Meteoritenschauer (je Stein) | 5 | **50** |
| Schadensschritte der Achsen | +5/+3/+4/+3, Klick +1 | **+50/+30/+40/+30, Klick +10** |

Warum das gut ist: Große Zahlen geben Raum für feine Modifikatoren —
+1,5 % Klauen, +7 % von einem Artefakt, ein 13er-Gift-Tick. Mit 2-LP-Bauern
wäre all das unmöglich zu spüren.

### Fünf Schadensarten **[BESCHLOSSEN]**

Jeder Schaden hat ab jetzt eine Art. Alles ohne besondere Art ist
**Physisch**.

| Art | Farbe **[VORSCHLAG]** | Quellen heute | Wirkung **[VORSCHLAG]** |
| --- | --- | --- | --- |
| Physisch | `#e9e9ed` (weiß) | Klick, Pfeile, Pranke | direkter Schaden |
| Feuer | `#ff7a2a` | Flammenstoß, Meteor | Brand: Schaden über Zeit, Tote zerfallen zu Asche |
| Blitz | `#cfc8ff` | Donnerschlag | **[VORSCHLAG]** springt auf 1 Nachbarn (50 %) |
| Eis | `#9ecbff` | *nur über Artefakte* | **verlangsamt** — das Gegenmittel zur Tempo-Skalierung |
| Gift | `#7fd48a` | *nur über Artefakte* | Schaden je Sekunde, **stapelbar** |

Die schwebenden Schadenszahlen färben sich nach der Art (Krit bleibt
golden und größer). Eis und Gift existieren zunächst nur als
Artefakt-Wirkungen — sie geben dem Artefaktsystem sofort eine eigene
Identität, ohne dass neue Zauber gebaut werden müssen.

---

## 6. Artefakte — der dritte Reiter **[BESCHLOSSEN]**

### Was feststeht

- Neben „Schlachtfeld" und „Händler" kommt eine dritte Kategorie
  **„Artefakte"** (auf dem Handy die dritte Wischseite, dritter Knopf).
- Oben ein **Regalbrett mit 5 Plätzen** — was dort liegt, ist ausgerüstet
  und wirkt. Darunter ein **Inventar mit 20 Slots** — Lager, wirkt nicht.
- Gegner lassen Artefakte fallen: **Grundchance 0,1 %** je getötetem Gegner.
- Artefakte sind **zufällig erzeugte Modifikatoren** für Aspekte des Spiels.
- Mit höheren Wellen droppen sie mit **besseren Werten** und **mehreren
  Affixen zugleich**.
- Bei Pips neu kaufbar und aufwertbar: **Schatzjäger** — je Stufe
  **+0,1 %** Fundchance.
- Janniks zwei Beispiel-Affixe:
  - *Mausklick-Angriffe lassen Gegner 5 Sekunden brennen — Schaden je
    Sekunde für **jedes ausgerüstete Artefakt mit dem Tag „Feuer"**.*
  - *Goblins verschießen Giftpfeile, die beim Aufprall alle nahen Gegner
    vergiften: Schaden je Sekunde, **stapelbar**.*

Das erste Beispiel ist der Kern des Systems: **Affixe, die pro
ausgerüstetem Tag skalieren.** Daraus entstehen Builds — wer drei
Feuer-Artefakte trägt, macht aus jedem Klick einen Flammenwerfer.

### [VORSCHLAG] Die Bausteine eines Artefakts

```
Artefakt
├─ Name          erzeugt aus Teilen: „Aschering des Küchenmeisters"
├─ Seltenheit    bestimmt Affix-Anzahl und Rahmenfarbe
├─ Fundwelle     bestimmt die Güte der gewürfelten Werte
├─ Tags          ergeben sich aus den Affixen (Feuer, Gift, Eis, Blitz, Gold, Burg)
└─ Affixe        1 bis 4 Einträge aus dem Pool, jeder mit gewürfeltem Wert
```

**Seltenheiten:**

| Seltenheit | Farbe | Affixe | Anteil an Drops (früh → spät) |
| --- | --- | --- | --- |
| Gewöhnlich | grau | 1 | 70 % → 45 % |
| Selten | blau `#9ecbff` | 2 | 25 % → 35 % |
| Episch | violett `#9184d9` | 3 | 5 % → 17 % |
| Legendär | gold `#e0b64f` | 3 + 1 einzigartiges | 0 % (ab Welle 15) → 3 % |

**Güte:** Jedes Artefakt merkt sich seine Fundwelle. Die Wertspannen der
Affixe wachsen mit `⌊Fundwelle / 5⌋` — ein „+8 % Goldfund" von Welle 3
kann auf Welle 40 als „+31 % Goldfund" fallen. Alte Funde veralten also —
das hält die Drops interessant.

**[VORSCHLAG] Affix-Pool zum Start** (Werte = Spanne auf Wellenstufe 1):

| Affix | Tag | Wirkung |
| --- | --- | --- |
| Brennende Berührung | Feuer | Klick zündet an: 5 s Brand, **10 Schaden/s je ausgerüstetem Feuer-Tag** *(Janniks Beispiel, ×10-Maßstab)* |
| Glutpfeile | Feuer | Pfeiltreffer zünden mit 20 % Chance an |
| Giftpfeile | Gift | Goblin-Pfeile vergiften beim Aufprall alle Gegner im Umkreis von 12 px: 10 Schaden/s, 4 s, **stapelbar** *(Janniks Beispiel)* |
| Zähes Gift | Gift | Giftdauer +2 s |
| Frostgriff | Eis | Klick verlangsamt das Ziel um 25–40 % für 3 s |
| Raureif | Eis | Gegner auf den letzten 40 px vor dem Tor −10 % Tempo |
| Kettenblitz | Blitz | Klick springt auf 1–2 Nachbarn (50 % Schaden) |
| Geladene Klauen | Blitz | Donnerschlag +20–35 % Schaden |
| Gierschimmer | Gold | +5–12 % Münzwert |
| Spürnase | Gold | +0,05–0,15 % Artefakt-Fundchance |
| Magnetring | Gold | liegende Münzen kriechen langsam Richtung Tor |
| Eisenmagen | Burg | Fressen +4–9 % schneller |
| Weite Hallen | Burg | wie 1 zusätzlicher Kapazitätsplatz *(selten und höher)* |
| Kalte Präzision | Burg | Klick-Krit +3–7 % |
| Schnelle Hand | Burg | Klick-Abklingzeit −5–10 % |

**Einzigartige Legendär-Affixe [VORSCHLAG]:** „Hand des Midas" (Klick-Tote
werden zu Goldstatuen), „Faust des Titanen" (Klick wird alle 30 s zum
Flächenschlag) — die Rückkehr der gestrichenen Spielarten als seltene
Schätze. Nur wenn gewollt.

### [VORSCHLAG] Bedienung

- Regalbrett als Holzbord in Pixeloptik, 5 Fassungen; Inventar als
  4×5-Gitter darunter.
- **Antippen** eines Artefakts öffnet eine Detailkarte (Name, Seltenheit,
  Affixe mit Werten, Fundwelle) mit den Knöpfen **Anlegen / Ablegen /
  Verkaufen** — kein Drag-and-drop nötig, damit es am Handy genauso gut
  geht wie mit der Maus.
- Artefakt-Symbole: 16×16 generiert — Grundform nach dominantem Tag
  (Flamme, Tropfen, Kristall, Blitz, Münze, Turm), Rahmenfarbe nach
  Seltenheit.
- Drop in der Szene: fällt wie eine Münze, funkelt auffällig, wird
  angeklickt oder am Wellenende automatisch eingesammelt (ein Artefakt darf
  nie in den Abgrund rollen — zu bitter).
- **Inventar voll:** neue Drops zahlen sich automatisch als Gold aus
  (Verkaufswert). Verkaufspreise **[VORSCHLAG]**: 25 / 100 / 400 / 1.600
  nach Seltenheit.

### [VORSCHLAG] Technik

Die Generierung kommt in ein eigenes Modul `spiel/artefakte.js` als
**reine Logik mit eigenem, seedbarem Zufall** — nur so lässt sie sich mit
einem Prüfskript (`pruefe-artefakte.mjs`) deterministisch testen:
gleicher Seed, gleiches Artefakt. Gespeichert werden Artefakte als
schlichte Objekte im Spielstand (`{ name, seltenheit, fundwelle, affixe:
[{k, wert}] }`); Tags werden beim Laden aus den Affixen abgeleitet, nicht
gespeichert.

---

## 7. Alle 5 Wellen eine Bosswelle **[BESCHLOSSEN]**

Welle 5, 10, 15, … ist eine Bosswelle.

**[VORSCHLAG] Ausgestaltung:**

- Die Bosswelle bringt **halbes Gefolge plus einen Boss**, der als Letzter
  anrückt.
- Der Boss ist ein aufgewerteter Recke des höchsten verfügbaren Rangs:
  **25-fache LP** (nach Wellen-Skalierung), **0,6-faches Tempo**, doppelt
  so groß gezeichnet, eigener Name mit Titel („Fürst Adelbrecht der
  Unverdauliche"), Lebensbalken dauerhaft sichtbar.
- Im Tor blockiert er **lange** einen Fress-Platz — das Gefolge staut sich
  dahinter. Bosswellen sind damit automatisch Kapazitäts- und
  Schlund-Prüfungen, ohne dass eine einzige Sonderregel nötig ist.
- **Belohnung:** garantierter Artefakt-Drop (mindestens Selten; Güte der
  Bosswelle) plus zehnfaches Klassen-Gold.
- Der Marktschreier bekommt eigene Boss-Zweizeiler (Ankündigung und Tod).
- Die Nachtvorschau zeigt ihn an: „Gleich kommen: 12× Ritter · **1× BOSS**".

Offen (Abschnitt 10): Soll der Boss eine aktive Fähigkeit haben?

---

## 8. Balance-Korrekturen **[BESCHLOSSEN]**

1. **Scharfe Klauen: nur noch +1,5 % je Stufe** (bisher +28 % — viel zu
   steil). **[VORSCHLAG]** Dafür: kein Stufendeckel und flacher Preis
   (×1,35) — Klauen werden die verlässliche Dauersenke für Gold, die ein
   Idle-Spiel braucht.
2. **Tiefere Hallen: richtig teuer und nicht sofort kaufbar.**
   **[VORSCHLAG]** Startpreis 400 Gold, Faktor ×2,5 — und **freigeschaltet
   erst ab Welle 8** (davor ausgegraut mit Hinweis „ab Welle 8"). Puffer
   ist damit früh knapp und Schlund/Klick müssen es richten; die erste
   Hallen-Stufe fühlt sich wie ein Meilenstein an.
3. **Upgrade-Beschreibungen zeigen Werte:**
   - In der Warenbeschreibung steht der **aktuelle Gesamtwert in Grün**:
     „Das Monster frisst derzeit **+4,5 %** schneller."
   - Beim **Überfahren des Kaufknopfs** erscheint ein Tooltip mit dem
     Zugewinn der nächsten Stufe: „Nächste Stufe: **+1,5 %** → **+6,0 %**."
   - **[VORSCHLAG]** Technisch: Jede Ware bekommt in `wirtschaft.mjs` zwei
     Textfunktionen `wertJetzt(stufe)` und `wertNaechste(stufe)`; der
     Tooltip nutzt dieselbe Mechanik wie der der Aktionsleiste. Gilt für
     alle Waren, nicht nur Klauen.

---

## 9. Was das technisch bedeutet **[VORSCHLAG]**

**Abriss:** Klick-Varianten (Kauf, Umschalten, Statuen, Brand aus Inferno,
Titan-Pfad), Waren lockruf/marsch/koeder, Währungen Blut/Schrott samt
Anzeigen und Zeichen, `verbuchen()`-Blutpfad.

**Bleibt unangetastet:** Fressschlange samt Ladebalken, Schadenszahlen,
Aktionsleisten-Tooltip, Nachtvorschau, Zielwasser, Drachling-Doppelgold,
Marktschreier, Porträts, Mobil-Layout.

**Spielstand:** neuer Schlüssel `slayemall.wellen.v2`; v1 wird beim Start
gelöscht (Muster in `speicher.js` vorhanden). Zur Frage, ob Blut/Schrott-
Guthaben in Gold umgetauscht werden, siehe Abschnitt 10.

**Betroffene Module** (grob nach Aufwand):

| Modul | Änderung |
| --- | --- |
| `werkzeuge/wirtschaft.mjs` | Preise neu (nur Gold), Klauen/Hallen, Skalierungsformeln, Schatzjäger, Werttext-Funktionen, Affix-Pool |
| `spiel/artefakte.js` **neu** | Generator (seedbar), Drop-Wurf, Wirkungs-Sammler („Summe aller Affixe der 5 Regalplätze") |
| `spiel/simulation.js` | Skalierung anwenden, Trupp-Spawn, Boss, Gift/Eis-Zustände, Artefakt-Wirkungen einrechnen |
| `spiel/kampf.js` | Schadensarten, artfarbene Zahlen, Drop-Wurf beim Tod |
| `spiel/wellen.js` | Bosswellen auslosen und ankündigen |
| `spiel/anzeige.js` | dritter Reiter, Regal + Inventar + Detailkarte, Waren-Tooltips, Kopf ohne Blut/Schrott |
| `spiel/figuren.js` | Boss (doppelte Größe, Balken), Gift-/Frost-Anzeige an Recken, Artefakt-Symbole |
| `index.html`, `stil.css` | dritte Seite, Regaloptik, dritter Reiter-Knopf |
| `werkzeuge/pruefe-*.mjs` | Wirtschaft nachziehen, `pruefe-artefakte.mjs` neu |
| `werkzeuge/balance.mjs` | Bot: nur Gold, Boss-Wellen überleben, Artefakte anlegen |

**[VORSCHLAG] Etappen** — jede einzeln spielbar und prüfbar:

1. **0.7.0 „Die große Vereinfachung":** Varianten raus, drei Waren raus,
   nur Gold, ×10-Rebasierung, Klick-Priorität, Klauen/Hallen-Korrektur,
   Werttexte + Kaufknopf-Tooltip.
2. **0.8.0 „Die Wellen beißen zurück":** passive Skalierung, Trupps,
   Bosswellen, Schadensarten-Gerüst mit artfarbenen Zahlen.
3. **0.9.0 „Artefakte":** Reiter, Regal und Inventar, Drops, Generator,
   Schatzjäger, die ersten ~12 Affixe aus dem Pool.

---

## 10. Offene Designfragen an Jannik

1. **Blut als Schmuck behalten?** Als Währung ist Blut raus — aber der
   Liter-Zähler war die Seele des Spiels. Er könnte als reine
   Deko-Statistik bleiben („vergossen: 2,3 Badewannen"), ohne dass man
   damit bezahlt. *Empfehlung: behalten, kostet nichts.*
2. **Alte Spielstände:** Blut- und Schrott-Guthaben beim Umstieg in Gold
   umtauschen (z. B. 1:1) oder Spielstand verwerfen? *Empfehlung: Das
   Spiel ist jung — verwerfen, sauber starten.*
3. **Feuer-Tick der Artefakte:** Janniks Beispiel sagt „1 Schaden je
   Feuer-Artefakt". Im ×10-Maßstab wäre 1 praktisch wirkungslos.
   *Empfehlung: 10 je Feuer-Tag und Sekunde (so im Affix-Pool notiert).*
4. **Boss-Fähigkeiten:** Reicht „groß, zäh, blockiert das Maul" — oder
   soll ein Boss aktiv etwas tun (Gefolge anfeuern, Pfeile abschütteln)?
   *Empfehlung: erste Fassung ohne, die Blockade trägt allein.*
5. **Hallen-Freischaltung:** ab fester Welle (Vorschlag 8) oder an einen
   Kauf gebunden (z. B. erst wenn Schlund 2 gekauft)?
6. **Midas und Titan als legendäre Artefakte** wieder auftauchen lassen —
   oder endgültig weg?
7. **Artefakte verkaufen:** Preise 25/100/400/1.600 in Ordnung? Und darf
   man Ausgerüstetes direkt vom Regal verkaufen?
8. **Seltenheits-Namen:** Gewöhnlich / Selten / Episch / Legendär — oder
   eigene Wörter im Ton des Spiels („Angeschlagen / Brauchbar / Prächtig /
   Sagenhaft")?
9. **Kettenblitz für Donnerschlag** (Blitz springt auf Nachbarn) als
   Grundverhalten der Art — oder nur über Artefakte?
10. **Truppgröße-Deckel 4** und **Tempo-Deckel +50 %** in Ordnung? Ohne
    Deckel wird das Spiel irgendwann mechanisch unspielbar schnell.

---

*Dieses Dokument ist die Arbeitsgrundlage für den Umbau. Änderungen daran
bitte direkt hier im Repository — es soll die eine Wahrheit bleiben,
während im Design weitergedacht wird.*
