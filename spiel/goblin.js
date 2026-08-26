// Grutz, der Kobold in der Schatzkammer.
//
// Gemalt im Geist der Gesprächsporträts von "Das Schwarze Auge — Die
// Schicksalsklinge" (1992): Brustbild in einem Steinbogen, wenige Farben,
// harte Kanten, warmes Licht von unten links aus dem Gold, kalter Rand
// von rechts. Alles von Hand gesetzt, es gibt keine Bilddatei.
//
// Gezeichnet wird in 120 × 150 Bildpunkten und per CSS hochskaliert —
// dieselbe Technik wie bei der Torszene. Ansehen ohne Browser:
//   node werkzeuge/bild-erzeugen.mjs grutz 3

export const GOBLIN_BREITE = 120;
export const GOBLIN_HOEHE = 150;

const F = {
  rahmenAussen: '#1c1a16',
  rahmenStein: '#4a453d',
  rahmenLicht: '#655c4e',
  rahmenSchatten: '#2a2722',

  grundOben: '#0b0910',
  grundUnten: '#1c1522',

  // Haut, von tiefem Schatten bis Glanzlicht
  haut1: '#243a22',
  haut2: '#33502e',
  haut3: '#456a3a',
  haut4: '#5c8747',
  haut5: '#79a659',
  hautGlanz: '#9cc276',
  hautWarm: '#7d8b3f',
  hautWarm2: '#a3a052',

  augeGelb: '#f0cf4e',
  augeGelbDunkel: '#b99a32',
  pupille: '#150e06',
  glanz: '#fff6d2',

  mund: '#28101a',
  zunge: '#7a3040',
  zahn: '#ddd6b6',
  zahnDunkel: '#a89f7e',

  kapuze1: '#2a1a12',
  kapuze2: '#3d281b',
  kapuze3: '#523524',
  kapuze4: '#6b4630',

  fell1: '#3a2e22',
  fell2: '#5c4934',
  fell3: '#7d6647',
  fell4: '#9c8262',

  metall: '#8f9480',
  metallDunkel: '#565b4c'
};

export function goblinZeichnen(ctx, zeit = 0) {
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, GOBLIN_BREITE, GOBLIN_HOEHE);

  gewoelbe(ctx);
  kapuzeHinten(ctx);
  ohren(ctx);
  kragen(ctx);
  gesicht(ctx, zeit);
  kapuzeSaum(ctx);
  rahmen(ctx);
}

/* ================= Hintergrund ================= */

function gewoelbe(ctx) {
  const v = ctx.createLinearGradient(0, 0, 0, GOBLIN_HOEHE);
  v.addColorStop(0, F.grundOben);
  v.addColorStop(1, F.grundUnten);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, GOBLIN_BREITE, GOBLIN_HOEHE);

  // Mauerwerk, gerade eben zu ahnen
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  for (let y = 14; y < 130; y += 10) {
    ctx.fillRect(8, y, GOBLIN_BREITE - 16, 1);
    for (let x = 8 + ((y / 10) % 2 ? 12 : 5); x < GOBLIN_BREITE - 8; x += 24) {
      ctx.fillRect(x, y - 9, 1, 9);
    }
  }

  // Der Schatz leuchtet von unten links herauf. Daher kommt alles Licht.
  const gold = ctx.createRadialGradient(18, 150, 2, 18, 150, 105);
  gold.addColorStop(0, 'rgba(226,176,72,0.40)');
  gold.addColorStop(0.45, 'rgba(160,118,44,0.15)');
  gold.addColorStop(1, 'rgba(120,90,30,0)');
  ctx.fillStyle = gold;
  ctx.fillRect(0, 20, GOBLIN_BREITE, GOBLIN_HOEHE - 20);
}

/* ================= Kopfformen ================= */

/**
 * Umriss des Schädels: breite Stirn, kräftige Kiefer, kurzes Kinn.
 * Kein spitzes Dreieck — ein Kobold hat einen Unterkiefer, mit dem er
 * zubeißen kann.
 */
function kopfBreite(y) {
  if (y < 38 || y > 126) return 0;
  if (y <= 80) {
    const t = (80 - y) / 42;
    return Math.round(32 * Math.sqrt(Math.max(0, 1 - t * t)));
  }
  if (y <= 108) {
    // Wangen bleiben breit — hier sitzt das Kaumuskelfleisch
    const t = (y - 80) / 28;
    return Math.round(32 - t * 6);
  }
  // Kiefer und Kinn runden ab
  const t = (y - 108) / 18;
  return Math.round(26 * Math.sqrt(Math.max(0, 1 - t * t)) + 4 * (1 - t));
}

/** Umriss der Kapuze, etwas weiter als der Kopf. */
function kapuzeBreite(y) {
  if (y < 26 || y > GOBLIN_HOEHE) return 0;
  if (y <= 74) {
    const t = (74 - y) / 48;
    // Hoch 1,6 statt Kreis: oben flacher, nicht pilzförmig
    return Math.round(46 * Math.pow(Math.max(0, 1 - Math.pow(t, 2.4)), 0.5));
  }
  return Math.round(46 + (y - 74) * 0.3);
}

/* ================= Kapuze ================= */

function kapuzeHinten(ctx) {
  for (let y = 22; y < GOBLIN_HOEHE; y++) {
    const b = kapuzeBreite(y);
    if (b <= 0) continue;
    for (let x = 60 - b; x <= 60 + b; x++) {
      const rand = (x - (60 - b)) / (2 * b);
      // links beleuchtet, rechts im Dunkeln
      let farbe = F.kapuze2;
      if (rand < 0.16) farbe = F.kapuze3;
      else if (rand < 0.07) farbe = F.kapuze4;
      else if (rand > 0.78) farbe = F.kapuze1;
      ctx.fillStyle = farbe;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Falten, die vom Scheitel herunterlaufen
  ctx.fillStyle = 'rgba(0,0,0,0.26)';
  for (const [x0, y0, y1] of [[26, 62, 118], [34, 82, 126], [92, 60, 116], [86, 80, 124]]) {
    for (let y = y0; y <= y1; y++) {
      const versatz = Math.round(Math.sin((y - y0) * 0.09) * 2);
      ctx.fillRect(x0 + versatz, y, 2, 1);
    }
  }
  ctx.fillStyle = 'rgba(255,240,200,0.07)';
  for (let y = 60; y <= 116; y++) ctx.fillRect(20 + Math.round(Math.sin(y * 0.07) * 2), y, 2, 1);
}

/** Der Saum, der über der Stirn liegt und Schatten wirft. */
function kapuzeSaum(ctx) {
  for (let x = 20; x <= 100; x++) {
    const d = (x - 60) / 40;
    const unten = Math.round(48 + d * d * 26);
    const oben = unten - 13;
    for (let y = oben; y <= unten; y++) {
      const t = (y - oben) / 13;
      let farbe = F.kapuze2;
      if (t < 0.28) farbe = x < 60 ? F.kapuze4 : F.kapuze3;
      else if (t > 0.76) farbe = F.kapuze1;
      ctx.fillStyle = farbe;
      ctx.fillRect(x, y, 1, 1);
    }
    // Schlagschatten auf die Stirn
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.fillRect(x, unten + 1, 1, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(x, unten + 5, 1, 3);
  }
}

/* ================= Ohren ================= */

function ohren(ctx) {
  ohr(ctx, -1);
  ohr(ctx, 1);
}

function ohr(ctx, seite) {
  // Setzt tief an der Wange an und läuft flach nach außen — nicht steil
  // nach oben, sonst sieht es aus wie eine angeklebte Klinge.
  const wx = 60 + seite * 24;
  const wy = 88;
  const sx = 60 + seite * 56;
  const sy = 52;
  const schritte = 48;

  for (let i = 0; i <= schritte; i++) {
    const t = i / schritte;
    const x = Math.round(wx + (sx - wx) * t);
    const y = Math.round(wy + (sy - wy) * t);
    // Bleibt länger dick und läuft erst am Ende spitz zu
    const dicke = Math.max(1, Math.round(26 * Math.pow(1 - t, 1.5)));
    for (let d = 0; d < dicke; d++) {
      const q = d / dicke;
      let farbe;
      if (q < 0.16) farbe = seite < 0 ? F.haut5 : F.haut3;      // Oberkante
      else if (q < 0.6) farbe = F.haut1;                         // Ohrmuschel
      else farbe = seite < 0 ? F.haut3 : F.haut2;                // Unterkante
      ctx.fillStyle = farbe;
      ctx.fillRect(x, y + d, 1, 1);
    }
    // Lichtkante ganz oben und dunkler Abschluss unten
    ctx.fillStyle = seite < 0 ? F.hautWarm2 : 'rgba(158,176,200,0.34)';
    ctx.fillRect(x, y, 1, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x, y + dicke - 1, 1, 1);
    // Adern in der Ohrmuschel
    if (i % 7 === 3 && dicke > 8) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(x, y + Math.round(dicke * 0.35), 1, Math.round(dicke * 0.3));
    }
  }

  // Ein Ring im linken Ohr — Händlerschmuck
  if (seite < 0) {
    ctx.fillStyle = F.metall;
    ctx.fillRect(35, 62, 1, 5);
    ctx.fillRect(36, 66, 3, 1);
    ctx.fillRect(39, 62, 1, 5);
    ctx.fillRect(36, 61, 3, 1);
    ctx.fillStyle = F.metallDunkel;
    ctx.fillRect(37, 65, 2, 1);
  }
}

/* ================= Kragen ================= */

function kragen(ctx) {
  // Fellzotteln als überlappende Buckel — kein glatter Block
  const buckel = [];
  for (let i = 0; i < 16; i++) {
    buckel.push({
      x: 6 + i * 7 + ((i * 5) % 4),
      y: 124 + ((i * 11) % 7) - Math.round(Math.cos((i - 7.5) / 5) * 5),
      r: 6 + ((i * 7) % 4)
    });
  }

  for (const b of buckel) {
    for (let y = -b.r; y <= b.r + 14; y++) {
      const innen = Math.max(0, 1 - (y / b.r) ** 2);
      const dx = y <= 0 ? Math.round(b.r * Math.sqrt(innen)) : b.r;
      for (let x = -dx; x <= dx; x++) {
        const py = b.y + y;
        const px = b.x + x;
        if (py < 0 || py >= GOBLIN_HOEHE || px < 0 || px >= GOBLIN_BREITE) continue;
        const links = (x + dx) / (2 * dx || 1);
        let farbe = F.fell2;
        if (y < -b.r * 0.35 && links < 0.55) farbe = F.fell3;
        if (y < -b.r * 0.6 && links < 0.4) farbe = F.fell4;
        if (links > 0.74 || y > b.r * 0.5) farbe = F.fell1;
        ctx.fillStyle = farbe;
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }

  // Einzelne Haare
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  for (let i = 0; i < 46; i++) {
    const x = 8 + ((i * 29) % 104);
    const y = 124 + ((i * 17) % 22);
    ctx.fillRect(x, y, 1, 2 + ((i * 5) % 3));
  }
  ctx.fillStyle = 'rgba(220,196,150,0.16)';
  for (let i = 0; i < 22; i++) {
    const x = 10 + ((i * 23) % 46);
    ctx.fillRect(x, 126 + ((i * 13) % 12), 1, 2);
  }

  // Rechts liegt der Kragen im Schatten
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(78, 118, GOBLIN_BREITE - 78, 32);
}

/* ================= Gesicht ================= */

function gesicht(ctx, zeit) {
  haut(ctx);
  brauen(ctx);
  augen(ctx, zeit);
  nase(ctx);
  mund(ctx);
  feinheiten(ctx);
}

function haut(ctx) {
  for (let y = 40; y <= 122; y++) {
    const b = kopfBreite(y);
    if (b <= 0) continue;
    for (let x = 60 - b; x <= 60 + b; x++) {
      // Wie weit links, wie weit unten? Daraus folgt die Helligkeit.
      const quer = (x - (60 - b)) / (2 * b);
      const tief = (y - 40) / 82;
      let stufe = 3;
      if (quer < 0.42) stufe = 4;
      if (quer < 0.24) stufe = 5;
      if (quer > 0.66) stufe = 2;
      if (quer > 0.86) stufe = 1;
      // Das Gold von unten links wärmt die untere Gesichtshälfte
      const warm = quer < 0.5 && tief > 0.42;
      ctx.fillStyle = warm
        ? (stufe >= 5 ? F.hautWarm2 : F.hautWarm)
        : [F.haut1, F.haut1, F.haut2, F.haut3, F.haut4, F.haut5][stufe];
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Kalte Lichtkante am rechten Rand
  ctx.fillStyle = 'rgba(168,186,210,0.22)';
  for (let y = 46; y <= 112; y++) {
    const b = kopfBreite(y);
    if (b > 2) ctx.fillRect(60 + b - 1, y, 2, 1);
  }
  // Wangenknochen
  ctx.fillStyle = F.hautGlanz;
  for (let i = 0; i < 9; i++) ctx.fillRect(38 + i, 86 + Math.round(i * 0.4), 1, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  for (let i = 0; i < 8; i++) ctx.fillRect(78 - i, 88 + Math.round(i * 0.4), 1, 1);
}

function brauen(ctx) {
  // Schwerer Knochenwulst — das Kennzeichen des Kobolds
  for (let x = 32; x <= 88; x++) {
    const d = Math.abs(x - 60) / 28;
    const y = 64 + Math.round(d * d * 5);
    const h = Math.round(6 - d * 2);
    ctx.fillStyle = x < 60 ? F.haut4 : F.haut2;
    ctx.fillRect(x, y, 1, h);
    ctx.fillStyle = x < 60 ? F.hautGlanz : 'rgba(150,170,196,0.2)';
    ctx.fillRect(x, y, 1, 1);
  }
  // Der Wulst wirft Schatten in die Augenhöhlen
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  for (let x = 34; x <= 86; x++) {
    const d = Math.abs(x - 60) / 28;
    ctx.fillRect(x, 70 + Math.round(d * d * 5), 1, 3);
  }
  // Zornesfalte
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.fillRect(58, 66, 2, 8);
  ctx.fillRect(61, 67, 1, 6);
}

function augen(ctx, zeit) {
  const p = (zeit % 4.4) / 4.4;
  const zu = p > 0.972;
  auge(ctx, 46, 78, zu, true);
  auge(ctx, 74, 78, zu, false);
}

function auge(ctx, cx, cy, zu, links) {
  // Tiefe Höhle
  ctx.fillStyle = F.haut1;
  ellipse(ctx, cx, cy, 10, 7);

  if (zu) {
    ctx.fillStyle = links ? F.haut4 : F.haut2;
    ctx.fillRect(cx - 8, cy - 1, 16, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(cx - 8, cy + 1, 16, 1);
    return;
  }

  // Gelber Augapfel, wie in den alten Porträts
  ctx.fillStyle = links ? F.augeGelb : F.augeGelbDunkel;
  ellipse(ctx, cx, cy, 7, 5);
  // Oberlid legt sich darüber
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(cx - 7, cy - 5, 15, 2);

  // Schmale, senkrechte Pupille — er ist kein Mensch
  ctx.fillStyle = F.pupille;
  ctx.fillRect(cx - 2 + (links ? -1 : -2), cy - 4, 3, 9);
  ctx.fillStyle = F.glanz;
  ctx.fillRect(cx - 3 + (links ? -1 : -2), cy - 3, 1, 1);

  // Lidfalte darunter
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(cx - 8, cy + 5, 16, 1);
  ctx.fillStyle = links ? F.hautWarm2 : F.haut3;
  ctx.fillRect(cx - 7, cy + 6, 14, 1);
}

function nase(ctx) {
  // Schmaler Rücken oben, knollige Spitze unten, deutlich nach links
  // gebogen. Damit sie überhaupt als Nase lesbar wird, braucht sie eine
  // harte Schattenkante rechts und einen Schlagschatten daneben — ohne
  // die verschwindet sie im Gesicht.
  const kante = [];
  for (let y = 66; y <= 102; y++) {
    const t = (y - 66) / 36;
    const b = Math.round(1.5 + Math.pow(t, 2.6) * 10);
    const bogen = Math.round(-Math.sin(t * 2.2) * 3);
    const links = 60 - b + bogen;
    const rechts = 60 + b + bogen;
    kante.push({ y, links, rechts });

    for (let x = links; x <= rechts; x++) {
      const q = (x - links) / (rechts - links || 1);
      let farbe = F.hautWarm;
      if (q < 0.3) farbe = F.hautWarm2;
      else if (q > 0.7) farbe = F.haut2;
      ctx.fillStyle = farbe;
      ctx.fillRect(x, y, 1, 1);
    }
    // Rücken glänzt
    ctx.fillStyle = y < 94 ? F.hautGlanz : F.hautWarm2;
    ctx.fillRect(links + 1, y, 1, 1);
    // harte Kante rechts …
    ctx.fillStyle = F.haut1;
    ctx.fillRect(rechts, y, 1, 1);
    // … und der Schatten, den sie auf die Wange wirft
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(rechts + 1, y, 4, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(rechts + 5, y, 3, 1);
  }

  // Unterkante der Nase: dunkler Abschluss, damit die Spitze vorsteht
  const unten = kante[kante.length - 1];
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fillRect(unten.links, 103, unten.rechts - unten.links + 1, 2);

  // Nasenlöcher, schräg gestellt
  ctx.fillStyle = '#101809';
  ctx.fillRect(unten.links + 1, 99, 4, 3);
  ctx.fillRect(unten.rechts - 5, 98, 4, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(unten.links, 98, 2, 4);
}

function mund(ctx) {
  // Breites, schiefes Grinsen
  const oben = (x) => {
    const t = (x - 34) / 52;
    return 108 + Math.round(-Math.sin(t * Math.PI) * 4 + t * 5);
  };

  for (let x = 34; x <= 86; x++) {
    const y = oben(x);
    ctx.fillStyle = F.mund;
    ctx.fillRect(x, y, 1, 6);
    ctx.fillStyle = F.zunge;
    ctx.fillRect(x, y + 4, 1, 2);
  }

  // Zähne: schief, verschieden lang, mit Lücken
  const zaehne = [35, 40, 45, 51, 57, 63, 69, 75, 81];
  for (let i = 0; i < zaehne.length; i++) {
    const x = zaehne[i];
    const y = oben(x);
    const h = 2 + ((i * 3) % 3);
    ctx.fillStyle = i % 4 === 2 ? F.zahnDunkel : F.zahn;
    ctx.fillRect(x, y, 3, h);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x + 2, y, 1, h);
  }
  // Zwei Hauer aus dem Unterkiefer
  for (const [hx, hh] of [[43, 7], [72, 6]]) {
    const y = oben(hx);
    ctx.fillStyle = F.zahn;
    ctx.fillRect(hx, y + 6 - hh, 3, hh);
    ctx.fillStyle = F.zahnDunkel;
    ctx.fillRect(hx, y + 4, 3, 2);
    ctx.fillStyle = F.glanz;
    ctx.fillRect(hx, y + 6 - hh, 1, 2);
  }

  // Lippen und Kinnschatten
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.fillRect(34, 107, 52, 1);
  for (let x = 36; x <= 84; x++) ctx.fillRect(x, oben(x) + 6, 1, 2);
  ctx.fillStyle = F.hautWarm2;
  for (let x = 40; x <= 62; x++) ctx.fillRect(x, oben(x) + 8, 1, 1);
}

function feinheiten(ctx) {
  // Wangenfalten
  ctx.fillStyle = 'rgba(0,0,0,0.24)';
  for (let i = 0; i < 11; i++) ctx.fillRect(36 + Math.round(i * 0.3), 92 + i, 2, 1);
  for (let i = 0; i < 11; i++) ctx.fillRect(82 - Math.round(i * 0.3), 92 + i, 2, 1);

  // Warzen, weil es sich gehört
  for (const [x, y] of [[41, 84], [79, 92], [50, 58], [72, 100], [66, 60]]) {
    ctx.fillStyle = F.haut1;
    ctx.fillRect(x, y, 3, 2);
    ctx.fillStyle = x < 60 ? F.hautGlanz : F.haut3;
    ctx.fillRect(x, y, 1, 1);
  }

  // Stirnfalten unter dem Saum
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let x = 42; x <= 78; x++) {
    const d = (x - 60) / 30;
    ctx.fillRect(x, 56 + Math.round(d * d * 4), 1, 1);
    if (x > 46 && x < 74) ctx.fillRect(x, 53 + Math.round(d * d * 4), 1, 1);
  }
}

/* ================= Rahmen ================= */

function rahmen(ctx) {
  const B = GOBLIN_BREITE;
  const H = GOBLIN_HOEHE;

  ctx.fillStyle = F.rahmenAussen;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < B; x++) {
      if (!imBogen(x, y)) ctx.fillRect(x, y, 1, 1);
    }
  }

  ctx.fillStyle = F.rahmenStein;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < B; x++) {
      if (!imBogen(x, y) && imBogen(x, y, 8)) ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.fillStyle = F.rahmenSchatten;
  for (let y = 5; y < H; y += 13) {
    for (let x = 0; x < B; x++) {
      if (!imBogen(x, y) && imBogen(x, y, 8)) ctx.fillRect(x, y, 1, 1);
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < B; x++) {
      if (imBogen(x, y) && !imBogen(x, y, -2)) {
        ctx.fillStyle = x < B / 2 ? F.rahmenLicht : F.rahmenSchatten;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

function imBogen(x, y, wachstum = 0) {
  const links = 10 - wachstum;
  const rechts = GOBLIN_BREITE - 10 + wachstum;
  const scheitel = 42 - wachstum;
  if (x < links || x > rechts || y > GOBLIN_HOEHE) return false;
  if (y >= scheitel) return true;
  const r = (rechts - links) / 2;
  const dx = x - GOBLIN_BREITE / 2;
  const dy = y - scheitel;
  return dx * dx + dy * dy <= r * r;
}

/* ================= Hilfsform ================= */

function ellipse(ctx, cx, cy, rx, ry) {
  for (let y = -ry; y <= ry; y++) {
    const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)));
    if (dx > 0) ctx.fillRect(cx - dx, cy + y, dx * 2, 1);
  }
}
