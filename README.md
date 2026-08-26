# Slay'Em All!

Ein Idle-Spiel aus der Seitenansicht: Zugbrücke links, Burgtor rechts, dazwischen ein
stetiger Strom tapferer Recken. Sie gehen hinein. Was herauskommt, kommt einzeln.

Es gibt keine Niederlage. Das Böse in der Burg gewinnt grundsätzlich — die einzige Frage
ist, wie schnell und wie viele.

## Spielen

`index.html` im Browser öffnen. Eine Datei, keine Abhängigkeiten, kein Build-Schritt.
Läuft auch direkt über GitHub Pages (Settings → Pages → Branch `main`, Ordner `/`).

## Was passiert

- **Zulauf** — Recken kommen von links über die Zugbrücke und verschwinden im glühenden Torbogen.
- **Gemetzel** — der Kampf bleibt unsichtbar. Sichtbar sind Arme, Beine, Rümpfe, rollende Helme,
  Schädel, die in den Burggraben plumpsen, und Blutlachen, die auf den Planken liegen bleiben
  und in die Tiefe tropfen.
- **Bestiarium** — mit steigender Zahl an Erledigten kommen stärkere Klassen dazu:
  Bauer → Söldner → Ritter → Paladin → Großmeister.
- **Ausbau** — die Burg kauft selbst ein: Lockrufe, scharfe Klingen, breiteres Tor,
  fettere Beute, Kobold-Diener. Der Durchsatz steigt endlos, das Tor kennt irgendwann keine Pausen mehr.
- **Marktschreier** — ein Nachrichten-Laufband kommentiert jeden Toten in gereimten Zweizeilern.
- **Währungen** — Blut, Knochen, Schrott.

Der Spielstand liegt in `localStorage` unter `burgtor.scene.v1` und läuft beim Neuladen weiter.

## Struktur

```
index.html    das komplette Spiel, selbstständig
```

## Lizenz

Noch keine gewählt.
