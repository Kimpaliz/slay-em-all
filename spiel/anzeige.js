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
  WAREN_GROMMSCH, WAREN_PIPS, ZAUBER, RITUAL_PREIS, KLICK, KLICK_VARIANTEN,
  werte as werteAus, wellenStaerke, zauberWerte, ausbauPreis,
  klickWerte, klickAusbauPreis, zahl
} from '../werkzeuge/wirtschaft.mjs';
import { ACHSEN, KLICK_ACHSEN, wareZustand } from './handel.js';
import { symbolZeichnen, waehrungZeichnen } from './portraets.js';
import { RECKEN } from './daten/recken.js';
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
  let vorschauStand = '';
  let neustartScharf = false;
  let neustartUhr = null;

  /* ---------- Der Tooltip ---------- */

  // Ein einziges Popup für alle Knöpfe der Aktionsleiste. Es wird beim
  // Überfahren gefüllt und über dem Knopf ausgerichtet.
  const tipp = document.createElement('div');
  tipp.className = 'zaubertipp';
  tipp.hidden = true;
  wurzel.appendChild(tipp);

  function tippZeile(zeichen, name, basis, bonus, einheit, farbe, bonusGut) {
    const zeile = document.createElement('div');
    zeile.className = 'tipp-zeile';
    const links = document.createElement('span');
    links.className = 'tipp-name';
    links.textContent = zeichen + ' ' + name;
    const rechts = document.createElement('span');
    rechts.className = 'tipp-wert';
    rechts.style.color = farbe;
    rechts.textContent = basis + (einheit || '');
    if (bonus) {
      const plus = document.createElement('span');
      plus.className = 'tipp-bonus' + (bonusGut === false ? ' schlecht' : '');
      plus.textContent = ' ' + bonus;
      rechts.appendChild(plus);
    }
    zeile.append(links, rechts);
    return zeile;
  }

  /**
   * Füllt den Tooltip für einen Zauber oder den Klick.
   *
   * Basiswert und Bonus stehen getrennt: "10 +15" heißt Grundwert 10,
   * dazugekauft 15. So sieht man auf einen Blick, was die Stufen bringen.
   */
  function tippFuellen(k, zustand) {
    tipp.textContent = '';
    const kopf = document.createElement('div');
    kopf.className = 'tipp-kopf';

    if (k === 'klick') {
      const w = klickWerte(zustand.klick);
      const variante = KLICK_VARIANTEN.find((v) => v.k === w.variante);
      kopf.textContent = variante ? variante.name : KLICK.name;
      tipp.appendChild(kopf);
      const beschr = document.createElement('div');
      beschr.className = 'tipp-text';
      beschr.textContent = variante ? variante.text : KLICK.lang;
      tipp.appendChild(beschr);

      const istTitan = w.variante === 'titan';
      const schadenBasis = istTitan ? KLICK.schaden * 8 + 10 : KLICK.schaden;
      const schadenJetzt = istTitan ? w.titanSchaden : w.schaden;
      const abklingBasis = istTitan ? 30 : KLICK.abklingzeit;
      const abklingJetzt = istTitan ? w.titanAbklingzeit : w.abklingzeit;
      tipp.appendChild(tippZeile('⚔', 'Schaden', schadenBasis,
        schadenJetzt > schadenBasis ? '+' + (schadenJetzt - schadenBasis) : '', '', '#ff8a6a'));
      tipp.appendChild(tippZeile('⏱', 'Abklingzeit', abklingBasis.toFixed(1).replace('.', ','),
        abklingJetzt < abklingBasis - 0.01 ? '−' + (abklingBasis - abklingJetzt).toFixed(1).replace('.', ',') + ' s' : '',
        ' s', '#9ecbff'));
      tipp.appendChild(tippZeile('✛', 'Kritisch', Math.round(KLICK.krit * 100) + ' %',
        w.krit > KLICK.krit + 0.001 ? '+' + Math.round((w.krit - KLICK.krit) * 100) + ' %' : '', '', '#ffd08a'));
      if (istTitan) {
        tipp.appendChild(tippZeile('◎', 'Wirkbereich', w.titanBereich, '', ' px', '#d2cefd'));
      }
    } else {
      const z = ZAUBER.find((e) => e.k === k);
      const stufe = zustand.zauber[k];
      const w = zauberWerte(z, stufe);
      kopf.textContent = z.name + '  ·  Taste ' + z.taste;
      tipp.appendChild(kopf);
      const beschr = document.createElement('div');
      beschr.className = 'tipp-text';
      beschr.textContent = z.lang;
      tipp.appendChild(beschr);

      tipp.appendChild(tippZeile('⚔', 'Schaden', z.schaden,
        stufe.schaden > 0 ? '+' + (w.schaden - z.schaden) : '', '', '#ff8a6a'));
      tipp.appendChild(tippZeile('⏱', 'Abklingzeit', z.abklingzeit.toFixed(0),
        stufe.abklingzeit > 0 ? '−' + (z.abklingzeit - w.abklingzeit).toFixed(1).replace('.', ',') + ' s' : '',
        ' s', '#9ecbff'));
      tipp.appendChild(tippZeile('◎', 'Wirkbereich', z.wirkbereich,
        stufe.wirkbereich > 0 ? '+' + (w.wirkbereich - z.wirkbereich) : '', ' px', '#d2cefd'));
    }
  }

  function tippZeigen(knopf, k, zustand) {
    tippFuellen(k, zustand);
    tipp.hidden = false;
    const wr = wurzel.getBoundingClientRect();
    const kr = knopf.getBoundingClientRect();
    const breite = tipp.offsetWidth;
    let links = kr.left - wr.left + kr.width / 2 - breite / 2;
    links = Math.max(6, Math.min(links, wr.width - breite - 6));
    tipp.style.left = links + 'px';
    tipp.style.top = (kr.top - wr.top - tipp.offsetHeight - 8) + 'px';
  }

  /* ---------- Aufbau der Läden ---------- */

  /** Ein Ladenknopf: Währungszeichen plus Preis. */
  function preisKnopf(waehrung) {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'ware-knopf';
    const zeichen = document.createElement('canvas');
    zeichen.width = 10;
    zeichen.height = 10;
    zeichen.className = 'waehrung';
    waehrungZeichnen(zeichen, waehrung);
    const preis = document.createElement('span');
    knopf.append(zeichen, preis);
    return { knopf, zeichen, preis };
  }

  const warenZeilen = { grommsch: [], pips: [] };

  function warenAufbauen(name, waren, waehrung, kaufen) {
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

      const { knopf, zeichen, preis } = preisKnopf(waehrung);
      knopf.addEventListener('click', () => kaufen(ware.k));

      li.append(text, knopf);
      liste.append(li);
      warenZeilen[name].push({ ware, titel, knopf, zeichen, preis });
    }
  }

  const zauberZeilen = [];
  const klickTeile = { achsen: [], varianten: [] };

  /** Eine Zeile im Stil der Zauberwaren, mit Kopf und Achsenreihe. */
  function zauberZeile(liste, titelText, beschrText, waehrung) {
    const li = document.createElement('li');
    li.className = 'ware ware-zauber';
    const kopf = document.createElement('div');
    kopf.className = 'ware-kopf';
    const text = document.createElement('div');
    text.className = 'ware-text';
    const titel = document.createElement('div');
    titel.className = 'ware-name';
    titel.textContent = titelText;
    const unter = document.createElement('div');
    unter.className = 'ware-beschreibung';
    unter.textContent = beschrText;
    text.append(titel, unter);
    const { knopf, zeichen, preis } = preisKnopf(waehrung);
    kopf.append(text, knopf);
    li.append(kopf);
    liste.append(li);
    return { li, kopf, titel, unter, knopf, zeichen, preis };
  }

  function malvinaAufbauen() {
    const liste = listen.malvina;
    if (!liste) return;
    liste.textContent = '';

    // --- Der Klick: erst lernen, dann auf drei Achsen ausbauen ---
    const klick = zauberZeile(liste, KLICK.name, KLICK.kurz, 'blut');
    klick.knopf.addEventListener('click', () => rueckrufe.klickKaufen());
    const klickAchsen = document.createElement('div');
    klickAchsen.className = 'achsen';
    for (const achse of KLICK_ACHSEN) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'achse';
      b.addEventListener('click', () => rueckrufe.klickVerbessern(achse.k));
      klickAchsen.append(b);
      klickTeile.achsen.push({ achse, knopf: b });
    }
    klick.li.append(klickAchsen);
    klickTeile.zeile = klick;
    klickTeile.achsenLeiste = klickAchsen;

    // --- Die drei Spielarten des Klicks ---
    for (const variante of KLICK_VARIANTEN) {
      const zeile = zauberZeile(liste, variante.name, variante.text, 'blut');
      zeile.knopf.addEventListener('click', () => rueckrufe.variante(variante.k));
      klickTeile.varianten.push({ variante, zeile });
    }

    // --- Die vier Zauber ---
    for (const z of ZAUBER) {
      const zeile = zauberZeile(liste, z.name, z.kurz, 'blut');
      zeile.knopf.addEventListener('click', () => rueckrufe.zauberLernen(z.k));
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
      zeile.li.append(achsen);
      zauberZeilen.push({ zauber: z, ...zeile, achsen, achsKnoepfe });
    }

    // --- Das Morgenritual ---
    const ritual = zauberZeile(liste, 'Morgenritual',
      'Nächste Welle startet nachts von selbst', 'blut');
    ritual.knopf.addEventListener('click', () => rueckrufe.ritual());
    zauberZeilen.ritual = ritual;
  }

  warenAufbauen('grommsch', WAREN_GROMMSCH, 'schrott', (k) => rueckrufe.kaufGrommsch(k));
  warenAufbauen('pips', WAREN_PIPS, 'gold', (k) => rueckrufe.kaufPips(k));
  malvinaAufbauen();

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

  /** Preisknopf beschriften: Zeichen + Zahl, oder reiner Text (MAX, ✓, Aus). */
  function preisSetzen(teil, text, ohneZeichen) {
    if (teil.preis.textContent !== text) teil.preis.textContent = text;
    const zeigen = !ohneZeichen;
    if (teil.zeichen.hidden === zeigen) teil.zeichen.hidden = !zeigen;
  }

  function zauberLeisteAufbauen(zustand) {
    const leiste = listen.zauber;
    if (!leiste) return;
    leiste.textContent = '';

    const eintraege = [];
    if (zustand.klick.gekauft >= 1) eintraege.push({ k: 'klick', taste: '', name: KLICK.name });
    for (const z of ZAUBER) {
      if (zustand.zauber[z.k].gelernt >= 1) eintraege.push({ k: z.k, taste: z.taste, name: z.name });
    }

    for (const e of eintraege) {
      const knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.className = 'zauberknopf';
      knopf.dataset.zauber = e.k;

      const symbol = document.createElement('canvas');
      symbol.width = 16;
      symbol.height = 16;
      symbol.className = 'zaubersymbol';
      symbolZeichnen(symbol, e.k);

      const decke = document.createElement('span');
      decke.className = 'zauberdecke';
      const taste = document.createElement('span');
      taste.className = 'zaubertaste';
      taste.textContent = e.taste;

      knopf.append(symbol, decke, taste);
      if (e.k !== 'klick') {
        knopf.addEventListener('click', () => rueckrufe.zauberAusloesen(e.k));
      }
      knopf.addEventListener('mouseenter', () => tippZeigen(knopf, e.k, rueckrufe.zustand()));
      knopf.addEventListener('mouseleave', () => { tipp.hidden = true; });
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
        lage = 'Noch ' + uebrig + ' Recken · Burg ' + szene.imTor.length + '/' + w.kapazitaet
          + ' · frisst ' + Math.min(w.schlund, szene.imTor.length) + '/' + w.schlund;
        wellenText = 'Welle läuft…';
      } else if (szene.phase === 'niederlage') {
        phase = 'Die Burg fällt';
        lage = 'Rückzug der Recken …';
        wellenText = 'Welle läuft…';
      } else {
        phase = 'Nacht — Lager';
        lage = 'Bereit: ' + (zustand.anstehend.length || wellenStaerke(zustand.welle, zustand.stufenP.lockruf))
          + ' Recken · Burg fasst ' + w.kapazitaet + ' · frisst ' + w.schlund + ' zugleich';
        const ritualLaeuft = zustand.ritual >= 1 && zustand.ritualAn;
        const rest = Math.max(0, Math.ceil(RITUAL_WARTEZEIT - szene.nachtzeit));
        wellenText = 'Welle ' + zustand.welle + ' starten' + (ritualLaeuft ? ' (' + rest + ' s)' : '');
        wellenAus = false;
      }
      setzen('phase', phase);
      setzen('lage', lage);
      if (knoepfe.welle) {
        if (knoepfe.welle.textContent !== wellenText) knoepfe.welle.textContent = wellenText;
        knoepfe.welle.disabled = wellenAus;
      }

      vorschauAuffrischen(zustand, szene);

      setzen('spruchGrommsch', '»' + welt.sprueche.grommsch + '«');
      setzen('spruchPips', '»' + welt.sprueche.pips + '«');
      setzen('spruchMalvina', '»' + welt.sprueche.malvina + '«');

      warenAuffrischen('grommsch', zustand.stufenG, zustand.schrott);
      warenAuffrischen('pips', zustand.stufenP, zustand.gold);
      malvinaAuffrischen(zustand);

      // Die Aktionsleiste wird nur neu gebaut, wenn sich ihr Besatz ändert.
      const stand = zustand.klick.gekauft + '|' + ZAUBER.map((z) => zustand.zauber[z.k].gelernt).join('');
      if (stand !== zauberLeisteStand) {
        zauberLeisteStand = stand;
        zauberLeisteAufbauen(zustand);
      }
      zauberLeisteAuffrischen(welt);

      if (feld.zauberHinweis) {
        const zeigen = zauberLeisteStand === '0|0000';
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

  /**
   * Die Nachtvorschau: Welche Recken die nächste Welle bringt.
   * Ein Farbkästchen je Klasse, dazu Name und Anzahl — gebaut nur, wenn
   * sich die Auslosung tatsächlich geändert hat.
   */
  function vorschauAuffrischen(zustand, szene) {
    const el = feld.vorschau;
    if (!el) return;
    const nachts = szene.phase === 'nacht';
    const stand = nachts ? zustand.anstehend.join(',') : '';
    if (stand === vorschauStand) return;
    vorschauStand = stand;

    el.textContent = '';
    if (!nachts || !zustand.anstehend.length) { el.hidden = true; return; }
    el.hidden = false;

    const marke = document.createElement('span');
    marke.className = 'vorschau-marke';
    marke.textContent = 'Gleich kommen:';
    el.appendChild(marke);

    const anzahl = {};
    for (const id of zustand.anstehend) anzahl[id] = (anzahl[id] || 0) + 1;
    for (const klasse of RECKEN) {
      if (!anzahl[klasse.id]) continue;
      const chip = document.createElement('span');
      chip.className = 'vorschau-chip';
      const punkt = document.createElement('span');
      punkt.className = 'vorschau-punkt';
      punkt.style.background = klasse.metall && klasse.helm ? klasse.metall : klasse.rumpf;
      chip.append(punkt, document.createTextNode(anzahl[klasse.id] + '× ' + klasse.name));
      el.appendChild(chip);
    }
  }

  function warenAuffrischen(name, stufen, waehrung) {
    for (const zeile of warenZeilen[name]) {
      const z = wareZustand(zeile.ware, stufen);
      preisSetzen(zeile, z.voll ? 'MAX' : zahl(z.preis), z.voll);
      const aus = z.voll || z.gesperrt || waehrung < z.preis;
      if (zeile.knopf.disabled !== aus) zeile.knopf.disabled = aus;

      const stufenText = z.voll ? 'MAX' : z.stufe > 0 ? 'St. ' + z.stufe : '';
      const titel = zeile.ware.name + (stufenText ? ' · ' + stufenText : '');
      if (zeile.titel.textContent !== titel) zeile.titel.textContent = titel;
    }
  }

  function malvinaAuffrischen(zustand) {
    const blut = zustand.blut;

    // --- Der Klick ---
    const klick = klickTeile.zeile;
    if (klick) {
      const gekauft = zustand.klick.gekauft >= 1;
      const w = klickWerte(zustand.klick);
      const text = gekauft
        ? Math.round(w.schaden) + ' Schaden · ' + w.abklingzeit.toFixed(1).replace('.', ',')
          + ' s · ' + Math.round(w.krit * 100) + ' % kritisch'
        : KLICK.kurz;
      if (klick.unter.textContent !== text) klick.unter.textContent = text;
      preisSetzen(klick, gekauft ? '✓' : zahl(KLICK.preis), gekauft);
      klick.knopf.disabled = gekauft || blut < KLICK.preis;
      klick.knopf.classList.toggle('gelernt', gekauft);

      klickTeile.achsenLeiste.hidden = !gekauft;
      for (const { achse, knopf } of klickTeile.achsen) {
        const preis = klickAusbauPreis(zustand.klick[achse.k]);
        const beschriftet = achse.zeichen + ' ' + zahl(preis);
        if (knopf.textContent !== beschriftet) knopf.textContent = beschriftet;
        knopf.disabled = blut < preis;
        knopf.title = achse.name + ' — ' + zahl(preis) + ' Blut (Stufe ' + zustand.klick[achse.k] + ')';
      }

      for (const { variante, zeile } of klickTeile.varianten) {
        const hat = zustand.klick.varianten[variante.k] >= 1;
        const aktiv = zustand.klick.aktiv === variante.k;
        const text2 = hat
          ? (aktiv ? 'Aktiv — dein Klick ist jetzt diese Spielart' : variante.text)
          : variante.text;
        if (zeile.unter.textContent !== text2) zeile.unter.textContent = text2;
        preisSetzen(zeile, hat ? (aktiv ? 'Aktiv' : 'Wählen') : zahl(variante.preis), hat);
        zeile.knopf.disabled = !hat && (zustand.klick.gekauft < 1 || blut < variante.preis);
        zeile.knopf.classList.toggle('gelernt', aktiv);
        zeile.li.hidden = zustand.klick.gekauft < 1;
      }
    }

    // --- Die Zauber ---
    for (const zeile of zauberZeilen) {
      const stufe = zustand.zauber[zeile.zauber.k];
      const wert = zauberWerte(zeile.zauber, stufe);
      const gelernt = wert.gelernt;

      const text = gelernt
        ? Math.round(wert.schaden) + ' Schaden · ' + wert.abklingzeit.toFixed(0) + ' s · ' + wert.wirkbereich + ' px'
        : zeile.zauber.kurz;
      if (zeile.unter.textContent !== text) zeile.unter.textContent = text;

      preisSetzen(zeile, gelernt ? '✓' : zahl(zeile.zauber.preis), gelernt);
      zeile.knopf.disabled = gelernt || blut < zeile.zauber.preis;
      zeile.knopf.classList.toggle('gelernt', gelernt);

      zeile.achsen.hidden = !gelernt;
      for (const { achse, knopf } of zeile.achsKnoepfe) {
        const preis = ausbauPreis(zeile.zauber, stufe[achse.k]);
        const beschriftet = achse.zeichen + ' ' + zahl(preis);
        if (knopf.textContent !== beschriftet) knopf.textContent = beschriftet;
        knopf.disabled = blut < preis;
        knopf.title = achse.name + ' — ' + zahl(preis) + ' Blut (Stufe ' + stufe[achse.k] + ')';
      }
    }

    // --- Das Ritual ---
    const r = zauberZeilen.ritual;
    if (!r) return;
    const hat = zustand.ritual >= 1;
    const text = hat
      ? (zustand.ritualAn ? 'Aktiv — Welle startet nachts von selbst' : 'Ruht — Wellen startest du selbst')
      : 'Nächste Welle startet nachts von selbst';
    if (r.unter.textContent !== text) r.unter.textContent = text;
    preisSetzen(r, hat ? (zustand.ritualAn ? 'Aus' : 'An') : zahl(RITUAL_PREIS), hat);
    r.knopf.disabled = !hat && blut < RITUAL_PREIS;
  }

  /**
   * Abklingzeit als Kreisausschnitt über dem Symbol.
   * Er läuft im Uhrzeigersinn ab, wie man es aus anderen Spielen kennt.
   */
  function zauberLeisteAuffrischen(welt) {
    const { zustand, szene } = welt;
    const leiste = listen.zauber;
    if (!leiste) return;

    for (const knopf of leiste.children) {
      const k = knopf.dataset.zauber;
      let rest;
      let gesamt;
      let laeuft = false;
      let scharf = false;

      if (k === 'klick') {
        const w = klickWerte(zustand.klick);
        rest = szene.klickAbklingzeit;
        gesamt = w.variante === 'titan' ? w.titanAbklingzeit : w.abklingzeit;
      } else {
        const z = ZAUBER.find((e) => e.k === k);
        const wert = zauberWerte(z, zustand.zauber[k]);
        rest = szene.abklingzeit[k];
        gesamt = wert.abklingzeit;
        laeuft = (k === 'pranke' && szene.pranke)
          || (k === 'flamme' && szene.flamme)
          || (k === 'meteor' && szene.meteorZeit > 0);
        scharf = k === 'donner' && szene.donnerBereit;
      }
      const bereit = rest <= 0 && !laeuft && szene.phase === 'tag';

      knopf.classList.toggle('bereit', bereit && !scharf);
      knopf.classList.toggle('scharf', !!scharf);
      knopf.classList.toggle('laeuft', !!laeuft);

      const decke = knopf.querySelector('.zauberdecke');
      if (!decke) continue;
      const anteil = rest > 0 ? Math.min(1, rest / gesamt) : 0;
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
