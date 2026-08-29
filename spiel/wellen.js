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
//
// Jede zehnte Welle ist eine Bosswelle: halbes Gefolge plus ein Boss,
// der als Letzter anrückt. Erreicht er das Tor, ist die Burg sofort
// verloren — er muss auf der Brücke sterben.

import { MASSE } from './masse.js';
import { klang } from './klang.js';
import { buehneRaeumen } from './welt.js';
import { RECKEN } from './daten/recken.js';
import { bossName } from './daten/bosse.js';
import {
  wellenStaerke, rueckfall, verfuegbareKlassen, klassenGewichte, istBosswelle
} from '../werkzeuge/wirtschaft.mjs';

/** Wie lange die Dämmerung zwischen zwei Phasen dauert. */
const DAEMMERUNG = 1.1;

/** Nach so vielen Sekunden Nacht startet das Morgenritual die Welle. */
export const RITUAL_WARTEZEIT = 22;

/**
 * Die nächste Welle vorab auslosen.
 *
 * Früher würfelte jeder Spawn seine Klasse erst im Moment des Erscheinens.
 * Jetzt steht die ganze Aufstellung fest, bevor die Welle beginnt — nur so
 * kann das Nachtlager ehrlich ankündigen, was kommt. Die Liste liegt im
 * Zustand und überlebt damit auch ein Neuladen.
 */
export function welleAuslosen(zustand) {
  const anzahl = wellenStaerke(zustand.welle);
  const moeglich = verfuegbareKlassen(RECKEN, zustand.welle);
  const gewichte = klassenGewichte(moeglich, zustand.welle);
  const summe = gewichte.reduce((a, b) => a + b, 0);

  const liste = [];
  for (let i = 0; i < anzahl; i++) {
    let wurf = Math.random() * summe;
    let gewaehlt = moeglich[moeglich.length - 1];
    for (let j = 0; j < moeglich.length; j++) {
      wurf -= gewichte[j];
      if (wurf <= 0) { gewaehlt = moeglich[j]; break; }
    }
    liste.push(gewaehlt.id);
  }
  zustand.anstehend = liste;
  zustand.anstehenderBoss = istBosswelle(zustand.welle) ? bossName() : null;
  return liste;
}

/** Die Klasse, aus der der Boss dieser Welle gebaut wird: der höchste Rang. */
export function bossKlasse(welle) {
  const moeglich = verfuegbareKlassen(RECKEN, welle);
  return moeglich[moeglich.length - 1] || RECKEN[0];
}

function phaseSetzen(szene, phase) {
  szene.phase = phase;
  szene.daemmerung = DAEMMERUNG;
}

export function welleStarten(welt) {
  klang('welleStart');
  const { zustand, szene } = welt;
  if (szene.phase !== 'nacht') return false;

  phaseSetzen(szene, 'tag');
  if (!zustand.anstehend.length) welleAuslosen(zustand);
  szene.spawnListe = zustand.anstehend.slice();
  szene.spawnBoss = zustand.anstehenderBoss;
  // Der Boss zählt als eigener Auftritt und kommt als Letzter.
  szene.wellenGroesse = szene.spawnListe.length + (szene.spawnBoss ? 1 : 0);
  zustand.anstehend = [];
  zustand.anstehenderBoss = null;
  szene.erschienen = 0;
  szene.naechsterRecke = 0.9;
  szene.nachtzeit = 0;

  const bossWelle = !!szene.spawnBoss;
  szene.spruchband = {
    text: bossWelle ? 'BOSSWELLE ' + zustand.welle : 'WELLE ' + zustand.welle,
    unter: bossWelle ? szene.spawnBoss + ' führt an' : szene.wellenGroesse + ' Recken im Anmarsch',
    farbe: bossWelle ? '#e0b64f' : '#ff9a4a', zeit: 0, dauer: bossWelle ? 4 : 3
  };
  zustand.phase = 'tag';
  return true;
}

export function welleGewonnen(welt) {
  klang('welleGeschafft');
  const { zustand, szene } = welt;
  phaseSetzen(szene, 'nacht');
  szene.nachtzeit = 0;
  szene.spruchband = {
    text: 'WELLE ' + zustand.welle + ' ÜBERSTANDEN',
    unter: 'Nachtlager — Beute einsammeln und aufrüsten',
    farbe: '#9184d9', zeit: 0, dauer: 4
  };
  zustand.welle += 1;
  zustand.phase = 'nacht';
  welleAuslosen(zustand);
}

/**
 * Die Burg ist überrannt.
 *
 * Die bereits verschluckten Recken kommen wieder heraus und fliehen nach
 * links — sonst verschwänden sie kommentarlos, und der Spieler sähe nicht,
 * dass er die Beute tatsächlich verliert.
 */
export function welleVerloren(welt) {
  klang('verloren');
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
      maxLp: opfer.maxLp || opfer.klasse.lp,
      zustand: 'flieht',
      getroffen: 0,
      wartet: false,
      // Ein Boss steht hier nie: Betritt er das Tor, ist die Welle
      // sofort vorbei, er wird also nie verschluckt.
      groesse: opfer.groesse || 1
    });
  }
  szene.imTor = [];
  szene.pranke = null;
  szene.flamme = null;
  szene.meteorZeit = 0;
  szene.donnerBereit = false;

  szene.spruchband = {
    // Zwei Arten zu verlieren, zwei Meldungen: überfüllt oder
    // durchgelassen. Die zweite ist die neue — ein Boss, der das Tor
    // erreicht, beendet die Welle auf der Stelle.
    text: szene.bossDurch ? 'DER BOSS IST DURCH' : 'DIE BURG IST ÜBERRANNT',
    unter: szene.bossDurch
      ? szene.bossDurch + ' hat das Tor erreicht — zurück zu Welle ' + ziel
      : 'Das Monster ist bezwungen — zurück zu Welle ' + ziel,
    farbe: '#c1444f', zeit: 0, dauer: 4.5
  };
  szene.bossDurch = null;
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
  welleAuslosen(zustand);
}
