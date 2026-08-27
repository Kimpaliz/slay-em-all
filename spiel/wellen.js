// Tag, Nacht und die Niederlage.
//
// Der Ablauf ist ein Kreis mit einer Abkürzung:
//
//   Nacht ──[Welle starten]──▶ Tag ──[alle tot]──▶ Nacht (Welle + 1)
//                              │
//                              └──[Burg überfüllt]──▶ Niederlage ──▶ Nacht
//                                                     (Welle − 5)
//
// Verloren wird nicht durch Schaden, sondern durch Stau: Passen mehr
// Recken gleichzeitig ins Tor, als die Burg fasst, ist das Monster
// überfordert. Deshalb ist "Tiefere Hallen" bei Grommsch der eigentliche
// Verteidigungskauf und nicht bloß ein Durchsatzkauf.

import { MASSE } from './masse.js';
import { buehneRaeumen } from './welt.js';
import { melden } from './marktschreier.js';
import { WELLE_GESCHAFFT, WELLE_VERLOREN, ausListe } from './daten/texte.js';
import { wellenStaerke, rueckfall } from '../werkzeuge/wirtschaft.mjs';

/** Wie lange die Dämmerung zwischen zwei Phasen dauert. */
const DAEMMERUNG = 1.1;

/** Nach so vielen Sekunden Nacht startet das Morgenritual die Welle. */
export const RITUAL_WARTEZEIT = 22;

function phaseSetzen(szene, phase) {
  szene.phase = phase;
  szene.daemmerung = DAEMMERUNG;
}

export function welleStarten(welt) {
  const { zustand, szene } = welt;
  if (szene.phase !== 'nacht') return false;

  phaseSetzen(szene, 'tag');
  szene.wellenGroesse = wellenStaerke(zustand.welle, zustand.stufenP.lockruf);
  szene.erschienen = 0;
  szene.naechsterRecke = 0.9;
  szene.nachtzeit = 0;
  szene.spruchband = {
    text: 'WELLE ' + zustand.welle,
    unter: szene.wellenGroesse + ' Recken im Anmarsch',
    farbe: '#ff9a4a', zeit: 0, dauer: 3
  };
  melden(szene, ausListe([
    'Welle ' + zustand.welle + '! Frisches Fleisch im Anmarsch!',
    'Tor auf! Welle ' + zustand.welle + ' will Ruhm — wir nehmen den Rest!'
  ]));
  zustand.phase = 'tag';
  return true;
}

export function welleGewonnen(welt) {
  const { zustand, szene } = welt;
  phaseSetzen(szene, 'nacht');
  szene.nachtzeit = 0;
  szene.spruchband = {
    text: 'WELLE ' + zustand.welle + ' ÜBERSTANDEN',
    unter: 'Nachtlager — Beute einsammeln und aufrüsten',
    farbe: '#9184d9', zeit: 0, dauer: 4
  };
  melden(szene, ausListe(WELLE_GESCHAFFT));
  zustand.welle += 1;
  zustand.phase = 'nacht';
}

/**
 * Die Burg ist überrannt.
 *
 * Die bereits verschluckten Recken kommen wieder heraus und fliehen nach
 * links — sonst verschwänden sie kommentarlos, und der Spieler sähe nicht,
 * dass er die Beute tatsächlich verliert.
 */
export function welleVerloren(welt) {
  const { zustand, szene } = welt;
  const ziel = rueckfall(zustand.welle);

  phaseSetzen(szene, 'niederlage');
  szene.niederlageZeit = 0;
  for (const r of szene.recken) r.zustand = 'flieht';
  for (const opfer of szene.imTor) {
    szene.recken.push({
      id: szene.naechsteId++,
      klasse: opfer.klasse,
      name: opfer.name,
      x: MASSE.TOR_LINKS - 2 - Math.random() * 6,
      phase: Math.random() * 6.28,
      tempo: opfer.klasse.tempo * 1.4,
      lp: opfer.lp,
      maxLp: opfer.klasse.lp,
      zustand: 'flieht',
      getroffen: 0,
      wartet: false
    });
  }
  szene.imTor = [];
  szene.pranke = null;
  szene.flamme = null;
  szene.meteorZeit = 0;
  szene.donnerBereit = false;

  szene.spruchband = {
    text: 'DIE BURG IST ÜBERRANNT',
    unter: 'Das Monster ist bezwungen — zurück zu Welle ' + ziel,
    farbe: '#c1444f', zeit: 0, dauer: 4.5
  };
  melden(szene, ausListe(WELLE_VERLOREN));
  zustand.welle = ziel;
  zustand.phase = 'niederlage';
}

/** Die Niederlage ist abgespielt — zurück ins Nachtlager. */
export function niederlageBeenden(welt) {
  const { zustand, szene } = welt;
  buehneRaeumen(szene);
  phaseSetzen(szene, 'nacht');
  szene.nachtzeit = 0;
  zustand.phase = 'nacht';
}
