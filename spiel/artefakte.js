// Artefakte: Erzeugen, Bewerten, Wirken.
//
// Reine Logik, kein Browser, kein Zeichnen — und der Zufall ist
// austauschbar: Jede Funktion nimmt eine `rnd`-Funktion. Damit lässt sich
// mit einem gesetzten Startwert prüfen, dass derselbe Wurf dasselbe
// Artefakt ergibt (`pruefe-artefakte.mjs`).
//
// Ein Artefakt ist ein schlichtes Objekt:
//
//   { name, seltenheit, fundwelle, affixe: [{ k, wert }] }
//
// **Tags werden nicht gespeichert.** Sie ergeben sich aus den Affixen und
// werden beim Laden abgeleitet — sonst könnten Stand und Regel
// auseinanderlaufen.
//
// Der Kern des Systems sind Affixe, die **pro ausgerüstetem Tag**
// skalieren: Wer drei Feuer-Artefakte im Regal hat, macht aus jedem Klick
// einen Flammenwerfer. Daraus entstehen Bauweisen statt Bestenlisten.

/* ---------------- Größen des Systems ---------------- */

/** Plätze im Regal (ausgerüstet) und im Inventar (Lager). */
export const REGAL_PLAETZE = 5;
export const INVENTAR_PLAETZE = 20;

/** Grundchance je getötetem Recken, in Prozent. */
export const FUNDCHANCE = 0.05;

/** Ab dieser Welle können legendäre Artefakte fallen. */
export const LEGENDAER_AB_WELLE = 15;

export const SELTENHEITEN = [
  { k: 'gewoehnlich', name: 'Gewöhnlich', farbe: '#8b8798', affixe: 1, verkauf: 100 },
  { k: 'selten', name: 'Selten', farbe: '#9ecbff', affixe: 2, verkauf: 400 },
  { k: 'episch', name: 'Episch', farbe: '#9184d9', affixe: 3, verkauf: 1600 },
  { k: 'legendaer', name: 'Legendär', farbe: '#e0b64f', affixe: 3, einzig: true, verkauf: 6400 }
];

export const TAG_NAMEN = {
  feuer: 'Feuer', gift: 'Gift', eis: 'Eis', blitz: 'Blitz', gold: 'Gold', burg: 'Burg'
};

export const TAG_FARBEN = {
  feuer: '#ff7a2a', gift: '#7fd48a', eis: '#9ecbff',
  blitz: '#cfc8ff', gold: '#e0b64f', burg: '#b4bac9'
};

export function seltenheitNach(k) {
  return SELTENHEITEN.find((s) => s.k === k) || SELTENHEITEN[0];
}

/* ---------------- Der Affix-Pool ---------------- */

const p1 = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',');

/**
 * Jeder Affix hat eine Spanne auf Wellenstufe 1. Die Güte wächst mit der
 * Fundwelle (siehe `guete`) — ein „+8 % Goldfund" von Welle 3 kann auf
 * Welle 40 als „+31 %" fallen. Alte Funde veralten also, und die Drops
 * bleiben interessant.
 *
 * `ganz` rundet auf ganze Zahlen, `abSeltenheit` sperrt starke Affixe für
 * die unteren Stufen.
 */
export const AFFIXE = [
  {
    k: 'brennendeBeruehrung', tag: 'feuer', name: 'Brennende Berührung',
    min: 1, max: 1, ganz: true, abSeltenheit: 'selten',
    text: () => 'Klick zündet an: 5 s Brand, 10 Schaden/s je ausgerüstetem Feuer-Artefakt'
  },
  {
    k: 'glutpfeile', tag: 'feuer', name: 'Glutpfeile', min: 8, max: 20,
    text: (v) => 'Pfeiltreffer zünden mit ' + p1(v) + ' % Chance an'
  },
  {
    k: 'giftpfeile', tag: 'gift', name: 'Giftpfeile', min: 6, max: 14, ganz: true,
    abSeltenheit: 'selten',
    text: (v) => 'Pfeile vergiften alles im Umkreis von 12 px: ' + v + ' Schaden/s, 4 s, stapelbar'
  },
  {
    k: 'zaehesGift', tag: 'gift', name: 'Zähes Gift', min: 1, max: 3,
    text: (v) => 'Gift hält ' + p1(v) + ' s länger'
  },
  {
    k: 'frostgriff', tag: 'eis', name: 'Frostgriff', min: 25, max: 40,
    text: (v) => 'Klick verlangsamt das Ziel um ' + p1(v) + ' % für 3 s'
  },
  {
    k: 'raureif', tag: 'eis', name: 'Raureif', min: 6, max: 14,
    text: (v) => 'Auf den letzten 40 px vor dem Tor ' + p1(v) + ' % langsamer'
  },
  {
    k: 'kettenblitz', tag: 'blitz', name: 'Kettenblitz', min: 1, max: 2, ganz: true,
    abSeltenheit: 'selten',
    text: (v) => 'Klick springt auf ' + v + ' Nachbarn über (halber Schaden)'
  },
  {
    k: 'geladeneKlauen', tag: 'blitz', name: 'Geladene Klauen', min: 20, max: 35,
    text: (v) => 'Donnerschlag macht ' + p1(v) + ' % mehr Schaden'
  },
  {
    k: 'gierschimmer', tag: 'gold', name: 'Gierschimmer', min: 5, max: 12,
    text: (v) => 'Münzen sind ' + p1(v) + ' % mehr wert'
  },
  {
    k: 'spuernase', tag: 'gold', name: 'Spürnase', min: 0.05, max: 0.15,
    text: (v) => '+' + (Math.round(v * 100) / 100).toString().replace('.', ',') + ' % Artefakt-Fundchance'
  },
  {
    k: 'magnetring', tag: 'gold', name: 'Magnetring', min: 1, max: 1, ganz: true,
    text: () => 'Liegende Münzen kriechen langsam Richtung Tor'
  },
  {
    k: 'eisenmagen', tag: 'burg', name: 'Eisenmagen', min: 4, max: 9,
    text: (v) => 'Das Monster frisst ' + p1(v) + ' % schneller'
  },
  {
    k: 'weiteHallen', tag: 'burg', name: 'Weite Hallen', min: 1, max: 1, ganz: true,
    abSeltenheit: 'selten',
    text: () => '+1 Platz in der Burg'
  },
  {
    k: 'kaltePraezision', tag: 'burg', name: 'Kalte Präzision', min: 3, max: 7,
    text: (v) => 'Klick-Krit +' + p1(v) + ' %'
  },
  {
    k: 'schnelleHand', tag: 'burg', name: 'Schnelle Hand', min: 5, max: 10,
    text: (v) => 'Klick-Abklingzeit −' + p1(v) + ' %'
  }
];

/**
 * Die einzigartigen Affixe der legendären Stufe.
 *
 * Midas und die Faust des Titanen sind endgültig gestrichen — diese hier
 * sind neu und im Ton des Hauses: Sie reden vom Gemäuer, vom Schlund und
 * von den Raben, nicht von Zahlen.
 */
export const EINZIGARTIGE = [
  {
    k: 'zweiterSchlund', tag: 'burg', name: 'Der Zweite Schlund',
    text: 'Ein weiteres Maul frisst mit — dauerhaft +1 Schlund'
  },
  {
    k: 'blutzoll', tag: 'gold', name: 'Blutzoll',
    text: 'Je 500 vergossene Liter zahlt das Haus eine Münze aus — Blut ist wieder etwas wert'
  },
  {
    k: 'rabenpakt', tag: 'gold', name: 'Rabenpakt',
    text: 'Am Wellenende tragen die Raben alles liegengebliebene Gold ins Tor'
  },
  {
    k: 'hungrigesGemaeuer', tag: 'burg', name: 'Hungriges Gemäuer',
    text: 'Jeder Tod im Tor macht 3 % schneller satt, 6 s lang, bis zehnfach gestapelt'
  },
  {
    k: 'aschenkrone', tag: 'feuer', name: 'Aschenkrone',
    text: 'Wer verbrennt, lässt eine Glut zurück — der Nächste, der darüber läuft, brennt'
  }
];

export function affixNach(k) {
  return AFFIXE.find((a) => a.k === k) || EINZIGARTIGE.find((a) => a.k === k) || null;
}

/** Ist der Affix einzigartig (nur legendär)? */
export function istEinzig(k) {
  return EINZIGARTIGE.some((a) => a.k === k);
}

/* ---------------- Erzeugen ---------------- */

/** Wie stark die Werte einer Fundwelle ausfallen dürfen. */
export function guete(fundwelle) {
  return 1 + 0.35 * Math.floor(Math.max(1, fundwelle) / 5);
}

const NAME_VORN = [
  'Aschen', 'Glut', 'Frost', 'Gift', 'Donner', 'Gier', 'Knochen', 'Schlund',
  'Nacht', 'Rost', 'Grab', 'Zahn', 'Rabens', 'Moder'
];

const NAME_FORM = [
  'ring', 'kette', 'zahn', 'klaue', 'siegel', 'schädel', 'krone', 'becher',
  'splitter', 'auge', 'faust', 'gürtel'
];

const NAME_VON = [
  'des Küchenmeisters', 'der letzten Wache', 'des Torwarts', 'der stummen Magd',
  'des Zeugmeisters', 'der siebten Welle', 'des Abgrunds', 'der Hexenmeisterin',
  'des Hausherrn', 'der satten Raben', 'des Vorbesitzers'
];

function ausListe(liste, rnd) {
  return liste[(rnd() * liste.length) | 0];
}

/** „Aschering des Küchenmeisters". */
export function namenBauen(rnd) {
  const name = ausListe(NAME_VORN, rnd) + ausListe(NAME_FORM, rnd);
  return rnd() < 0.75 ? name + ' ' + ausListe(NAME_VON, rnd) : name;
}

/**
 * Welche Seltenheit dieser Fund hat.
 *
 * Die Anteile verschieben sich mit der Welle: Aus 70 % Gewöhnlich werden
 * mit der Zeit 45 %, aus 0 % Legendär werden 3 %. `mindestens` hebt das
 * Ergebnis an — Bosswellen garantieren mindestens Selten.
 */
export function seltenheitAuslosen(welle, rnd, mindestens) {
  const t = Math.min(1, Math.max(0, (welle - 1) / 40));
  const legendaer = welle >= LEGENDAER_AB_WELLE ? 0.03 * t : 0;
  const episch = 0.05 + 0.12 * t;
  const selten = 0.25 + 0.10 * t;

  const wurf = rnd();
  let k;
  if (wurf < legendaer) k = 'legendaer';
  else if (wurf < legendaer + episch) k = 'episch';
  else if (wurf < legendaer + episch + selten) k = 'selten';
  else k = 'gewoehnlich';

  if (mindestens) {
    const i = SELTENHEITEN.findIndex((s) => s.k === k);
    const j = SELTENHEITEN.findIndex((s) => s.k === mindestens);
    if (j > i) k = SELTENHEITEN[j].k;
  }
  return k;
}

/** Ein fertiges Artefakt. */
export function artefaktErzeugen(welle, seltenheitK, rnd = Math.random) {
  const seltenheit = seltenheitNach(seltenheitK);
  const rang = SELTENHEITEN.findIndex((s) => s.k === seltenheit.k);
  const g = guete(welle);

  const moeglich = AFFIXE.filter((a) => {
    if (!a.abSeltenheit) return true;
    return rang >= SELTENHEITEN.findIndex((s) => s.k === a.abSeltenheit);
  });

  const gewaehlt = [];
  const uebrig = moeglich.slice();
  for (let i = 0; i < seltenheit.affixe && uebrig.length; i++) {
    const j = (rnd() * uebrig.length) | 0;
    const affix = uebrig.splice(j, 1)[0];
    let wert = affix.min + rnd() * (affix.max - affix.min);
    if (!affix.ganz) wert *= g;
    wert = affix.ganz ? Math.round(wert) : Math.round(wert * 100) / 100;
    gewaehlt.push({ k: affix.k, wert });
  }

  if (seltenheit.einzig) {
    const e = ausListe(EINZIGARTIGE, rnd);
    gewaehlt.push({ k: e.k, wert: 1 });
  }

  return {
    name: namenBauen(rnd),
    seltenheit: seltenheit.k,
    fundwelle: Math.max(1, Math.round(welle)),
    affixe: gewaehlt
  };
}

/** Wirft die Würfel: Fällt hier ein Artefakt? */
export function fundWurf(chanceProzent, rnd = Math.random) {
  return rnd() * 100 < chanceProzent;
}

export function verkaufswert(artefakt) {
  return seltenheitNach(artefakt.seltenheit).verkauf;
}

/* ---------------- Ableiten ---------------- */

/** Die Tags eines Artefakts — aus den Affixen, nie gespeichert. */
export function tagsVon(artefakt) {
  const tags = [];
  for (const eintrag of artefakt.affixe || []) {
    const a = affixNach(eintrag.k);
    if (a && !tags.includes(a.tag)) tags.push(a.tag);
  }
  return tags;
}

/** Eine lesbare Zeile je Affix, für die Detailkarte. */
export function affixZeilen(artefakt) {
  const zeilen = [];
  for (const eintrag of artefakt.affixe || []) {
    const a = affixNach(eintrag.k);
    if (!a) continue;
    zeilen.push({
      k: a.k, name: a.name, tag: a.tag,
      einzig: istEinzig(a.k),
      text: typeof a.text === 'function' ? a.text(eintrag.wert) : a.text
    });
  }
  return zeilen;
}

/** Leere Wirkungssumme — auch die Vorgabe, wenn das Regal leer ist. */
export function leereWirkung() {
  return {
    fressBonus: 0, kapazitaet: 0, schlund: 0,
    klickAbkling: 0, krit: 0, muenzWert: 0, fundchance: 0,
    magnetring: false,
    glutpfeilChance: 0, giftpfeilDps: 0, giftDauer: 0,
    frostgriff: 0, raureif: 0, kettenblitz: 0, donnerBonus: 0,
    brennendeBeruehrung: 0,
    blutzoll: false, rabenpakt: false, hungrigesGemaeuer: 0, aschenkrone: false,
    tags: { feuer: 0, gift: 0, eis: 0, blitz: 0, gold: 0, burg: 0 }
  };
}

/**
 * Die Summe aller Affixe der fünf Regalplätze.
 *
 * Erst werden die Tags gezählt, dann die Werte summiert — weil
 * „Brennende Berührung" pro ausgerüstetem Feuer-Artefakt skaliert und
 * dafür die Zählung schon fertig sein muss.
 */
export function wirkungAus(regal) {
  const w = leereWirkung();
  const liste = (regal || []).filter(Boolean);

  for (const artefakt of liste) {
    for (const tag of tagsVon(artefakt)) w.tags[tag] = (w.tags[tag] || 0) + 1;
  }

  for (const artefakt of liste) {
    for (const eintrag of artefakt.affixe || []) {
      const wert = eintrag.wert;
      switch (eintrag.k) {
        case 'brennendeBeruehrung': w.brennendeBeruehrung += 1; break;
        case 'glutpfeile': w.glutpfeilChance += wert; break;
        case 'giftpfeile': w.giftpfeilDps += wert; break;
        case 'zaehesGift': w.giftDauer += wert; break;
        case 'frostgriff': w.frostgriff = Math.max(w.frostgriff, wert); break;
        case 'raureif': w.raureif += wert; break;
        case 'kettenblitz': w.kettenblitz += wert; break;
        case 'geladeneKlauen': w.donnerBonus += wert; break;
        case 'gierschimmer': w.muenzWert += wert; break;
        case 'spuernase': w.fundchance += wert; break;
        case 'magnetring': w.magnetring = true; break;
        case 'eisenmagen': w.fressBonus += wert; break;
        case 'weiteHallen': w.kapazitaet += 1; break;
        case 'kaltePraezision': w.krit += wert; break;
        case 'schnelleHand': w.klickAbkling += wert; break;
        case 'zweiterSchlund': w.schlund += 1; break;
        case 'blutzoll': w.blutzoll = true; break;
        case 'rabenpakt': w.rabenpakt = true; break;
        case 'hungrigesGemaeuer': w.hungrigesGemaeuer += 1; break;
        case 'aschenkrone': w.aschenkrone = true; break;
        default: break;
      }
    }
  }

  // Der Kern des Systems: 10 Schaden je Sekunde und Feuer-Artefakt.
  if (w.brennendeBeruehrung > 0) w.brandDps = 10 * Math.max(1, w.tags.feuer);
  else w.brandDps = 0;

  return w;
}

/** Prüft einen geladenen Spielstand: nur echte Affixe, nur echte Stufen. */
export function artefaktBereinigen(roh) {
  if (!roh || typeof roh !== 'object') return null;
  if (!seltenheitNach(roh.seltenheit) || !SELTENHEITEN.some((s) => s.k === roh.seltenheit)) return null;
  const affixe = (Array.isArray(roh.affixe) ? roh.affixe : [])
    .filter((e) => e && affixNach(e.k) && typeof e.wert === 'number' && isFinite(e.wert))
    .slice(0, 4);
  if (!affixe.length) return null;
  return {
    name: typeof roh.name === 'string' && roh.name ? roh.name.slice(0, 60) : 'Fundstück',
    seltenheit: roh.seltenheit,
    fundwelle: Math.max(1, Math.floor(Number(roh.fundwelle) || 1)),
    affixe
  };
}
