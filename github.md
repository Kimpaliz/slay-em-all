repo: Kimpaliz/slay-em-all
branch: main

## Last sync

date: 2026-08-28T06:10:00Z
commit: (unbekannt — nur der Baum-Hash ef76f45d5238 war abrufbar)

### Updated in this project

- Repo-Stand 0.6.0 vollständig hereingeholt (24 Module, kein React); `werkzeuge/wirtschaft.mjs` von Hand nachgetragen, weil `.mjs` beim Kopieren nicht mitkommt.
- **0.7.0** nach `docs/ENTWURF.md`: eine Währung (Gold), Klick-Spielarten und drei Pips-Waren gestrichen, Werte ×10, fünf Schadensarten, passive Wellenskalierung, Bosswellen, Rauchpartikel.
- **0.8.0**: Artefakte komplett — dritter Reiter, Regal (5) und Lager (20), Generator mit austauschbarem Zufall, 15 Affixe plus 5 legendäre, Drops, Schatzjäger.
- Damit ist `docs/ENTWURF.md` vollständig umgesetzt; die Prüfskripte fehlen.

## Screen map

| Bereich | Dateien im Projekt |
| --- | --- |
| Regeln, Preise, Skalierung, Bosswerte | `werkzeuge/wirtschaft.mjs` |
| Artefakte (Logik und Symbol) | `spiel/artefakte.js`, `spiel/artefakt-bild.js` |
| Zustand und Spielstand | `spiel/welt.js`, `spiel/speicher.js` |
| Ablauf | `spiel/simulation.js`, `spiel/wellen.js`, `spiel/kampf.js`, `spiel/zauber.js`, `spiel/handel.js` |
| Bild | `spiel/szene.js`, `spiel/figuren.js`, `spiel/effekte.js`, `spiel/portraets.js` |
| Bedienung | `spiel/anzeige.js`, `spiel/eingabe.js`, `spiel/marktschreier.js` |
| Daten | `spiel/daten/recken.js`, `spiel/daten/bosse.js`, `spiel/daten/texte.js`, `spiel/daten/paletten.js` |
| Seite | `index.html`, `stil.css` |

## Nicht im Projekt

`werkzeuge/pruefe-wirtschaft.mjs`, `werkzeuge/balance.mjs` und
`werkzeuge/vorschau-server.mjs` liegen im Repo, wurden hier nicht
hereingeholt und sind gegen die neue `wirtschaft.mjs` **nicht nachgezogen**.
`werkzeuge/pruefe-artefakte.mjs` fehlt ganz. Vor dem nächsten Commit
anpassen.
