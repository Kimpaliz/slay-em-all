// Alles, was aus Einzelpunkten besteht: Recken, Trümmer, Münzen, Tiere.
//
// Jede Figur wird bei ganzen Bildpunkten gezeichnet (`Math.round`), weil
// die Leinwand ohne Glättung läuft. Ein halber Bildpunkt würde nicht
// weich aussehen, sondern die Farbe eines ganzen Punktes verfälschen.
//
// Die Recken sind sechs Punkte breit. Alles hängt an `oben`, dem
// Scheitelpunkt: Kopf, Rumpf, Arme und Waffe werden von dort nach unten
// gerechnet, damit große und kleine Klassen dieselbe Bauform teilen.

import { MASSE, streu } from './masse.js';
import { artefaktMalen } from './artefakt-bild.js';
import { seltenheitNach } from './artefakte.js';

/* ---------------- Recken ---------------- */

export function reckeZeichnen(ctx, r, zeit) {
  const k = r.klasse;
  const x = Math.round(r.x);
  const fuesse = MASSE.DECK;
  const hoehe = k.hoehe;

  const laeuft = !r.wartet;
  const schritt = laeuft ? Math.sin(zeit * 8.5 + r.phase) : 0;
  const wippen = laeuft && Math.sin(zeit * 17 + r.phase) < 0 ? 1 : 0;
  const oben = fuesse - hoehe - wippen;
  const vorne = schritt > 0;

  // Die Heilaura liegt unter allem anderen — ein pulsierender grüner
  // Schein, dessen Radius genau der Reichweite entspricht. Wer ihn
  // sieht, weiß, wen er zuerst umlegen sollte.
  if (k.heilt) {
    const puls = 0.72 + 0.28 * Math.sin(zeit * 2.4 + r.phase);
    const rw = k.heilt.reichweite;
    const mitte = x + 3;
    const schein = ctx.createRadialGradient(mitte, fuesse - 8, 2, mitte, fuesse - 8, rw);
    schein.addColorStop(0, 'rgba(126, 214, 150, ' + (0.26 * puls).toFixed(3) + ')');
    schein.addColorStop(0.6, 'rgba(90, 190, 130, ' + (0.10 * puls).toFixed(3) + ')');
    schein.addColorStop(1, 'rgba(90, 190, 130, 0)');
    ctx.fillStyle = schein;
    ctx.fillRect(mitte - rw, fuesse - 8 - rw, rw * 2, rw * 2);
    // Ein flacher Ring auf den Planken zeigt die Reichweite hart.
    ctx.globalAlpha = 0.30 * puls;
    ctx.fillStyle = '#8fd39a';
    ctx.fillRect(mitte - rw, fuesse, rw * 2, 1);
    ctx.globalAlpha = 1;
  }

  // Schatten
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x, fuesse, k.breit ? 8 : 6, 1);

  if (k.umhang) {
    ctx.fillStyle = k.umhang;
    ctx.fillRect(x - 2, oben + 5, 2, hoehe - 7);
    ctx.fillRect(x - 3, oben + 7, 1, hoehe - 10);
  }

  // Beine
  ctx.fillStyle = k.stiefel;
  if (laeuft) {
    ctx.fillRect(x + (vorne ? 4 : 1), fuesse - 3, 2, 3);
    ctx.fillRect(x + (vorne ? 1 : 4), fuesse - 2, 2, 2);
  } else {
    ctx.fillRect(x + 1, fuesse - 3, 2, 3);
    ctx.fillRect(x + 4, fuesse - 3, 2, 3);
  }

  // Rumpf. Der Panzerritter ist zwei Punkte breiter — man soll ihn im
  // Getümmel sofort erkennen, denn er ist der, der das Tor verstopft.
  const breite = k.breit ? 7 : 5;
  ctx.fillStyle = k.rumpf;
  ctx.fillRect(x + 1, oben + 4, breite, hoehe - 6);
  if (k.breit) {
    // Schulterplatten und ein Gürtel aus Metall
    ctx.fillStyle = k.metall;
    ctx.fillRect(x, oben + 4, 9, 2);
    ctx.fillRect(x + 1, oben + Math.round(hoehe * 0.6), breite, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(x, oben + 4, 9, 1);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x + 1, oben + 4, 1, hoehe - 6);
  ctx.fillStyle = k.arm;
  ctx.fillRect(x + 2, oben + 4, 4, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + 2, oben + Math.max(7, hoehe - 5), 4, 1);
  ctx.fillStyle = k.arm;
  ctx.fillRect(x + 5, oben + 5, 2, 2);

  // Kopf
  ctx.fillStyle = k.haut;
  ctx.fillRect(x + 2, oben + 1, 3, 3);
  if (k.helm) {
    ctx.fillStyle = k.metall;
    ctx.fillRect(x + 2, oben - 1, 4, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x + 2, oben + 1, 3, 1);
    if (k.umhang) {
      ctx.fillStyle = k.schild;
      ctx.fillRect(x + 3, oben - 3, 1, 2);
    }
  } else {
    ctx.fillStyle = k.kopf;
    ctx.fillRect(x + 1, oben, 5, 2);
  }

  // Wer gerade geheilt wurde, schimmert kurz grün auf.
  if (r.geheilt > 0) {
    ctx.globalAlpha = Math.min(0.7, r.geheilt * 2);
    ctx.fillStyle = '#8fd39a';
    ctx.fillRect(x + 1, oben, breite, hoehe - 2);
    ctx.globalAlpha = 1;
  }

  // Waffe — je höher der Rang, desto länger die Klinge
  ctx.fillStyle = '#4a3a26';
  ctx.fillRect(x + 7, oben + 1, 1, hoehe - 2);
  ctx.fillStyle = k.metall;
  if (k.id === 'bauer') {
    ctx.fillRect(x + 6, oben - 1, 3, 1);
    ctx.fillRect(x + 6, oben - 2, 1, 1);
    ctx.fillRect(x + 8, oben - 2, 1, 1);
  } else if (k.id === 'soeldner') {
    ctx.fillRect(x + 7, oben - 3, 1, 4);
    ctx.fillRect(x + 6, oben + 1, 3, 1);
  } else if (k.heilt) {
    // Kein Schwert, sondern ein Stab mit leuchtendem Knauf.
    ctx.fillStyle = '#5c4a32';
    ctx.fillRect(x + 7, oben - 4, 1, hoehe + 2);
    const glut = 0.6 + 0.4 * Math.sin(zeit * 3.6 + r.phase);
    ctx.fillStyle = '#8fd39a';
    ctx.fillRect(x + 6, oben - 6, 3, 3);
    ctx.globalAlpha = glut;
    ctx.fillStyle = '#dff5e4';
    ctx.fillRect(x + 7, oben - 5, 1, 1);
    ctx.globalAlpha = 1;
  } else if (k.breit) {
    // Ein wuchtiger Streitkolben statt einer Klinge.
    ctx.fillRect(x + 9, oben - 2, 1, hoehe);
    ctx.fillRect(x + 8, oben - 5, 3, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x + 8, oben - 5, 3, 1);
  } else {
    ctx.fillRect(x + 7, oben - 4, 1, 5);
    ctx.fillRect(x + 6, oben - 4, 3, 1);
  }

  if (k.schild) {
    ctx.fillStyle = k.schild;
    ctx.fillRect(x - 1, oben + 5, 2, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(x - 1, oben + 5, 2, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, oben + 7, 1, 3);
  }

  // Ein brennender Recke trägt kleine Flammen
  if (r.brand) {
    for (let i = 0; i < 3; i++) {
      const fx = x + 1 + ((streu(i * 7 + zeit * 30) * 5) | 0);
      const fh = 2 + ((streu(i * 3 + zeit * 45) * 3) | 0);
      ctx.fillStyle = i % 2 ? '#ff7a2a' : '#ffd08a';
      ctx.fillRect(fx, oben - fh, 1, fh);
    }
  }

  // Gift und Frost tragen ihre eigenen Zeichen: grüne Blasen über der
  // Schulter, blaue Kristalle an den Stiefeln.
  if (r.gift && r.gift.length) {
    ctx.fillStyle = '#7fd48a';
    for (let i = 0; i < Math.min(3, r.gift.length); i++) {
      const gx = x + 1 + ((streu(i * 5 + zeit * 12) * 5) | 0);
      const gy = oben + 1 + ((streu(i * 9 + zeit * 8) * 3) | 0);
      ctx.fillRect(gx, gy, 1, 1);
    }
  }
  if (r.frost) {
    ctx.fillStyle = '#9ecbff';
    ctx.fillRect(x + 1, fuesse - 2, 1, 2);
    ctx.fillRect(x + 4, fuesse - 1, 2, 1);
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x + 1, oben + 4, 5, hoehe - 6);
    ctx.globalAlpha = 1;
  }

  // Trefferblitz
  if (r.getroffen > 0) {
    ctx.globalAlpha = Math.min(0.8, r.getroffen * 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 1, oben, 5, hoehe - 2);
    ctx.globalAlpha = 1;
  }

  // Lebensbalken — bei Verletzten, sonst wäre das Bild voller Balken.
  // Ein Boss trägt ihn immer, damit man den Fortschritt sieht.
  if (r.lp < r.maxLp || r.boss) {
    const breite = 6;
    const gefuellt = Math.max(1, Math.round(breite * r.lp / r.maxLp));
    ctx.fillStyle = 'rgba(6,7,12,0.8)';
    ctx.fillRect(x, oben - 6, breite + 1, 2);
    ctx.fillStyle = r.boss ? '#e0b64f' : '#c1444f';
    ctx.fillRect(x, oben - 6, gefuellt, 1);
  }
}

/** Ein Recke, der gerade zu Asche zerfällt. */
export function brennendenZeichnen(ctx, b) {
  const gross = b.groesse || 1;
  if (gross !== 1) {
    ctx.save();
    ctx.translate(b.x, MASSE.DECK);
    ctx.scale(gross, gross);
    ctx.translate(-b.x, -MASSE.DECK);
  }
  const x = Math.round(b.x);
  const k = b.klasse;
  const anteil = Math.min(1, b.zeit / 1.1);
  const hoehe = Math.round(k.hoehe * (1 - anteil * 0.55));
  const oben = MASSE.DECK - hoehe;

  ctx.fillStyle = anteil < 0.3 ? k.rumpf : anteil < 0.6 ? '#3a2a22' : '#1c1712';
  ctx.fillRect(x + 1, oben + 2, 5, Math.max(1, hoehe - 2));
  ctx.fillStyle = anteil < 0.5 ? k.haut : '#2a211c';
  ctx.fillRect(x + 2, oben, 3, 3);

  if (b.zeit < 0.75) {
    for (let i = 0; i < 5; i++) {
      const fx = x + ((streu(i + b.zeit * 40) * 7) | 0);
      const fh = 2 + ((streu(i * 3 + b.zeit * 60) * 5) | 0);
      ctx.fillStyle = i % 2 ? '#ff7a2a' : '#ffd08a';
      ctx.fillRect(fx, oben - fh + 2, 1, fh);
    }
  }
  if (anteil > 0.5) {
    ctx.fillStyle = '#4a4640';
    for (let i = 0; i < 4; i++) {
      const px = x + ((streu(i + b.zeit * 30) * 7) | 0);
      ctx.fillRect(px, MASSE.DECK - 1 - ((streu(i * 7 + b.zeit * 20) * 3) | 0), 1, 1);
    }
  }
  if (gross !== 1) ctx.restore();
}

/* ---------------- Trümmer ---------------- */

export function truemmerZeichnen(ctx, t) {
  const x = Math.round(t.x);
  const y = Math.round(t.y);
  const quer = Math.sin(t.dreh) > 0;

  if (t.art === 'helm') {
    ctx.fillStyle = t.metall;
    ctx.fillRect(x, y - 2, 5, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x + (quer ? 1 : 3), y - 1, 1, 1);
    ctx.fillStyle = '#5b1216';
    ctx.fillRect(x + 1, y, 3, 1);
    return;
  }
  if (t.art === 'schild') {
    ctx.fillStyle = t.schild;
    ctx.fillRect(x, y - 5, 4, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x, y - 5, 4, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x + (quer ? 1 : 2), y - 3, 1, 3);
    ctx.fillStyle = '#6e161c';
    ctx.fillRect(x + 1, y - 1, 2, 1);
    return;
  }
  if (t.art === 'schaedel') {
    ctx.fillStyle = '#cfcbb6';
    ctx.fillRect(x, y - 3, 4, 3);
    ctx.fillRect(x + 1, y, 2, 1);
    ctx.fillStyle = '#2c2a26';
    ctx.fillRect(x, y - 2, 1, 1);
    ctx.fillRect(x + 3, y - 2, 1, 1);
    ctx.fillStyle = '#7c1a20';
    ctx.fillRect(x + 1, y - 3, 2, 1);
    return;
  }
  if (t.art === 'kopf') {
    ctx.fillStyle = t.haut;
    ctx.fillRect(x, y - 3, 3, 3);
    ctx.fillStyle = '#2a1f1a';
    ctx.fillRect(x, y - 3, 3, 1);
    ctx.fillStyle = '#8e1f28';
    ctx.fillRect(x, y, 3, 1);
    return;
  }
  if (t.art === 'rumpf') {
    ctx.fillStyle = t.farbe;
    ctx.fillRect(x, y - 4, 4, 4);
    ctx.fillStyle = '#8e1f28';
    ctx.fillRect(x, y - 4, 4, 1);
    ctx.fillRect(x, y, 4, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(x, y - 3, 1, 2);
    return;
  }

  // Arm oder Bein
  const laenge = t.art === 'bein' ? 5 : 4;
  ctx.fillStyle = t.farbe;
  if (quer) ctx.fillRect(x, y - 1, laenge, 2);
  else ctx.fillRect(x, y - laenge, 2, laenge);
  ctx.fillStyle = '#8e1f28';
  if (quer) ctx.fillRect(x, y - 1, 1, 2);
  else ctx.fillRect(x, y - 1, 2, 1);
  ctx.fillStyle = t.haut;
  if (quer) ctx.fillRect(x + laenge - 1, y - 1, 1, 2);
  else ctx.fillRect(x, y - laenge, 2, 1);
}

/** Was liegen geblieben ist — Helme, Schilde, Asche auf den Planken. */
export function restZeichnen(ctx, rest) {
  const x = Math.round(rest.x);
  const DECK = MASSE.DECK;

  if (rest.art === 'asche') {
    ctx.fillStyle = '#4a4640'; ctx.fillRect(x, DECK - 2, 5, 2);
    ctx.fillStyle = '#2f2c28'; ctx.fillRect(x + 1, DECK - 1, 3, 1);
    ctx.fillStyle = '#6a655c'; ctx.fillRect(x + 2, DECK - 2, 1, 1);
  } else if (rest.art === 'helm') {
    ctx.fillStyle = rest.farbe || '#949aaa'; ctx.fillRect(x, DECK - 3, 5, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + (rest.verbeult ? 1 : 3), DECK - 3, 1, 1);
    ctx.fillStyle = '#5b1216'; ctx.fillRect(x + 1, DECK - 1, 3, 1);
  } else if (rest.art === 'schild') {
    ctx.fillStyle = rest.farbe || '#4d4380'; ctx.fillRect(x, DECK - 6, 4, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x, DECK - 6, 4, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x + 2, DECK - 4, 1, 3);
  } else if (rest.art === 'schaedel') {
    ctx.fillStyle = '#cfcbb6'; ctx.fillRect(x, DECK - 3, 4, 3);
    ctx.fillStyle = '#2c2a26'; ctx.fillRect(x, DECK - 2, 1, 1); ctx.fillRect(x + 3, DECK - 2, 1, 1);
  } else if (rest.art === 'kopf') {
    ctx.fillStyle = rest.haut || '#c39066'; ctx.fillRect(x, DECK - 3, 3, 3);
    ctx.fillStyle = '#2a1f1a'; ctx.fillRect(x, DECK - 3, 3, 1);
    ctx.fillStyle = '#7c1a20'; ctx.fillRect(x, DECK - 1, 3, 1);
  } else if (rest.art === 'rumpf') {
    ctx.fillStyle = rest.farbe; ctx.fillRect(x, DECK - 3, 5, 3);
    ctx.fillStyle = '#8e1f28'; ctx.fillRect(x, DECK - 1, 5, 1); ctx.fillRect(x, DECK - 3, 1, 3);
  } else {
    ctx.fillStyle = rest.farbe; ctx.fillRect(x, DECK - 2, rest.art === 'bein' ? 5 : 4, 2);
    ctx.fillStyle = '#8e1f28'; ctx.fillRect(x, DECK - 2, 1, 2);
    ctx.fillStyle = rest.haut || '#c39066'; ctx.fillRect(x + (rest.art === 'bein' ? 4 : 3), DECK - 2, 1, 2);
  }
}

/**
 * Ein Putzgoblin.
 *
 * Klein, gruen, mit Eimer. Beim Wischen beugt er sich vor und der Lappen
 * wischt hin und her — damit man auf einen Blick sieht, ob er arbeitet
 * oder nur unterwegs ist.
 */
export function wischerZeichnen(ctx, g) {
  const x = Math.round(g.x);
  const fuss = MASSE.DECK;
  const wischt = g.tun === 'wischt';
  const buecken = wischt ? 2 : 0;
  const oben = fuss - 9 + buecken;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x - 1, fuss, 6, 1);

  // Beine
  const schritt = g.tun !== 'wischt' && Math.sin(g.phase) > 0;
  ctx.fillStyle = '#2c3d1c';
  ctx.fillRect(x + (schritt ? 3 : 0), fuss - 3, 2, 3);
  ctx.fillRect(x + (schritt ? 0 : 3), fuss - 2, 2, 2);

  // Rumpf und Kopf
  ctx.fillStyle = '#5d7a3a';
  ctx.fillRect(x, oben + 3, 5, 5);
  ctx.fillStyle = '#82a054';
  ctx.fillRect(x + 1, oben, 4, 4);
  ctx.fillStyle = '#42582a';
  ctx.fillRect(x, oben + 1, 1, 2);       // Ohr links
  ctx.fillRect(x + 5, oben + 1, 1, 2);   // Ohr rechts
  ctx.fillStyle = '#17130f';
  ctx.fillRect(x + 2, oben + 2, 1, 1);

  // Eimer
  ctx.fillStyle = '#6a6f7d';
  ctx.fillRect(x + 5, fuss - 4, 4, 4);
  ctx.fillStyle = '#8d1f26';
  ctx.fillRect(x + 6, fuss - 3, 2, 2);

  // Lappen: beim Wischen hin und her
  if (wischt) {
    const hin = Math.sin(g.phase * 2) > 0 ? 0 : 3;
    ctx.fillStyle = '#c8b8a0';
    ctx.fillRect(x - 3 + hin, fuss - 2, 4, 2);
    ctx.fillStyle = '#8d1f26';
    ctx.fillRect(x - 3 + hin, fuss - 1, 4, 1);
  }
}

/* ---------------- Beute und Tiere ---------------- */

/**
 * Ein gefallenes Artefakt auf den Planken.
 *
 * Es funkelt deutlich auffälliger als eine Münze — ein Fund darf nicht
 * übersehen werden. Der Schein trägt die Seltenheitsfarbe, damit man
 * schon von weitem sieht, ob es sich lohnt hinzusehen.
 */
export function fundstueckZeichnen(ctx, f, zeit) {
  const x = Math.round(f.x) - 4;
  const y = Math.round(f.y) - 4;
  const s = seltenheitNach(f.artefakt.seltenheit);
  const puls = 0.45 + 0.35 * Math.sin(zeit * 4 + f.phase);

  ctx.globalAlpha = puls;
  ctx.fillStyle = s.farbe;
  ctx.fillRect(x - 2, y + 3, 12, 2);
  ctx.fillRect(x + 3, y - 2, 2, 12);
  ctx.globalAlpha = 1;

  artefaktMalen(ctx, x, y, 8, f.artefakt);

  if (Math.sin(zeit * 7 + f.phase) > 0.75) {
    ctx.fillStyle = '#fff6c8';
    ctx.fillRect(x + 8, y - 1, 1, 1);
  }
}

/** Eine Glut der Aschenkrone auf den Planken. */
export function glutZeichnen(ctx, g, zeit) {
  const x = Math.round(g.x);
  const flacker = Math.sin(zeit * 9 + x) > 0;
  ctx.fillStyle = 'rgba(16,14,12,0.8)';
  ctx.fillRect(x - 3, MASSE.DECK, 6, 2);
  ctx.fillStyle = flacker ? '#ff7a2a' : '#b32a12';
  ctx.fillRect(x - 2, MASSE.DECK, 4, 1);
  ctx.fillStyle = '#ffd08a';
  ctx.fillRect(x + (flacker ? -1 : 1), MASSE.DECK - 1, 1, 1);
}

export function muenzeZeichnen(ctx, m, zeit) {
  const x = Math.round(m.x);
  const y = Math.round(m.y);

  /*
    Ein Edelstein statt Kleingeld.

    Er ist groesser, hat eine geschliffene Silhouette und funkelt in
    einem eigenen Takt — man soll ihn quer ueber die Bruecke von einer
    Muenze unterscheiden koennen, ohne die Zahl daneben zu lesen.
  */
  if (m.stein) {
    ctx.fillStyle = '#6b3f8f'; ctx.fillRect(x - 2, y - 3, 6, 6);
    ctx.fillStyle = '#9a5fc4'; ctx.fillRect(x - 1, y - 4, 4, 7);
    ctx.fillStyle = '#c98fe8'; ctx.fillRect(x - 1, y - 3, 2, 3);
    ctx.fillStyle = '#e8cbff'; ctx.fillRect(x, y - 3, 1, 1);
    ctx.fillStyle = '#4a2a63'; ctx.fillRect(x + 2, y, 1, 2);
    if (Math.sin(zeit * 4 + m.phase) > 0.86) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 1, y - 4, 1, 1);
      ctx.fillRect(x - 2, y + 1, 1, 1);
    }
    return;
  }

  ctx.fillStyle = '#a5761f'; ctx.fillRect(x - 1, y - 1, 4, 3);
  ctx.fillStyle = '#e0b64f'; ctx.fillRect(x - 1, y - 1, 3, 2);
  ctx.fillStyle = '#f6d492'; ctx.fillRect(x - 1, y - 1, 1, 1);
  // Größere Beträge liegen als Stapel
  if (m.wert > 3) {
    ctx.fillStyle = '#e0b64f'; ctx.fillRect(x, y - 3, 3, 2);
    ctx.fillStyle = '#a5761f'; ctx.fillRect(x + 2, y - 2, 1, 1);
  }
  // Gelegentliches Blinken, damit liegendes Gold auffällt
  if (m.liegt && Math.sin(zeit * 3 + m.phase) > 0.93) {
    ctx.fillStyle = '#fff6c8'; ctx.fillRect(x + 1, y - 2, 1, 1);
  }
}

export function rabeZeichnen(ctx, rabe) {
  const x = Math.round(rabe.x);
  const fliegt = rabe.fliegt > 0;
  const y = Math.round(MASSE.DECK - 4 + (fliegt ? rabe.y : 0));

  ctx.fillStyle = '#1b1d2c';
  ctx.fillRect(x, y + 1, 4, 3);
  ctx.fillRect(x + 3, y, 2, 2);
  ctx.fillStyle = '#2e3145'; ctx.fillRect(x + 1, y + 1, 2, 1);
  ctx.fillStyle = '#c48a3a'; ctx.fillRect(x + 5, y + 1, 1, 1);
  ctx.fillStyle = '#1b1d2c';
  if (fliegt) {
    const hoch = Math.sin(rabe.fluegel) > 0;
    ctx.fillRect(x - 2, y + (hoch ? -1 : 3), 3, 1);
    ctx.fillRect(x + 1, y + (hoch ? -2 : 4), 2, 1);
  } else {
    ctx.fillRect(x, y + 4, 1, 1);
    ctx.fillRect(x + 2, y + 4, 1, 1);
  }
}

export function schuetzeZeichnen(ctx, x, mauerOben, i, zeit) {
  const wippen = Math.sin(zeit * 2 + i * 1.7) > 0.7 ? 1 : 0;
  ctx.fillStyle = '#2f4022'; ctx.fillRect(x, mauerOben - 10 - wippen, 4, 5);
  ctx.fillStyle = '#5d7a3a'; ctx.fillRect(x + 1, mauerOben - 13 - wippen, 3, 3);
  ctx.fillStyle = '#42582a'; ctx.fillRect(x + 1, mauerOben - 14 - wippen, 3, 1);
  ctx.fillStyle = '#4a3a26'; ctx.fillRect(x - 2, mauerOben - 14 - wippen, 1, 8);
  ctx.fillStyle = '#d8d2b8'; ctx.fillRect(x - 2, mauerOben - 11 - wippen, 1, 1);
}

export function drachlingZeichnen(ctx, d, zeit) {
  const x = Math.round(d.x);
  const y = Math.round(d.y);
  const hoch = Math.sin(zeit * 9) > 0;

  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - 2, MASSE.DECK, 6, 1);
  ctx.fillStyle = '#a34322';
  ctx.fillRect(x - 4, y + (hoch ? -3 : 0), 3, 2);
  ctx.fillRect(x + 4, y + (hoch ? -3 : 0), 3, 2);
  ctx.fillStyle = '#c65a28'; ctx.fillRect(x - 2, y - 1, 7, 4);
  ctx.fillStyle = '#e07a36'; ctx.fillRect(x - 2, y - 1, 7, 2);
  ctx.fillStyle = '#e8b46a'; ctx.fillRect(x - 1, y + 1, 5, 1);
  ctx.fillStyle = '#e07a36'; ctx.fillRect(x + 4, y - 3, 3, 3);
  ctx.fillStyle = '#fce97a'; ctx.fillRect(x + 6, y - 2, 1, 1);
  ctx.fillStyle = '#c65a28'; ctx.fillRect(x - 4, y + 1, 2, 1);
}

/** Eine Fackel an der Mauer — Flamme und Lichtschein. */
export function fackelZeichnen(ctx, x, y, zeit) {
  const flackern = Math.sin(zeit * 7.3) * 0.5 + Math.sin(zeit * 12.1) * 0.5;
  const hoehe = 3 + Math.round(Math.abs(flackern) * 2);

  const schein = ctx.createRadialGradient(x + 1, y, 1, x + 1, y, 16 + hoehe);
  schein.addColorStop(0, 'rgba(255,150,60,0.34)');
  schein.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = schein;
  ctx.fillRect(x - 18, y - 18, 40, 40);

  ctx.fillStyle = '#3a2c1c'; ctx.fillRect(x, y + 2, 2, 5);
  ctx.fillStyle = '#ff7a2a'; ctx.fillRect(x, y - hoehe, 2, hoehe + 2);
  ctx.fillStyle = '#ffd08a'; ctx.fillRect(x, y - hoehe + 1, 1, Math.max(1, hoehe - 1));
  if (Math.random() < 0.3) {
    ctx.fillStyle = 'rgba(255,180,90,0.7)';
    ctx.fillRect(x + (Math.random() < 0.5 ? 0 : 1), y - hoehe - 2 - Math.round(Math.random() * 3), 1, 1);
  }
}

/** Eine hängende Kette — die Zugbrücke hängt an zweien davon. */
export function ketteZeichnen(ctx, x0, y0, x1, y1, farbe) {
  const glieder = 46;
  for (let i = 0; i <= glieder; i++) {
    const t = i / glieder;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 5);
    ctx.fillStyle = i % 2 ? farbe : 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, 1, 1);
  }
}
