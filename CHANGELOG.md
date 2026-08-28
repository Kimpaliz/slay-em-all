# Änderungsprotokoll

## 0.12.1 — 29.08.2026

**Notreparatur: Das Handy war unbenutzbar.** Zwei Wunden aus dem
Entfernen des Marktschreiers in 0.11.0, beide von derselben Operation.

### Die Seite war strukturell zerbrochen

Beim Herausschneiden des Laufbands aus `index.html` blieb ein `</div>`
zu viel stehen. Das schloss den Seitencontainer zu früh — **Händler und
Artefakte rutschten aus `.seiten` heraus** und wurden Geschwister davon.

Die Folge am Handy quer, gemessen auf 916 × 412: `.seiten` hatte Höhe
**0**, die **Leinwand war 0 × 0**, die Steuerung saß bei y = −67
außerhalb des Bildes, die Reiterleiste war ganz verschwunden. Nichts
davon war bedienbar.

### Die kompakte Kopfzeile gab es nie

Dieselbe Operation ließ in `stil.css` eine Selektorliste mit hängendem
Komma zurück:

```
.wurzel.schmal .untertitel,
.wurzel.schmal .vorspann,
                              ← Block fehlt
.wurzel.schmal h1 { font-size: 17px; }
```

Statt `display: none` bekamen Vorspann und Untertitel damit
`font-size: 17px`. Die Kopfzeile war am Handy **145 Punkte hoch** statt
49 und fraß ein Drittel des Bildes.

**Warum das durchrutschte:** In 0.11.0 habe ich nach dem Verbreitern der
Bühne nur den Schreibtisch nachgemessen, nicht das Handy. Beide Fehler
wären bei einer einzigen Messung auf 916 × 412 aufgefallen.

Nach der Reparatur: Kopfzeile 49, Leinwand 1490 × 373, Brückenboden bei
y 272 frei, alle drei Seiten wieder im Container, alle Reiter erreichbar,
**90 % Bildschirmnutzung**.

### Zwei Flugbahnen kannten die neue Karte nicht

Auch das stammt aus dem Verbreitern:

- **Der Meteoritenschauer** ging in einem festen Streifen zwischen
  Klippe und Tor nieder — auf der breiteren Bühne nur noch 204 von 635
  Punkten Laufweg. Das ganze neue Land bekam nichts ab. Jetzt wird die
  **Zielzone beim Auslösen aus den Standorten der Recken bestimmt**
  (gemessen: Recken auf 60–560 ergeben Einschläge von 50 bis 581).
- **Der Sammel-Drachling** kehrte schon bei `KLIPPE − 70` um und hat das
  neue Land nie gesehen; Münzen, die dort lagen, blieben liegen. Er
  patrouilliert jetzt von 19 bis 609 — **96 % der Fläche** — und fliegt
  schneller, weil eine Runde sonst über 40 Sekunden dauern würde.


## 0.11.0 — 28.08.2026

**Die Bühne wird doppelt so lang, der Marktschreier geht, Bosse kommen
alle zehn Wellen.**

### Mehr Fläche zum Kämpfen

Die Bühne ist von 480 auf **800 Punkte** gewachsen. Alle Landmarken —
Klippe, Brücke, Mauer, Tor — sind unverändert geblieben und um 320
Punkte nach rechts gerückt; links davor liegt neues offenes Land.

Der Weg vom Erscheinen bis ins Tor ist damit **doppelt so lang: 635
statt 315 Punkte**. Mehr Platz zum Kämpfen, mehr Zeit, jemanden
aufzuhalten — Bogenschützen und Zauber bekommen die doppelte Zahl an
Gelegenheiten.

Auf den Schirm passt das nicht mehr am Stück. Die Leinwand steht deshalb
in einem **waagerecht scrollbaren Rahmen** und behält ihre Höhe, statt
zusammengestaucht zu werden. Der Blick beginnt **am Tor** — dort
entscheidet sich alles; das Land davor sieht man beim Zurückscrollen.

Was mitwandert und was nicht, ist bewusst getrennt: Spruchband,
Dämmerung und Randabdunklung richten sich nach dem sichtbaren
Ausschnitt (nachgemessen: Bandmitte bei 199 bzw. 600, sie folgt genau).
Alles andere steht fest in der Welt.

Auf dem Handy verhindert `overscroll-behavior-x: contain`, dass ein
Wisch über das Schlachtfeld am Rand zur nächsten Seite weiterblättert.
**Gewechselt wird dort jetzt über die Reiter**, nicht mehr durch Wischen.

### Der Marktschreier ist weg

Das Laufband kostete Platz, den die breitere Bühne besser gebraucht.
Mit ihm sind seine Reimzeilen gegangen — `marktschreier.js`, alle
`melden()`-Aufrufe und acht Textlisten, die nur er benutzt hat, sind
restlos entfernt. Die Namen der Recken und die Händlersprüche bleiben.

### Bosse alle zehn Wellen

Statt alle 190. Auf der längeren Brücke brauchte der Boss mit dem alten
Tempo 160 Sekunden — zu träge, um spannend zu bleiben. Sein Tempofaktor
steigt deshalb von 0,33 auf 0,6, was **88 Sekunden** ergibt.

### Nachgezogen

Alles, was an festen Koordinaten hing, rechnet jetzt relativ: Fackeln
und Bogenschützen stehen in `MASSE`, die Zahl der Sterne und die
Felsstruktur der Klippe wachsen mit der Breite, und der Anstieg vor der
Abbruchkante hängt an der Klippenbreite statt an einer festen 100.

`MASSE.SCHUETZE_X` liegt bewusst bei der Bühne und nicht im Zeichnen:
Die Simulation braucht den Abschusspunkt und darf nicht von der Grafik
abhängen.

### Geprüft

- 2.267 Wirtschafts-, 15.108 Artefakt- und 20 Simulationsprüfungen grün.
- **Jedes Modul einzeln geladen**, nicht nur syntaktisch geprüft — das
  fand zwei tote Importe, die `node --check` nicht sieht, weil es
  Importe gar nicht auflöst.
- Im Browser: Leinwand 800 × 200, Rahmen scrollt, Start am rechten Rand.
  Waagerechter Schnitt über neun Stellen der ganzen Breite — überall
  Boden, Planken oder Mauer, **keine schwarzen Lücken**. Spruchband
  folgt der Sicht.


## 0.10.0 — 28.08.2026

**Fresszeit löst sich von den Lebenspunkten. Zwei neue Einheiten. Bosse
werden zur Frist statt zum Kaubrocken.**

### Die zentrale Änderung

Bisher war `lp` beides zugleich: Zähigkeit auf der Brücke **und**
Verdauzeit im Tor. Das koppelte zwei Dinge, die nichts miteinander zu tun
haben — und ließ Bosse ins Unspielbare wachsen (Messung vom 28.08.: Welle
20 hätte 1.011 Sekunden reine Fresszeit gebraucht).

Jetzt sind es zwei Achsen:

| | bedeutet |
| --- | --- |
| `lp` | wie schwer einer auf der Brücke zu töten ist |
| `fressZeit` | wie lange er im Tor einen Platz blockiert |

Gewöhnliche Recken kosten **2 Sekunden** — vom Bauern bis zum
Großmeister gleich. „Scharfe Klauen" beschleunigt jetzt diese Zeit
(20 Stufen drücken 2 s auf gemessene 1,55 s).

### Zwei neue Einheiten

**Panzerritter** (ab Welle 9): 220 Lebenspunkte, Tempo 10 — und
**7 Sekunden Fresszeit**. Er ist der Verstopfer: nicht gefährlich,
aber hinter ihm staut sich die Welle. Breiterer Rumpf, Schulterplatten,
Streitkolben.

**Heilzauberer** (ab Welle 14): trottet mit Tempo 7 hinterher und hält
alles in 34 px Umkreis am Leben (9 LP je Sekunde). Grüne, pulsierende
Aura mit hartem Ring auf den Planken; wer geheilt wird, schimmert kurz
grün. Er heilt **nicht sich selbst** — sonst wären zwei davon
unsterblich. Trägt einen Stab mit leuchtendem Knauf statt einer Klinge.

### Bosse

- **Alle 190 Wellen** statt alle fünf. Ein Meilenstein, kein Rhythmus.
- **Betritt er das Tor, ist die Burg sofort verloren.** Er wird nicht
  mehr verdaut — er muss auf der Brücke sterben. Eigene Niederlagen-
  meldung: „DER BOSS IST DURCH".
- Daraus folgt die neue Auslegung: **fünffaches Leben des stärksten
  Rangs** (statt 25-fach) = rund 40 Bauern, und **ein Drittel Tempo** =
  gemessene **80 Sekunden** Zeit zum Töten. Vorher hing seine Schwierig-
  keit an Kapazität und Schlund; jetzt allein an der Frage, ob der
  Schaden reicht.
- Vierzigfaches Gold, weil er der einzige seiner Art ist.

### Gemessen

Neues Prüfskript `werkzeuge/pruefe-simulation.mjs` — es lässt die echte
Simulation im Zeitschritt laufen, statt nur Formeln nachzurechnen.
**20 Prüfungen, 0 Fehler**, darunter:

- Bauer 2,02 s, Großmeister 2,02 s — achtfaches Leben, gleiche Zeit.
- Panzerritter 7,02 s.
- Der Nahe wird geheilt (5 → 20 LP), der Ferne nicht, der Heiler selbst
  nicht, und nie über volles Leben hinaus.
- Boss am Tor: Phase sofort `niederlage`, nichts landet im Tor.
- Ein gewöhnlicher Großmeister am selben Punkt: Welle läuft weiter.

Im Browser nachgesehen: Die Aura färbt die Umgebung an drei gemessenen
Punkten grün, der Ring auf den Planken ebenfalls.

**Balance danach:** Die Streuung, die am 28.08. noch Faktor 14 betrug
(Welle 7 bis 20), ist praktisch verschwunden — sechs Läufe endeten
alle bei Welle 7 mit 663 bis 1.610 Gold. Die Wellen laufen deutlich
zügiger (29–72 s statt 19–239 s), weil der Boss-Slog weg ist. Die
Kapazitätswand bei Welle 9–10 steht unverändert; sie ist eine
Entwurfsfrage und in `docs/BALANCE-2026-08-28.md` beschrieben.

### Prüfungen nachgezogen

Die Reihe der Recken ist keine Leiter mehr, sondern eine Aufstellung mit
Rollen. „Später = in allem größer" galt für sieben Klassen nicht mehr und
wurde durch die Regeln ersetzt, die wirklich gelten: Erscheinungswelle
und Goldwert steigen, alles andere folgt der Rolle.


## 0.9.2 — 28.08.2026

**Balance vermessen. Dabei einen Absturz gefunden und behoben.**

### Der Absturz

`explodieren()` rief `schaden()` mit einem Argument zu wenig auf. Die
Signatur hat sieben Stellen — `(welt, recke, menge, ursache, art, werte,
krit)` —, übergeben wurden fünf. Dadurch rutschte das Werte-Objekt in
den Platz der Schadensart, und `werte` kam als `undefined` an:

```
TypeError: Cannot read properties of undefined (reading 'ernteFaktor')
```

**Wie man dort hinkam:** ein Feuer-Artefakt anlegen, einen Recken
anklicken, er brennt, stirbt brennend, explodiert — und die Explosion
tötet einen Nachbarn auf der Brücke. Also jede Kettenexplosion. Von den
zehn Aufrufstellen war genau diese eine falsch; die anderen neun
stimmten.

Gefunden wurde er erst, weil dem Balance-Rechner beigebracht wurde,
gefundene Artefakte auch **anzulegen** — vorher lagen sie unberührt im
Lager (gemessen: 5 Funde, Regal 0/5), und die ganze Artefaktwirkung war
in keiner Messung enthalten.

### Neu im Balance-Rechner

- **Der Bot legt Artefakte an**: das Seltenste zuerst, freie Plätze
  auffüllen, nie tauschen.
- **Gold eingenommen** und **Gold ausgegeben** über die ganze Partie.
  Ohne diese Summe sieht man nicht, ob ein teurer Kauf überhaupt je
  erreichbar ist — nur, dass er nicht gekauft wurde.
- Neue Prüfung: **Reicht das Einkommen rechnerisch für die erste
  Kapazitätsstufe?**

### Was die Messung zeigt

Zehn Läufe über 30 und 60 Wellen. Die Zahlen stehen in
`docs/BALANCE-2026-08-28.md`; die zwei Kernbefunde:

**1. Die Streuung ist gewaltig.** Sechs Läufe über 30 Wellen mit
identischen Regeln endeten zwischen Welle **7 und 20**, das Einkommen
lag zwischen **474 und 6.490 Gold** — Faktor 14. Über 60 Wellen wird es
schlimmer statt besser: Welle 15 bis 35, Einkommen 1.210 bis 73.300,
Faktor 60. Ursache ist eine Rückkopplung: Eine Niederlage wirft fünf
Wellen zurück, also in den Bereich mit dem geringsten Einkommen (Welle 1
bringt 4 Gold, Welle 20 bringt 816). Wer einmal fällt, fällt tiefer.

**2. Bosse wachsen schneller, als die Burg fressen kann.** Boss-Leben
skaliert mit 25 × Klassenleben × 1,05^Welle, das Fresstempo dagegen mit
+1,5 % je Stufe „Scharfe Klauen". Ohne Ausbau:

| Welle | Boss-Leben | reine Fresszeit |
| --- | --- | --- |
| 5 | 1.216 | 122 s |
| 10 | 2.715 | 271 s |
| 15 | 5.445 | 544 s |
| 20 | 10.108 | 1.011 s |

Gemessen wurden 147 s für Welle 5 und 239 s für Welle 10 — passend. In
dieser Zeit blockiert der Boss das einzige Maul, während sein Gefolge
die Kapazität füllt.

**Am Spielgleichgewicht wurde nichts geändert** — das sind Entscheidungen
für den Entwurf, nicht für einen Messlauf.


## 0.9.1 — 28.08.2026

**Vollbildknopf — auch ohne Installation ohne Browserleiste spielen.**

In 0.9.0 stand `display: fullscreen` im Manifest. Das war richtig, aber
nur die halbe Antwort: **Es wirkt ausschließlich in der installierten
App.** Wer die Seite als gewöhnlichen Tab öffnet, behält die
Adressleiste — daran ändert kein Manifest etwas. Vollbild geht dort nur
über die Fullscreen-API, und die verlangt eine echte Nutzergeste.

Also gibt es jetzt einen Knopf in der Kopfzeile, rechts neben den
Währungen. Er schaltet Vollbild ein und aus (Symbol wechselt zwischen
Pfeilen nach außen und nach innen) und versucht dabei, die Ausrichtung
auf quer festzulegen — im Vollbild ist das erlaubt, außerhalb nicht.

Der Knopf zeigt sich nur, wo er gebraucht wird:

| Lage | Knopf |
| --- | --- |
| Normaler Browser-Tab | **sichtbar** — dafür ist er da |
| Installierte App | versteckt (dort ist schon Vollbild) |
| Browser ohne Fullscreen-API (iPhone/Safari) | versteckt statt leerer Versprechung |

Auf dem iPhone kann Safari bis heute kein Vollbild für Webseiten; dort
bleibt nur das Installieren über „Zum Home-Bildschirm".

**Nicht in dieser Umgebung prüfbar:** Der eingebettete Testbrowser
sperrt Vollbild per Berechtigungsrichtlinie — ein echter Klick auf den
Knopf meldet `TypeError: Permissions check failed`, dieselbe Art Grenze,
die vorher schon den Dienst blockierte. Geprüft ist alles Übrige: Der
Knopf erscheint, erkennt die API, meldet den richtigen Zustand, und die
Erkennung „läuft als App" arbeitet.


## 0.9.0 — 28.08.2026

**Als App installierbar, und am Handy zeigen Tooltips beim Gedrückthalten.**

### Installierbar, im Vollbild

Neu sind `manifest.webmanifest`, `sw.js` und drei erzeugte App-Symbole.
Wer die Seite auf dem Handy über „Zum Startbildschirm hinzufügen"
installiert, bekommt:

- **Vollbild** (`display: fullscreen`) — keine Adresszeile, keine
  Browserleisten.
- **Quer festgelegt** (`orientation: landscape`) — die Szene ist 2,4 : 1,
  quer füllt sie 93 % des Bildschirms, hochkant nur ein Fünftel.
- **Eigenes Symbol** statt eines Bildschirmfotos: ein glühender Torbogen,
  in drei Größen, darunter eine maskierbare Fassung für Android.
- **Offline spielbar.** Der Dienst im Hintergrund arbeitet nach „Netz
  zuerst, Vorrat als Rückhalt" — online ist immer der neueste Stand da,
  ohne Netz läuft es trotzdem. Andersherum wäre es schneller, würde aber
  nach jeder Veröffentlichung den alten Stand zeigen.

Die Symbole erzeugt `werkzeuge/symbole-erzeugen.mjs` als PNG, ohne fremde
Pakete — ein PNG ist eine Handvoll Blöcke mit Prüfsumme, und `zlib` steckt
in Node. So bleibt das Motiv mit dem Lesezeichen-Symbol zusammen und ist
im Diff nachvollziehbar.

### Es fühlt sich wie eine App an, nicht wie eine Webseite

Unterdrückt sind jetzt: Text markieren, das Lupen- und Kopieren-Menü beim
Gedrückthalten, das blaue Aufblitzen beim Antippen, Doppeltipp zum Zoomen
und das Überdehnen am Rand.

### Antippen kauft, Halten zeigt

Am Handy gab es keine Möglichkeit, einen Tooltip zu sehen — Überfahren
kennt der Finger nicht. Jetzt gilt überall dieselbe Regel: **antippen
kauft oder öffnet, 380 ms halten zeigt die Werte.** Das gilt für die
Waren bei allen drei Händlern, die Fähigkeiten in der Aktionsleiste und
neu auch für Artefakte im Regal und im Lager (dort als Kurzfassung mit
Name in der Seltenheitsfarbe und allen Affixen).

Zwei Dinge waren dabei wichtig und sind beide gelöst:

1. **Der Finger verdeckt den Tooltip nicht.** Er erscheint über dem
   Druckpunkt, mit 34 px Abstand — gemessen: 28 bis 34 px Luft zwischen
   Tooltip-Unterkante und Fingerspitze. Nach unten auszuweichen wäre
   falsch, dort liegt die Hand; ist oben kein Platz, heftet er oben an.
2. **Er bleibt nach dem Loslassen stehen**, bis irgendwo hingetippt oder
   gescrollt wird. Sonst müsste man lesen, während die eigene Hand davor
   liegt.

Der Klick nach einem Halten wird verschluckt, damit Nachschauen nichts
kauft. Ein kurzer Rüttler (12 ms) meldet, dass der Tooltip da ist.

### Geprüft

Mit echten Zeigerereignissen am 915 × 412-Fenster durchgespielt:

- Ware kurz antippen → **gekauft**, kein Tooltip.
- Ware halten → Tooltip mit Ist-Wert, nächster Stufe und Preis, 28 px über
  dem Finger; Loslassen kauft **nicht**; Wegtippen schließt.
- Fähigkeit halten → alle vier Werte samt Schadensart, 34 px Luft.
- Artefakt halten → Kurzfassung, und die große Karte bleibt zu.
- Mit der Maus unverändert: Überfahren zeigt, Verlassen versteckt,
  Klicken kauft.
- Wischen zwischen den drei Seiten rastet weiter korrekt ein.
- 2.203 Wirtschafts- und 15.108 Artefaktprüfungen grün.

**Am veröffentlichten Stand nachgeprüft.** Über die lokale Testadresse
verweigerte der Browser den Dienst (`An unknown error occurred when
fetching the script`) — das lag an `http://127.0.0.1`, nicht am Code. Auf
der echten Seite ist er **angemeldet, aktiv und steuert die Seite**;
Bereich `…/slay-em-all/`. Nach dem zweiten Aufruf liegen **31 Dateien im
Vorrat**, darunter alle 23 Spielmodule — offline spielbar ist damit
belegt, nicht nur behauptet.

Beim ersten Aufruf sind es erst sieben: Die Spielmodule werden geladen,
bevor der Dienst die Kontrolle übernimmt. Das ist normal und heilt sich
beim nächsten Öffnen von selbst.

**Noch offen:** Der Installationsvorgang selbst („Zum Startbildschirm
hinzufügen") lässt sich nur am echten Gerät auslösen.


## 0.8.2 — 28.08.2026

**Am Handy quer füllt das Schlachtfeld jetzt den Bildschirm, randlos.**

Jannik meldete mit Bildschirmfoto: „auf handy sieht man den boden
garnicht". Nachgemessen auf 915 × 412 (Handy quer):

| | vorher | nachher |
| --- | --- | --- |
| Bild der Szene | 891 × 371, unten abgeschnitten | 915 × 381, vollständig |
| Bildschirmnutzung | 88 %, davon Teile außerhalb | **93 %** |
| Brückenboden | 7 px unter dem Bildrand | sichtbar bei y 279, 37 px Luft |
| Steuerung und Reiter | vollständig außerhalb des Bildes | sichtbar |
| Seitenrand | 12 px | **0** |

**Die Ursache:** Die Leinwand richtete sich allein nach der *Breite*
(`width: 100%; height: auto`). Bei 2,4 : 1 wird sie auf 915 px Breite
381 px hoch — mehr, als nach Kopfzeile (30 px), Steuerung (73 px) und
Reiterleiste (28 px) übrig war. Der Rest lief unten aus dem Bild.

**Die Lösung:** Quer legen sich Kopfzeile und Steuerung *auf* die Szene
statt über und unter sie, jeweils mit einem weichen Verlauf als
Untergrund. Draußen bleibt nur die schmale Reiterleiste. Die Leinwand
richtet sich mit `object-fit: contain` nach Breite **und** Höhe, wird
also nie abgeschnitten und nie verzerrt. Dazu: kein Seitenrand, keine
abgerundeten Ecken, keine Schlagschatten — randlos bis an die Kanten.

Die Steuerung liegt über dem Burggraben, wo es nichts anzuklicken gibt;
der Brückenboden bleibt in jedem geprüften Format frei. Sie wurde quer
zusätzlich kompakter gesetzt (75 → 66 px), damit das auch auf sehr
flachen Bildschirmen gilt — bei 900 × 340 bleiben 18 px Luft.

**Hochkant** war schon vorher heil, hatte aber einen unschönen Rest von
429 px unter dem Spiel. Szene und Steuerung stehen jetzt mittig (199 px
oben, 199 px unten), und darunter steht ein Hinweis: „Quer halten — dann
füllt das Schlachtfeld den Bildschirm." Bei 2,4 : 1 Szene auf 1 : 2,2
Bildschirm ist mehr als ein Fünftel Höhe rechnerisch nicht drin.

**Geprüft:** 915 × 412, 900 × 340, 390 × 844 und 1280 × 880 gemessen;
Bildpunkte der Leinwand ausgelesen (Planken `#32271a` bei y 147–150,
Abgrund darunter); Händler- und Artefaktseite kommen unter der
schwebenden Kopfzeile hervor; am Schreibtisch ist nichts verändert
(Kopf und Steuerung stehen still, Rundung und Rand wie zuvor,
Marktschreier sichtbar, Reiterleiste aus). Keine Konsolenmeldung.


## 0.8.1 — 28.08.2026

Kein neuer Spielinhalt. Diese Fassung holt die Pruefungen nach, die seit dem
grossen Umbau nicht mehr liefen — und dabei kamen zwei echte Fehler heraus.

### Die Pruefwerkzeuge laufen wieder

`pruefe-wirtschaft.mjs` und `balance.mjs` kannten noch Blut und Schrott als
Waehrungen, die drei gestrichenen Klick-Spielarten und Waren, die es nicht
mehr gibt. Sie starteten seit 0.7.0 gar nicht mehr. Jetzt pruefen sie die
heutigen Regeln: eine Waehrung, ein Klick, Wellenskalierung, Bosswellen,
Schadensarten und die Artefaktwirkung.

**2.203 Pruefungen, 0 Fehler.**

### Neu: `pruefe-artefakte.mjs`

Das Artefaktsystem war bis jetzt ungeprueft. Das neue Skript setzt den
Zufall auf einen festen Startwert — derselbe Wurf ergibt also immer dasselbe
Artefakt, und ein Fehlschlag ist nachstellbar. Geprueft werden Seltenheits-
verteilung ueber die Wellen, Bossgarantie, Gueteskalierung, Affix-Regeln,
das Ableiten der Tags, die Regalsumme und das Retten beschaedigter
Spielstaende.

**15.108 Pruefungen, 0 Fehler.**

### Zwei gefundene Fehler

**1. Der Balance-Rechner blieb ab Welle 2 stehen — seit Monaten.**
Er reichte an `muenzeAufsammeln()` eine Zahl, wo die Funktion das ganze
Werte-Objekt erwartet. Innen wurde daraus `undefined`, und das Gold des
Spielers wurde stillschweigend `NaN`. Danach war jeder Preisvergleich falsch,
der Einkauf kaufte endlos weiter, und das Werkzeug haengte sich auf. Der
Fehler stammt nicht aus dem Umbau — er stand schon vorher so da und ist
niemandem aufgefallen, weil das Werkzeug ohnehin nicht mehr startete.

**2. Ein schwarzes Loch auf dem Handy.**
Auf 375 x 812 Bildpunkten gemessen: Die Buehne dehnte sich auf 689 Pixel,
darin die Leinwand mit 147 und die Steuerung mit 147 — dazwischen
**395 Pixel schwarzes Nichts** mitten auf dem Bildschirm. Es sah aus wie ein
Ladefehler. Ursache: Die Szene ist mit 480 x 200 breiter als hoch, auf einem
Hochkant-Handy also nur 147 Pixel hoch, waehrend die Buehne trotzdem alles
fuellen wollte. Behoben; am Desktop aendert sich nichts.

### Geprueft

Alle 21 Module syntaktisch fehlerfrei. Im Browser am Handyformat
durchgespielt: alle drei Reiter erreichbar und gefuellt, Haendlerseite
scrollt bis Malvina, Regal mit fuenf Fassungen und Lager 0/20 vorhanden,
Welle gestartet und beendet, Spielstand ueberlebt das Neuladen. Keine
Konsolenmeldung, weder am Handy noch am Desktop.

### Offen

- **Das Gleichgewicht stimmt noch nicht.** Der Balance-Rechner kommt ueber
  30 Wellen nur bis Welle 7: vier Niederlagen, Kapazitaet bleibt bei 3, nur
  ein Zauber wird gelernt, das Gold reicht nie. Zwei Urteile stehen auf
  "nein". Die Zahlen liegen jetzt vor — die Entscheidung, an welcher
  Schraube gedreht wird, steht aus.
- **Der Platz auf dem Handy ist noch nicht genutzt.** Unter der Karte
  bleiben rund 400 Pixel leer, weil eine 2,4:1-Szene ein Hochformat nicht
  fuellen kann. Was dort stehen soll, ist eine Gestaltungsfrage.
- Kein Ton.

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
