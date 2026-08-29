// Die Töne des Spiels.
//
// **Es gibt keine Tondateien.** Jeder Klang wird beim Abspielen
// gerechnet — aus Schwingungen, Rauschen und Hüllkurven. Das passt zum
// Rest des Projekts (die Pixelbilder werden auch gerechnet), lädt
// nichts von fremden Servern und kostet keine einzige Datei.
//
// Zwei Dinge, die Browser erzwingen und die den Aufbau bestimmen:
//
// 1. **Ton braucht eine Nutzergeste.** Vor dem ersten Antippen bleibt
//    jede Tonausgabe stumm. Deshalb wird der Tonapparat erst beim
//    „Spielen"-Knopf des Titelbilds geweckt — der Knopf, den man
//    ohnehin drückt.
// 2. **Zu viele Töne auf einmal übersteuern.** Bei einer großen Welle
//    sterben leicht zehn Recken je Sekunde. Deshalb hat jeder Klang
//    eine Mindestpause; was zu dicht kommt, fällt aus.

/** Wie laut es insgesamt ist, wenn nicht stumm. */
const GRUNDLAUTSTAERKE = 0.35;

/** Schlüssel für die gemerkte Einstellung. */
const SPEICHER = 'slayemall.ton';

let ctx = null;
let summe = null;
let stumm = false;
/** Wann ein Klang zuletzt lief — gegen Übersteuern bei vielen Toden. */
const zuletzt = {};

/* ---------------- Werkzeug ---------------- */

/** Kurzes Rauschen als Puffer. Wird einmal gebaut und wiederverwendet. */
let rauschPuffer = null;
function rauschen() {
  if (rauschPuffer) return rauschPuffer;
  const laenge = Math.floor(ctx.sampleRate * 1.2);
  rauschPuffer = ctx.createBuffer(1, laenge, ctx.sampleRate);
  const d = rauschPuffer.getChannelData(0);
  for (let i = 0; i < laenge; i++) d[i] = Math.random() * 2 - 1;
  return rauschPuffer;
}

/**
 * Eine Schwingung mit Hüllkurve.
 * `von`/`bis` sind die Tonhöhe am Anfang und am Ende in Hertz.
 */
function ton({ art = 'sine', von, bis = von, dauer = 0.15, laut = 0.5, verzug = 0 }) {
  const t = ctx.currentTime + verzug;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = art;
  o.frequency.setValueAtTime(von, t);
  if (bis !== von) o.frequency.exponentialRampToValueAtTime(Math.max(1, bis), t + dauer);
  // Kurzer Anstieg, dann Ausklang — ohne das knackst es beim Einsatz.
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(laut, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
  o.connect(g).connect(summe);
  o.start(t);
  o.stop(t + dauer + 0.02);
}

/**
 * Gefiltertes Rauschen — daraus werden Matsch, Feuer und Einschläge.
 * `bandbreite` unter 1 macht es dumpfer.
 */
function knistern({ dauer = 0.2, laut = 0.4, tief = 900, hoch = null, verzug = 0, typ = 'lowpass' }) {
  const t = ctx.currentTime + verzug;
  const q = ctx.createBufferSource();
  q.buffer = rauschen();
  q.playbackRate.value = 0.8 + Math.random() * 0.5;
  const f = ctx.createBiquadFilter();
  f.type = typ;
  f.frequency.setValueAtTime(tief, t);
  if (hoch !== null) f.frequency.exponentialRampToValueAtTime(Math.max(40, hoch), t + dauer);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(laut, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
  q.connect(f).connect(g).connect(summe);
  q.start(t);
  q.stop(t + dauer + 0.02);
}

/** Mindestpause je Klangart, damit nichts übersteuert. */
function darf(name, pause) {
  const jetzt = ctx.currentTime;
  if (zuletzt[name] !== undefined && jetzt - zuletzt[name] < pause) return false;
  zuletzt[name] = jetzt;
  return true;
}

/* ---------------- Die Klänge ---------------- */

const KLAENGE = {
  /** Ein Recke wird im Tor verdaut: dumpf, feucht, kurz. */
  torTod() {
    if (!darf('torTod', 0.09)) return;
    knistern({ dauer: 0.22, laut: 0.5, tief: 700, hoch: 120 });
    ton({ art: 'sine', von: 90, bis: 42, dauer: 0.2, laut: 0.35 });
  },

  /** Tod auf der Brücke: trockener, heller als im Tor. */
  brueckenTod() {
    if (!darf('brueckenTod', 0.07)) return;
    knistern({ dauer: 0.14, laut: 0.32, tief: 1400, hoch: 300 });
  },

  /** Der eigene Klick trifft. */
  klick() {
    if (!darf('klick', 0.04)) return;
    ton({ art: 'triangle', von: 320, bis: 150, dauer: 0.09, laut: 0.3 });
    knistern({ dauer: 0.07, laut: 0.22, tief: 2200, hoch: 700 });
  },

  /** Kritischer Treffer: derselbe Schlag, aber mit hellem Nachklang. */
  krit() {
    if (!darf('krit', 0.05)) return;
    ton({ art: 'triangle', von: 420, bis: 190, dauer: 0.11, laut: 0.34 });
    ton({ art: 'square', von: 1180, bis: 880, dauer: 0.13, laut: 0.11, verzug: 0.02 });
  },

  /** Ein Pfeil verlässt die Zinnen. */
  pfeil() {
    if (!darf('pfeil', 0.1)) return;
    knistern({ dauer: 0.1, laut: 0.16, tief: 3200, hoch: 900, typ: 'bandpass' });
  },

  /** Blitzeinschlag: heller Riss, dann Grollen. */
  blitz() {
    if (!darf('blitz', 0.15)) return;
    knistern({ dauer: 0.09, laut: 0.55, tief: 7000, hoch: 2200, typ: 'highpass' });
    knistern({ dauer: 0.5, laut: 0.4, tief: 400, hoch: 70, verzug: 0.04 });
    ton({ art: 'sawtooth', von: 160, bis: 40, dauer: 0.35, laut: 0.2, verzug: 0.03 });
  },

  /** Flammenstoß: langes, weiches Rauschen. */
  flamme() {
    if (!darf('flamme', 0.4)) return;
    knistern({ dauer: 0.8, laut: 0.34, tief: 1800, hoch: 500, typ: 'bandpass' });
    ton({ art: 'sawtooth', von: 70, bis: 130, dauer: 0.6, laut: 0.12 });
  },

  /** Ein Meteorit schlägt ein. */
  meteor() {
    if (!darf('meteor', 0.12)) return;
    knistern({ dauer: 0.4, laut: 0.45, tief: 900, hoch: 90 });
    ton({ art: 'sine', von: 120, bis: 32, dauer: 0.35, laut: 0.4 });
  },

  /** Die Pranke fährt aus und zermalmt. */
  pranke() {
    knistern({ dauer: 0.55, laut: 0.5, tief: 600, hoch: 80 });
    ton({ art: 'sine', von: 70, bis: 28, dauer: 0.5, laut: 0.45 });
  },

  /** Eine Münze wird aufgesammelt. */
  muenze() {
    if (!darf('muenze', 0.05)) return;
    ton({ art: 'square', von: 900, bis: 1320, dauer: 0.07, laut: 0.12 });
    ton({ art: 'square', von: 1320, bis: 1760, dauer: 0.09, laut: 0.08, verzug: 0.05 });
  },

  /** Ein Kauf ist zustande gekommen. */
  kauf() {
    ton({ art: 'triangle', von: 520, dauer: 0.1, laut: 0.24 });
    ton({ art: 'triangle', von: 784, dauer: 0.16, laut: 0.2, verzug: 0.07 });
  },

  /** Ein Kauf ging nicht — zu wenig Gold. */
  abgelehnt() {
    if (!darf('abgelehnt', 0.2)) return;
    ton({ art: 'square', von: 200, bis: 130, dauer: 0.14, laut: 0.14 });
  },

  /** Ein Artefakt ist gefallen. Selten genug, um aufzufallen. */
  fund() {
    ton({ art: 'sine', von: 660, dauer: 0.12, laut: 0.22 });
    ton({ art: 'sine', von: 990, dauer: 0.14, laut: 0.2, verzug: 0.09 });
    ton({ art: 'sine', von: 1320, dauer: 0.3, laut: 0.18, verzug: 0.18 });
  },

  /** Die Welle beginnt: ein Horn. */
  welleStart() {
    ton({ art: 'sawtooth', von: 150, bis: 220, dauer: 0.5, laut: 0.2 });
    ton({ art: 'sawtooth', von: 225, bis: 330, dauer: 0.55, laut: 0.13, verzug: 0.02 });
  },

  /** Die Welle ist überstanden. */
  welleGeschafft() {
    ton({ art: 'triangle', von: 392, dauer: 0.14, laut: 0.22 });
    ton({ art: 'triangle', von: 523, dauer: 0.14, laut: 0.22, verzug: 0.12 });
    ton({ art: 'triangle', von: 659, dauer: 0.35, laut: 0.24, verzug: 0.24 });
  },

  /** Die Burg ist überrannt. */
  verloren() {
    ton({ art: 'sawtooth', von: 300, bis: 90, dauer: 0.9, laut: 0.3 });
    knistern({ dauer: 0.7, laut: 0.3, tief: 500, hoch: 60, verzug: 0.05 });
  },

  /** Ein Boss betritt die Bühne. */
  boss() {
    ton({ art: 'sawtooth', von: 90, bis: 70, dauer: 1.1, laut: 0.3 });
    ton({ art: 'square', von: 45, bis: 35, dauer: 1.2, laut: 0.2, verzug: 0.05 });
    knistern({ dauer: 0.9, laut: 0.2, tief: 300, hoch: 80, verzug: 0.1 });
  }
};

/* ---------------- Nach außen ---------------- */

/**
 * Weckt den Tonapparat. Muss aus einer echten Nutzergeste heraus
 * aufgerufen werden — sonst bleibt er stumm.
 */
export function klangWecken() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }
  const Hersteller = window.AudioContext || window.webkitAudioContext;
  if (!Hersteller) return false;
  try {
    ctx = new Hersteller();
  } catch (fehler) {
    return false;
  }
  summe = ctx.createGain();
  summe.gain.value = stumm ? 0 : GRUNDLAUTSTAERKE;
  summe.connect(ctx.destination);
  return true;
}

/** Spielt einen Klang, wenn der Apparat wach und nicht stumm ist. */
export function klang(name) {
  if (!ctx || stumm) return;
  const k = KLAENGE[name];
  if (!k) return;
  // Ein einzelner fehlgeschlagener Ton darf nie den Spielschritt reißen.
  try { k(); } catch (fehler) { /* Ton ist Beiwerk */ }
}

export function istStumm() {
  return stumm;
}

/** Schaltet den Ton um und merkt sich die Wahl. */
export function stummUmschalten() {
  stumm = !stumm;
  if (summe) summe.gain.value = stumm ? 0 : GRUNDLAUTSTAERKE;
  try { localStorage.setItem(SPEICHER, stumm ? 'aus' : 'an'); } catch (fehler) { /* egal */ }
  return stumm;
}

/** Holt die gemerkte Einstellung. Wird beim Start einmal gerufen. */
export function klangEinstellungLaden() {
  try {
    stumm = localStorage.getItem(SPEICHER) === 'aus';
  } catch (fehler) {
    stumm = false;
  }
  return stumm;
}
