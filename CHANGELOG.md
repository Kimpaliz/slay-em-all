# Änderungsprotokoll

## 0.8.1 — 29.08.2026

**Der Werkbank-Zweig ist jetzt der Stand von `main`, komplett
durchgetestet.** Entscheidung Jannik: Die in der Design-Werkbank
weiterentwickelte Fassung 0.8.0 ist die maßgebliche Version. Der zuvor
im Repository entstandene Zweig (0.9.0–0.14.1: Ton, Titelbild,
installierbare App, Blutkreislauf, 800er-Bühne, Boss als Frist) liegt
vollständig unter dem Etikett `v0.14.1-eigener-zweig` — nichts ist
verloren, es ist nur nicht mehr der Stand von `main`.

### Der geerbte Zombie-Arbeiter

Der einzige echte Fehler des Zweigwechsels selbst: Der alte Zweig hatte
einen Dienst-Arbeiter (`sw.js`), und **jeder Browser, der die Seite
schon besucht hat, trägt ihn noch in sich** — auf der Live-Seite war er
nachweislich aktiv, mit 31 Dateien im Vorrat. Eine gelöschte `sw.js`
meldet 404, und ein 404 lässt den alten Arbeiter unangetastet ewig
weiterlaufen; offline servierte er den alten Spielstand.

Deshalb liegt jetzt bewusst wieder eine `sw.js` da — als
**Selbstabschalter**: Der Browser prüft die Adresse beim nächsten
Besuch, tauscht die Fassung ein, und die neue leert alle Vorratslager,
meldet sich ab und lädt offene Fenster neu.

### Durchgetestet (UI und Gameplay, Janniks Auftrag)

Alle 23 Module laden (nicht nur Syntax — Importe wirklich aufgelöst).
Im Browser mit echten Klicks:

- **Neustart** zweistufig, löscht den Spielstand wirklich.
- **Welle 1:** 5 Erledigte → 5 Münzen liegen, eingesammelt → 5 Gold.
  Liegengebliebenes Gold bleibt über die Nacht liegen (Regel, kein
  Fehler: ohne Rabenpakt sammelt das Wellenende nicht ein).
- **Klick kaufen:** bei 5 Gold korrekt gesperrt, bei 18 gekauft;
  Angriff aufs Ziel 26 → 16 LP, Abklingzeit 2 s, Schadenszahl schwebt.
- **Bosswelle 5:** Ansage mit Namen („Marschall Wolfram die Schwerste
  Mahlzeit"), Boss doppelt groß mit 1.216 LP, Welle gewonnen,
  **Bossgarantie erfüllt** — „Aschenkette des Zeugmeisters" (Selten,
  2 Affixe, Fundwelle 5) landete im Lager.
- **Artefakte:** Karte öffnet mit Name, Seltenheit, Tags, Affixen und
  drei Knöpfen; Anlegen verschiebt ins Regal; die **Regalsumme wirkt**
  (Gierschimmer +7,05 % Münzwert, Giftpfeile 9 Schaden/s in
  `wirkungAus`).
- **Zauber:** Drachenpranke gekauft (158 → 118 Gold), in der Leiste,
  Tooltip mit Werten und Schadensart.
- **Speicher-Umlauf:** sichern → laden hält Welle, Gold, Klick, Zauber
  und das Regal-Artefakt samt Namen.
- **Handy quer (916 × 412):** alles im Bild, Brückenboden sichtbar,
  Reiter erreichbar. **Hochkant (390 × 844):** kein seitlicher
  Überlauf, alle drei Wischseiten mit allen Knöpfen erreichbar, Reiter
  schalten exklusiv.

### Beobachtungen, keine Fehler

- Ohne Eingreifen gehen frühe Wellen verloren (der Vorspul-Test ohne
  Klicks blieb bei Welle 2–3 hängen). Das Spiel verlangt Gegenwehr —
  Regel, kein Fehler.
- Handy quer nutzt 58 % des Bildschirms. Der ersetzte Zweig hatte mit
  aufgelegter Steuerung 90 % erreicht; wenn das gewünscht ist, wäre es
  auf diesem Zweig neu zu bauen.

### Offen (unverändert aus der Übergabe)

`pruefe-wirtschaft.mjs` bricht am fehlenden `BOSS_ABSTAND` — die
Skripte stammen vom 0.6.0-Stand und kennen den heutigen nicht.
`balance.mjs` läuft dagegen an. Nachziehen bleibt der erste offene
Schritt, dazu ein neues `pruefe-artefakte.mjs`.


## 0.8.0 — 28.08.2026

**Artefakte.** Abschnitt 6 des Entwurfs ist gebaut — der dritte Reiter, das
Regal, das Lager, der Generator, die Drops. Damit ist `docs/ENTWURF.md`
vollständig umgesetzt.

### Entscheidungen von Jannik

- **Midas und Faust des Titanen bleiben endgültig weg.** Der vierte,
  einzigartige Affix-Platz der legendären Stufe bekommt stattdessen fünf
  neue Affixe im Ton des Hauses.
- Seltenheitsnamen klassisch: **Gewöhnlich / Selten / Episch / Legendär**.
- **Verkaufspreise ×4** der Vorschläge: 100 / 400 / 1.600 / 6.400 Gold.
- **Fundchance 0,05 %** je getötetem Recken — sehr selten. Dafür:
- **Bosswellen lassen garantiert ein Artefakt fallen**, mindestens Selten.
  Damit sind Bosse der verlässliche Weg zu Ausrüstung, und die 0,05 % sind
  der Glücksfall obendrauf.
- **Kettenblitz nur über Artefakte**, nicht als Grundverhalten der Art.
- **Truppgröße ohne Deckel** (bisher 4): `1 + ⌊w/5⌋` wächst weiter. Der
  Spawn-Abstand wächst mit, die Gesamtmenge bleibt gleich — die
  Spitzenlast am Tor steigt ohne Ende.

### Regal und Lager

Dritter Reiter neben Schlachtfeld und Händler, auf dem Handy die dritte
Wischseite. Oben ein Brett mit **fünf Fassungen** — was dort liegt, wirkt.
Darunter ein **Lager mit 20 Plätzen** — wartet. Zwischen beidem eine Reihe
Chips, die die Summe des Regals zeigt („2× Feuer · Fressen +6,3 % · Klick
zündet: 20/s").

**Antippen öffnet eine Detailkarte** mit Name, Seltenheit, Fundwelle, Tags
und jedem Affix in seiner Tagfarbe, dazu **Anlegen / Ablegen /
Verkaufen**. Kein Ziehen und Fallenlassen — antippen geht am Handy genauso
gut wie mit der Maus, und es gibt nichts zu üben. Verkaufen geht auch
direkt vom Regal; der Knopf heißt dann „Ablegen & verkaufen", damit
niemand versehentlich seine Ausrüstung verscherbelt.

Ist das Lager voll, **zahlt sich ein neuer Fund sofort als Gold aus** —
verlieren soll man ihn nicht.

### Was ein Artefakt ist

`{ name, seltenheit, fundwelle, affixe: [{ k, wert }] }` — nichts weiter.
**Tags werden nie gespeichert**, sondern beim Laden aus den Affixen
abgeleitet; sonst könnten Stand und Regel auseinanderlaufen.

Der Name wird aus Teilen gesetzt („Schlundkette des Vorbesitzers"), das
Symbol aus Rechtecken: **Grundform nach dem vorherrschenden Tag** (Flamme,
Tropfen, Kristall, Blitz, Münze, Turm), **Rahmenfarbe nach Seltenheit**.
Damit ist ein Artefakt schon im Gitter lesbar.

**Güte:** Jedes Artefakt merkt sich seine Fundwelle; die Wertspannen
wachsen mit `1 + 0,35 × ⌊Fundwelle/5⌋`. Ein „+8 % Goldfund" von Welle 3
kann auf Welle 40 als „+31 %" fallen — alte Funde veralten, die Drops
bleiben interessant.

### Fünfzehn Affixe

Feuer: Brennende Berührung (Klick zündet an, **10 Schaden/s je
ausgerüstetem Feuer-Artefakt** — der Kern des Systems), Glutpfeile ·
Gift: Giftpfeile (stapelbar!), Zähes Gift · Eis: Frostgriff, Raureif ·
Blitz: Kettenblitz, Geladene Klauen · Gold: Gierschimmer, Spürnase,
Magnetring · Burg: Eisenmagen, Weite Hallen, Kalte Präzision, Schnelle
Hand.

Damit haben **Eis und Gift endlich eine Quelle** — die zwei Schadensarten
aus 0.7.0 waren bis jetzt leer. Gift stapelt: Jeder Treffer legt einen
eigenen Eintrag mit eigener Uhr an, alle ticken parallel. Frost stapelt
nicht, der stärkste gewinnt.

### Fünf legendäre Affixe

- **Der Zweite Schlund** — dauerhaft +1 Maul.
- **Blutzoll** — je 500 vergossene Liter eine Münze. Blut ist wieder etwas
  wert, ohne wieder Währung zu sein.
- **Rabenpakt** — am Wellenende tragen die Raben alles liegengebliebene
  Gold ein.
- **Hungriges Gemäuer** — jeder Tod im Tor macht 3 % schneller satt, 6 s
  lang, bis zehnfach gestapelt.
- **Aschenkrone** — wer verbrennt, lässt eine Glut liegen; der Nächste, der
  darüberläuft, brennt. Ketten sind möglich und gewollt.

### Neu bei Pips

**Schatzjäger** (50 Gold, ×2,0, max 10): je Stufe +0,1 % Fundchance.

### Kleinigkeiten

- Gefallene Artefakte funkeln in ihrer Seltenheitsfarbe und **rollen nie in
  den Abgrund** — die Fallstelle wird auf festen Boden gezogen. Wer den
  Klick verpasst, bekommt sie am Wellenende trotzdem.
- Neue Klick-Rangfolge: Blitz → **Fundstück** → Gegner → Münze.
- Vergiftete Recken tragen grüne Blasen, gefrostete blaue Kristalle.
- Die Nachtzeile ist kürzer („Bereit: 5 · Burg 4 · Schlund 1"), weil sie
  mit dem Boss-Chip sonst umbrach und die Steuerung aus der Bühne schob.

### Technisch

- Neu: `spiel/artefakte.js` (reine Logik, austauschbarer Zufall — mit
  gesetztem Startwert ergibt derselbe Wurf dasselbe Artefakt) und
  `spiel/artefakt-bild.js` (ein Symbol, zwei Größen).
- `werte()` nimmt die Regalsumme als drittes Argument; `klickWerte()` als
  zweites. Ohne Regal rechnet alles wie vorher.
- `verbuchen()` würfelt den Drop und rechnet den Blutzoll ab — es ist die
  eine Stelle, die bei jedem Tod genau einmal läuft.
- Neuer Speicherschlüssel **`slayemall.wellen.v3`**; v1, v2 und alle
  `burgtor.*` werden beim Start entfernt. Artefakte werden beim Laden
  geprüft (nur echte Affixe, nur echte Stufen).
- Neu in der Szene: `fundstuecke`, `gluten`, `sattStapel`/`sattZeit`.

### Geprüft

Im Browser: Regal mit Legendär/Episch/Selten und sieben Stücken im Lager,
Detailkarte mit vier Affixen und Ablegen/Verkaufen, Bosswelle 10 mit
garantiertem Drop, Giftschaden in Grün (−12), Magnetring zieht die Münzen
zum Tor, Aschenkrone legt Gluten, Blutzoll zahlt aus, alle drei Reiter
umschaltbar. Keine Konsolenmeldung.

### Weiter offen

- **`pruefe-wirtschaft.mjs` und `balance.mjs` sind weiter nicht
  nachgezogen** und laufen gegen die neue `wirtschaft.mjs` nicht durch.
  Dazu fehlt `pruefe-artefakte.mjs` ganz — `artefakte.js` ist genau dafür
  gebaut (seedbarer Zufall), aber das Skript existiert noch nicht.
- **Unvermessen:** ob 0,05 % Fundchance plus Bossgarantie sich richtig
  anfühlt, und ob die Truppgröße ohne Deckel irgendwann eine Wand ist.
- Kein Ton.

## 0.7.0 — 28.08.2026

**Die große Vereinfachung — und die Wellen beißen zurück.** Der Umbau aus
`docs/ENTWURF.md` ist umgesetzt, Abschnitte 1 bis 5, 7 und 8. Die
Artefakte (Abschnitt 6) fehlen noch; dazu stehen Fragen offen.

### Eine Währung

**Blut und Schrott sind keine Währungen mehr.** Alles kostet Gold — Zauber,
Klick und Burgausbau. Gold fällt weiterhin als Münze auf die Brücke und
muss aufgesammelt werden; damit ist „besondere Tode werfen mehr ab" der
einzige Grund geblieben, überhaupt einzugreifen.

Blut bleibt als **Bilanz des Hauses** in der Kopfzeile stehen — vergossene
Liter, kleiner gesetzt, kein Zahlungsmittel. Der Schrottzähler und der
Bruchteilsrest sind fort.

### Der Klick wird wieder einfach

Midas-Berührung, Infernale Berührung und Faust des Titanen sind
**gestrichen**, mit ihnen die Goldstatuen. Es bleibt eine Fassung des
Klicks mit den drei Achsen Schaden / Abklingzeit / Krit.

**Neue Rangfolge:** Blitz → **Gegner** → Münze. Läuft die Klick-Abklingzeit
oder steht kein Recke unter dem Zeiger, fällt der Klick auf die Münze
durch. Kein Modus-Knopf nötig.

### Drei Waren fort

Lockrufe im Tal, Marschmusik und Edler Köder entfallen ersatzlos — was sie
taten, tut das Spiel jetzt selbst. Pips behält Sammel-Drachling,
Sammlerstolz und Makabre Ernte.

### Zahlen mal zehn

Alle Lebenspunkte und alle Schadenswerte sind verzehnfacht, **die Zeiten
sind unverändert**: Das Monster frisst 10 LP je Sekunde, ein Bauer hat 20 —
er braucht also weiterhin zwei Sekunden. Der Grund ist Auflösung: Große
Zahlen tragen feine Modifikatoren (+1,5 % Klauen, ein 13er-Gift-Tick), mit
2-LP-Bauern wäre nichts davon zu spüren.

### Fünf Schadensarten

Jeder Schaden trägt jetzt eine Art, und die schwebende Zahl färbt sich
danach: Physisch (weiß), Feuer (orange), Blitz (lila-weiß), Eis (blau),
Gift (grün). Eis und Gift existieren noch ohne Quelle — sie warten auf die
Artefakte. Krits bleiben golden und größer.

### Die Wellen wachsen von selbst

Pro Welle steigen passiv: Menge (wie bisher, Deckel 80), **Lebenspunkte**
×1,05, **Tempo** +1 % (Deckel +50 %) und alle fünf Wellen die
**Truppgröße** (1 + ⌊w/5⌋, Deckel 4). Der Spawn-Abstand wächst mit der
Truppgröße, die Gesamtmenge bleibt also gleich — nur die Spitzenlast am Tor
steigt. Genau das macht Schlund und Kapazität wertvoll.

### Alle fünf Wellen ein Boss

Welle 5, 10, 15 … bringt halbes Gefolge plus einen Boss: höchster
verfügbarer Rang, **25-faches Leben**, 0,6-faches Tempo, doppelt so groß
gezeichnet, dauerhafter Lebensbalken in Gold, eigener Name aus Rang +
Rufname + Beiname („Marschall Kunibert der Sattmacher"). Keine
Sonderfähigkeit — die Blockade des Fressplatzes trägt allein. Er wirft
zehnfaches Gold ab, der Marktschreier hat eigene Zeilen für Ankunft und
Tod, die Nachtvorschau zeigt ihn als goldenen Chip, und der Startknopf
färbt sich golden.

### Rauch (Wunsch Jannik)

Flammenstoß, Meteoritenschauer, Donnerschlag, Explosionen, frische
Brandflecken und verbrennende Recken lassen jetzt **kleine Rauchflocken
hochgleiten und ausfaden**. Sie steigen, verlieren ihren Auftrieb, driften
leicht nach links, werden größer und heller und verschwinden — keine
Schwerkraft, weil Rauch nicht fällt. Einzelne Glutflocken glühen die
erste Drittelsekunde orange nach, bevor sie vergrauen. Gedeckelt bei 150
Flocken, gezeichnet in ganzen Bildpunkten, damit es in der Pixelgrafik
nicht wie ein Fremdkörper aussieht.

### Balance-Korrekturen

- **Scharfe Klauen: +1,5 % je Stufe** statt +28 %, dafür ohne Deckel und
  mit flachem Preis (×1,35) — die Dauersenke für Gold.
- **Tiefere Hallen: 400 Gold, ×2,5, erst ab Welle 8** — vorher ausgegraut
  mit dem Hinweis „ab Welle 8". Der Puffer ist damit früh knapp; Schlund
  und Klick müssen es richten.
- **Werttexte überall:** Die Warenbeschreibung zeigt den aktuellen
  Gesamtwert („frisst 4,5 % schneller"), der Tooltip am Kaufknopf den
  Zugewinn der nächsten Stufe („+1,5 % → 6,0 %") und den Preis. Jede Ware
  hat dafür `wertJetzt(stufe)` und `wertNaechste(stufe)` in
  `wirtschaft.mjs`.

### Technisch

- Neuer Speicherschlüssel **`slayemall.wellen.v2`**; v1 und alle
  `burgtor.*` werden beim Start entfernt. Blut- und Schrott-Guthaben
  werden **nicht** umgetauscht — das Spiel ist jung, ein sauberer Start ist
  ehrlicher als eine Umrechnung, die niemand prüfen kann.
- `schaden()` nimmt die Schadensart statt eines `feuer`-Schalters.
- Neu: `spiel/daten/bosse.js` (Namen und Marktschreier-Zeilen).
- Fort: `vergolden()`, `statueEinsammeln()`, `statueZeichnen()`,
  `KLICK_VARIANTEN`, `szene.statuen`, `welt.schrottRest`.
- Neu in der Szene: `szene.rauch`, `szene.spawnBoss`,
  `zustand.anstehenderBoss`, `zustand.bosse`.
- Recken tragen `boss` und `groesse`; die doppelte Größe entsteht durch
  eine Skalierung um den Fußpunkt in `szene.js`, nicht durch eine zweite
  Zeichenfunktion.

### Geprüft

Im Browser durchgespielt: Bosswelle 5 und 10 (Ankündigung, goldener Chip,
goldener Startknopf, Boss erscheint als Letzter, wird verschluckt und
blockiert den Fressplatz), Trupp-Spawn zu zweit, Flammenstoß und
Meteoritenschauer samt Rauch, Schadenszahlen in Artfarbe, Waren-Tooltip
mit Jetzt-/Nächste-Werten, Tiefere Hallen gesperrt bei Welle 5 und
kaufbar bei Welle 10, alle Ladenknöpfe mit Goldzeichen, Kopfzeile mit Gold
und Blutbilanz. Keine Konsolenmeldung.

### Nicht geprüft — offen

- **`pruefe-wirtschaft.mjs` und `balance.mjs` sind nicht nachgezogen.**
  Sie kennen Blut, Schrott und die Spielarten noch als Währungen und Waren
  und laufen gegen die neue `wirtschaft.mjs` nicht mehr durch. Erster
  Schritt der nächsten Runde.
- **Die neue Kostenkurve ist unvermessen.** Verdacht: Scharfe Klauen laufen
  bei ×1,35 irgendwann aus dem Preis (Stufe 40 kostet schon 660 k),
  während die Lebenspunkte mit ×1,05 je Welle weitersteigen. Ob das die
  gewollte Härte ist oder eine Wand, sagt erst der Rechner.
- **Artefakte (Abschnitt 6 des Entwurfs) fehlen ganz** — samt drittem
  Reiter, Regal, Inventar, Generator und Schatzjäger. Dazu stehen
  Designfragen offen (Legendär-Affixe, Verkaufspreise,
  Seltenheits-Namen).

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
