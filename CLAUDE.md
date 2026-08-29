# Arbeitsanweisung für dieses Repository

Diese Datei wird beim Start automatisch gelesen. Sie gilt für jede
Sitzung, die an „Slay'Em All!" arbeitet.

## Vor jeder Änderung: hier nachschauen

**Erst lesen, dann anfassen.** In dieser Reihenfolge:

1. **`CHANGELOG.md`** — die Patchnotes. Was zuletzt passiert ist, was
   bewusst so entschieden wurde und was dabei schiefging. Der jüngste
   Eintrag steht oben.
2. **`docs/ENTWURF.md`** — die Design-Arbeitsgrundlage. Was beschlossen
   ist, was Vorschlag ist, und welche Fragen offen sind.
3. **`README.md`** — Aufbau des Spiels und wie man es startet.

Der Chatverlauf ist **nicht** die Quelle der Wahrheit. Das Repository
ist es. Wer ohne diesen Blick loslegt, baut gegen Entscheidungen, die
schon gefallen sind.

## Nach jeder Änderung: hier eintragen

**Jede Änderung wird notiert.** Ohne Ausnahme, auch die kleinen.

- Ein Eintrag in **`CHANGELOG.md`**, ganz oben, unter einer neuen
  Fassungsnummer mit Datum.
- Der Eintrag sagt **was** sich geändert hat, **warum**, und **womit es
  geprüft wurde**. Gemessene Zahlen gehören dazu — „schneller" ist keine
  Angabe, „von 145 auf 49 Punkte" schon.
- Ging etwas schief oder wurde ein Fehler gefunden: **auch das steht
  drin**, samt Ursache. Die Protokolle sollen ehrlich sein, nicht
  schmeichelhaft.
- Die Fassungsnummer in **`package.json`** wird mitgezogen.
- Der Commit-Text wiederholt den Kern des Eintrags.

## Wie geprüft wird

Vor jedem Commit:

```bash
node werkzeuge/pruefe-wirtschaft.mjs
```

```bash
node werkzeuge/pruefe-artefakte.mjs
```

```bash
node werkzeuge/pruefe-simulation.mjs
```

```bash
node werkzeuge/balance.mjs 30
```

Dazu **jedes Modul einmal wirklich laden**, nicht nur die Syntax prüfen
— `node --check` löst Importe nicht auf und übersieht deshalb tote
Importe:

```bash
for f in spiel/*.js spiel/daten/*.js; do node -e "import('./$f').catch(e=>{console.log('$f',e.message);process.exit(1)})"; done
```

**Und am Handy nachmessen, nicht nur am Schreibtisch.** In 0.11.0 wurde
das versäumt; zwei Fehler machten die Seite auf dem Telefon unbenutzbar
und fielen erst auf, als Jannik es meldete. Ein Fenster von 916 × 412
hätte beide gefunden.

## Werkbank-Exporte

**`Heldenschlacht Burg-Idle.zip` und andere Werkbank-Exporte werden
nicht eingespielt.** Sie sind Parallelzweige aus derselben Wurzel und
überschreiben beim Einspielen den Stand von `main`. Am 29.08.2026 ist
genau das einmal passiert (Export 0.8.0 ersetzte 0.14.1) und wurde nach
einer Stunde zurückgerollt. Wenn Jannik einen Export einspielen lassen
will: **erst nachfragen**, ob wirklich der ganze Zweig gemeint ist —
und vorher immer ein Rückhol-Etikett auf den aktuellen Stand setzen.

## Grenzen

- Keine fremden Dateien zur Laufzeit. Keine Schriften, Bilder, Skripte
  oder Töne von fremden Servern. Was gebraucht wird, liegt im
  Repository oder wird gerechnet.
- Keine Abhängigkeiten. Das Spiel läuft ohne Baukasten und ohne
  Installation.
- Deutsche Bezeichner im Code, deutsche Kommentare mit echten Umlauten.
- Die Simulation hängt nie am Zeichnen. `spiel/simulation.js` darf
  nichts aus `spiel/szene.js` importieren.
