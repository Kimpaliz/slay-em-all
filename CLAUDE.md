# Arbeitsanweisung für dieses Repository

Diese Datei wird beim Start automatisch gelesen. Sie gilt für jede
Sitzung, die an „Slay'Em All!" arbeitet.

**Maßgeblicher Stand seit dem 29.08.2026:** der Werkbank-Zweig 0.8.x
(Entscheidung Jannik). Der zuvor hier entstandene Zweig 0.9.0–0.14.1
liegt vollständig unter dem Etikett `v0.14.1-eigener-zweig`.

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
node werkzeuge/balance.mjs 30
```

**Stand 29.08.2026:** Beide Skripte stammen vom 0.6.0-Stand und sind
noch nicht an die heutige `wirtschaft.mjs` angepasst — sie nachzuziehen
ist der erste offene Schritt (siehe `docs/UEBERGABE.md`, 5.1). Ein
`pruefe-artefakte.mjs` fehlt und soll neu entstehen; `artefakte.js` hat
dafür austauschbaren Zufall.

Dazu **jedes Modul einmal wirklich laden**, nicht nur die Syntax prüfen
— `node --check` löst Importe nicht auf und übersieht deshalb tote
Importe:

```bash
for f in spiel/*.js spiel/daten/*.js; do node -e "import('./$f').catch(e=>{console.log('$f',e.message);process.exit(1)})"; done
```

**Und am Handy nachmessen, nicht nur am Schreibtisch.** Ein Fenster von
916 × 412 findet, was der Schreibtisch versteckt.

## Grenzen

- Keine fremden Dateien zur Laufzeit. Keine Schriften, Bilder, Skripte
  oder Töne von fremden Servern. Was gebraucht wird, liegt im
  Repository oder wird gerechnet.
- Keine Abhängigkeiten. Das Spiel läuft ohne Baukasten und ohne
  Installation.
- Deutsche Bezeichner im Code, deutsche Kommentare mit echten Umlauten.
- Die Simulation hängt nie am Zeichnen. `spiel/simulation.js` darf
  nichts aus `spiel/szene.js` importieren.
