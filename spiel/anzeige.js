// Die Brücke zwischen Spielzustand und Bedienoberfläche.
//
// Zwei getrennte Aufgaben, mit Absicht getrennt gehalten:
//
//   `aufbauen()`  erzeugt die Knöpfe einmal aus den Datentabellen. Wer
//                 eine Ware ergänzt, ergänzt sie in `wirtschaft.mjs` —
//                 im HTML steht nur die leere Liste.
//   `auffrischen()` schreibt Zahlen und Zustände in die vorhandenen
//                 Elemente. Es erzeugt nichts und wirft nichts weg,
//                 sonst verlöre ein gerade gedrückter Knopf den Fokus.
//
// Geschrieben wird nur, was sich geändert hat. Bei 60 Bildern je Sekunde
// wäre blindes Setzen von `textContent` messbar teuer — und der Browser
// würde jedes Mal neu umbrechen.

import {
  WAREN_GROMMSCH, WAREN_PIPS, ZAUBER, RITUAL_PREIS,
  werte as werteAus, wellenStaerke, zauberWerte, ausbauPreis, zahl
} from '../werkzeuge/wirtschaft.mjs';
import { ACHSEN, wareZustand } from './handel.js';
import { symbolZeichnen } from './portraets.js';
import { RITUAL_WARTEZEIT } from './wellen.js';

/** Ab dieser Breite gilt die Seite als schmal. */
const SCHMAL_BREITE = 820;
const SCHMAL_HOEHE = 640;

export function anzeigeAnlegen(wurzel, rueckrufe) {
  const feld = {};
  for (const el of wurzel.querySelectorAll('[data-feld]')) feld[el.dataset.feld] = el;

  const listen = {};
  for (const el of wurzel.querySelectorAll('[data-liste]')) listen[el.dataset.liste] = el;

  const knoepfe = {};
  for (const el of wurzel.querySelectorAll('[data-knopf]')) knoepfe[el.dataset.knopf] = el;

  const seiten = wurzel.querySelector('[data-seiten]');
  const reiterKnoepfe = [...wurzel.querySelectorAll('[data-reiterknopf]')];

  const letzte = {};
  let zauberLeisteStand = '';
  let neustartScharf = false;
  let neustartUhr = null;

  /* ---------- Aufbau ---------- */

  const warenZeilen = { grommsch: [], pips: [] };

  function warenAufbauen(name, waren, kaufen) {
    const liste = listen[name];
    if (!liste) return;
    liste.textContent = '';
    for (const ware of waren) {
      const li = document.createElement('li');
      li.className = 'ware';

      const text = document.createElement('div');
      text.className = 'ware-text';
      const titel = document.createElement('div');
      titel.className = 'ware-name';
      titel.textContent = ware.name;
      const unter = document.createElement('div');
      unter.className = 'ware-beschreibung';
      unter.textContent = ware.text;
      text.append(titel, unter);

      const knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.className = 'ware-knopf';
      knopf.addEventListener('click', () => kaufen(ware.k));

      li.append(text, knopf);
      liste.append(li);
      warenZeilen[name].push({ ware, titel, knopf });
    }
  }

  const zauberZeilen = [];

  function zauberAufbauen() {
    const liste = listen.malvina;
    if (!liste) return;
    liste.textContent = '';

    for (const z of ZAUBER) {
      const li = document.createElement('li');
      li.className = 'ware ware-zauber';

      const kopf = document.createElement('div');
      kopf.className = 'ware-kopf';
      const text = document.createElement('div');
      text.className = 'ware-text';
      const titel = document.createElement('div');
      titel.className = 'ware-name';
      titel.textContent = z.name;
      const unter = document.createElement('div');
      unter.className = 'ware-beschreibung';
      text.append(titel, unter);

      const knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.className = 'ware-knopf';
      knopf.addEventListener('click', () => rueckrufe.zauberLernen(z.k));
      kopf.append(text, knopf);

      const achsen = document.createElement('div');
      achsen.className = 'achsen';
      const achsKnoepfe = ACHSEN.map((a) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'achse';
        b.addEventListener('click', () => rueckrufe.zauberVerbessern(z.k, a.k));
        achsen.append(b);
        return { achse: a, knopf: b };
      });

      li.append(kopf, achsen);
      liste.append(li);
      zauberZeilen.push({ zauber: z, unter, knopf, achsen, achsKnoepfe });
    }

    // Das Morgenritual steht bei Malvina, ist aber kein Zauber mit Achsen.
    const li = document.createElement('li');
    li.className = 'ware';
    const text = document.createElement('div');
    text.className = 'ware-text';
    const titel = document.createElement('div');
    titel.className = 'ware-name';
    titel.textContent = 'Morgenritual';
    const unter = document.createElement('div');
    unter.className = 'ware-beschreibung';
    text.append(titel, unter);
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'ware-knopf';
    knopf.addEventListener('click', () => rueckrufe.ritual());
    li.append(text, knopf);
    listen.malvina.append(li);
    zauberZeilen.ritual = { unter, knopf };
  }

  warenAufbauen('grommsch', WAREN_GROMMSCH, (k) => rueckrufe.kaufGrommsch(k));
  warenAufbauen('pips', WAREN_PIPS, (k) => rueckrufe.kaufPips(k));
  zauberAufbauen();

  /* ---------- Knöpfe ---------- */

  if (knoepfe.welle) knoepfe.welle.addEventListener('click', () => rueckrufe.welleStarten());
  if (knoepfe.neustart) {
    knoepfe.neustart.addEventListener('click', () => {
      if (neustartScharf) {
        clearTimeout(neustartUhr);
        neustartScharf = false;
        knoepfe.neustart.textContent = 'Neustart';
        knoepfe.neustart.classList.remove('scharf');
        rueckrufe.neustart();
        return;
      }
      // Zweistufig, weil ein versehentlicher Klick alles kostet.
      neustartScharf = true;
      knoepfe.neustart.textContent = 'Wirklich?';
      knoepfe.neustart.classList.add('scharf');
      neustartUhr = setTimeout(() => {
        neustartScharf = false;
        knoepfe.neustart.textContent = 'Neustart';
        knoepfe.neustart.classList.remove('scharf');
      }, 3000);
    });
  }

  reiterKnoepfe.forEach((b) => {
    b.addEventListener('click', () => seiteZeigen(Number(b.dataset.reiterknopf)));
  });

  function seiteZeigen(i) {
    if (!seiten) return;
    seiten.scrollTo({ left: i * seiten.clientWidth, behavior: 'smooth' });
    reiterKnoepfe.forEach((b, j) => b.classList.toggle('aktiv', i === j));
  }

  if (seiten) {
    seiten.addEventListener('scroll', () => {
      const i = seiten.scrollLeft > seiten.clientWidth * 0.4 ? 1 : 0;
      reiterKnoepfe.forEach((b, j) => b.classList.toggle('aktiv', i === j));
    }, { passive: true });
  }

  /* ---------- Auffrischen ---------- */

  function setzen(name, wert) {
    if (letzte[name] === wert) return;
    letzte[name] = wert;
    if (feld[name]) feld[name].textContent = wert;
  }

  function zauberLeisteAufbauen(zustand) {
    const leiste = listen.zauber;
    if (!leiste) return;
    leiste.textContent = '';
    for (const z of ZAUBER) {
      if (zustand.zauber[z.k].gelernt < 1) continue;
      const knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.className = 'zauberknopf';
      knopf.dataset.zauber = z.k;
      knopf.title = z.name + ' (Taste ' + z.taste + ') — ' + z.lang;

      const symbol = document.createElement('canvas');
      symbol.width = 16;
      symbol.height = 16;
      symbol.className = 'zaubersymbol';
      symbolZeichnen(symbol, z.k);

      const decke = document.createElement('span');
      decke.className = 'zauberdecke';
      const taste = document.createElement('span');
      taste.className = 'zaubertaste';
      taste.textContent = z.taste;

      knopf.append(symbol, decke, taste);
      knopf.addEventListener('click', () => rueckrufe.zauberAusloesen(z.k));
      leiste.append(knopf);
    }
  }

  return {
    /** Wird jeden Bildschritt aufgerufen, schreibt aber nur Geändertes. */
    auffrischen(welt) {
      const { zustand, szene } = welt;
      const w = werteAus(zustand.stufenG, zustand.stufenP);

      setzen('blut', zahl(zustand.blut));
      setzen('gold', zahl(zustand.gold));
      setzen('schrott', zahl(zustand.schrott));
      setzen('welle', 'Welle ' + zustand.welle);

      // Phase und Lagebericht
      let phase;
      let lage;
      let wellenText;
      let wellenAus = true;
      const uebrig = Math.max(0, szene.wellenGroesse - szene.erschienen)
        + szene.recken.filter((r) => r.zustand !== 'flieht').length;

      if (szene.phase === 'tag') {
        phase = 'Tag — Welle ' + zustand.welle;
        lage = 'Noch ' + uebrig + ' Recken · Burg ' + szene.imTor.length + '/' + w.kapazitaet;
        wellenText = 'Welle läuft…';
      } else if (szene.phase === 'niederlage') {
        phase = 'Die Burg fällt';
        lage = 'Rückzug der Recken …';
        wellenText = 'Welle läuft…';
      } else {
        phase = 'Nacht — Lager';
        lage = 'Bereit: ' + wellenStaerke(zustand.welle, zustand.stufenP.lockruf)
          + ' Recken · Burg fasst ' + w.kapazitaet;
        const ritualLaeuft = zustand.ritual >= 1 && zustand.ritualAn;
        const rest = Math.max(0, Math.ceil(RITUAL_WARTEZEIT - szene.nachtzeit));
        wellenText = 'Welle ' + zustand.welle + ' starten' + (ritualLaeuft ? ' (' + rest + ' s)' : '');
        wellenAus = false;
      }
      setzen('phase', phase);
      setzen('lage', lage);
      setzen('wellenknopf', wellenText);
      if (knoepfe.welle) {
        if (knoepfe.welle.textContent !== wellenText) knoepfe.welle.textContent = wellenText;
        knoepfe.welle.disabled = wellenAus;
      }

      setzen('spruchGrommsch', '»' + welt.sprueche.grommsch + '«');
      setzen('spruchPips', '»' + welt.sprueche.pips + '«');
      setzen('spruchMalvina', '»' + welt.sprueche.malvina + '«');

      warenAuffrischen('grommsch', zustand.stufenG, zustand.schrott);
      warenAuffrischen('pips', zustand.stufenP, zustand.gold);
      zauberAuffrischen(zustand);

      // Die Aktionsleiste wird nur neu gebaut, wenn ein Zauber dazukommt.
      const stand = ZAUBER.map((z) => zustand.zauber[z.k].gelernt).join('');
      if (stand !== zauberLeisteStand) {
        zauberLeisteStand = stand;
        zauberLeisteAufbauen(zustand);
      }
      zauberLeisteAuffrischen(welt, w);

      if (feld.zauberHinweis) {
        const zeigen = zauberLeisteStand.indexOf('1') < 0;
        feld.zauberHinweis.hidden = !zeigen;
      }
    },

    /** Schmale Bildschirme bekommen zwei Wischseiten. */
    breiteMessen() {
      const breite = window.innerWidth || 1200;
      const hoehe = window.innerHeight || 800;
      const schmal = breite < SCHMAL_BREITE || (hoehe < SCHMAL_HOEHE && breite < 1180);
      wurzel.classList.toggle('schmal', schmal);
      return schmal;
    }
  };

  function warenAuffrischen(name, stufen, waehrung) {
    for (const zeile of warenZeilen[name]) {
      const z = wareZustand(zeile.ware, stufen);
      const beschriftung = z.voll ? 'MAX' : zahl(z.preis);
      if (zeile.knopf.textContent !== beschriftung) zeile.knopf.textContent = beschriftung;
      const aus = z.voll || z.gesperrt || waehrung < z.preis;
      if (zeile.knopf.disabled !== aus) zeile.knopf.disabled = aus;

      const stufenText = z.voll ? 'MAX' : z.stufe > 0 ? 'St. ' + z.stufe : '';
      const titel = zeile.ware.name + (stufenText ? ' · ' + stufenText : '');
      if (zeile.titel.textContent !== titel) zeile.titel.textContent = titel;
    }
  }

  function zauberAuffrischen(zustand) {
    for (const zeile of zauberZeilen) {
      const stufe = zustand.zauber[zeile.zauber.k];
      const wert = zauberWerte(zeile.zauber, stufe);
      const gelernt = wert.gelernt;

      const text = gelernt
        ? Math.round(wert.schaden) + ' Schaden · ' + wert.abklingzeit.toFixed(0) + ' s · ' + wert.wirkbereich + ' px'
        : zeile.zauber.kurz;
      if (zeile.unter.textContent !== text) zeile.unter.textContent = text;

      const beschriftung = gelernt ? '✓' : zahl(zeile.zauber.preis);
      if (zeile.knopf.textContent !== beschriftung) zeile.knopf.textContent = beschriftung;
      zeile.knopf.disabled = gelernt || zustand.blut < zeile.zauber.preis;
      zeile.knopf.classList.toggle('gelernt', gelernt);

      zeile.achsen.hidden = !gelernt;
      for (const { achse, knopf } of zeile.achsKnoepfe) {
        const preis = ausbauPreis(zeile.zauber, stufe[achse.k]);
        const beschriftet = achse.zeichen + ' ' + zahl(preis);
        if (knopf.textContent !== beschriftet) knopf.textContent = beschriftet;
        knopf.disabled = zustand.blut < preis;
        knopf.title = achse.name + ' — ' + zahl(preis) + ' Blut (Stufe ' + stufe[achse.k] + ')';
      }
    }

    const r = zauberZeilen.ritual;
    if (!r) return;
    const hat = zustand.ritual >= 1;
    const text = hat
      ? (zustand.ritualAn ? 'Aktiv — Welle startet nachts von selbst' : 'Ruht — Wellen startest du selbst')
      : 'Nächste Welle startet nachts von selbst';
    if (r.unter.textContent !== text) r.unter.textContent = text;
    const beschriftung = hat ? (zustand.ritualAn ? 'Aus' : 'An') : zahl(RITUAL_PREIS);
    if (r.knopf.textContent !== beschriftung) r.knopf.textContent = beschriftung;
    r.knopf.disabled = !hat && zustand.blut < RITUAL_PREIS;
  }

  /**
   * Abklingzeit als Kreisausschnitt über dem Symbol.
   * Er läuft im Uhrzeigersinn ab, wie man es aus anderen Spielen kennt.
   */
  function zauberLeisteAuffrischen(welt, w) {
    void w;
    const { zustand, szene } = welt;
    const leiste = listen.zauber;
    if (!leiste) return;

    for (const knopf of leiste.children) {
      const k = knopf.dataset.zauber;
      const z = ZAUBER.find((e) => e.k === k);
      const wert = zauberWerte(z, zustand.zauber[k]);
      const rest = szene.abklingzeit[k];
      const laeuft = (k === 'pranke' && szene.pranke)
        || (k === 'flamme' && szene.flamme)
        || (k === 'meteor' && szene.meteorZeit > 0);
      const bereit = rest <= 0 && !laeuft && szene.phase === 'tag';
      const scharf = k === 'donner' && szene.donnerBereit;

      knopf.classList.toggle('bereit', bereit && !scharf);
      knopf.classList.toggle('scharf', !!scharf);
      knopf.classList.toggle('laeuft', !!laeuft);

      const decke = knopf.querySelector('.zauberdecke');
      if (!decke) continue;
      const anteil = rest > 0 ? Math.min(1, rest / wert.abklingzeit) : 0;
      const grad = Math.round(anteil * 360);
      const bild = anteil > 0
        ? 'conic-gradient(rgba(6,7,12,0.78) 0deg ' + grad + 'deg, rgba(0,0,0,0) ' + grad + 'deg 360deg)'
        : 'none';
      if (decke.style.backgroundImage !== bild) decke.style.backgroundImage = bild;
      const beschriftung = rest > 0 ? String(Math.ceil(rest)) : scharf ? '◎' : '';
      if (decke.textContent !== beschriftung) decke.textContent = beschriftung;
    }
  }
}
