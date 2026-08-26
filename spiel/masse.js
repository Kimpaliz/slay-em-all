// Alle festen Maße der Szene, in Bildpunkten des 480×200-Bildes.
// Das Bild wird per CSS auf die Seitenbreite gezogen; gerechnet wird immer
// in diesen Zahlen, damit die Pixeloptik erhalten bleibt.

export const MASSE = {
  breite: 480,
  hoehe: 200,

  /** Höhe der Brückenplanken. Alles, was "auf dem Boden" liegt, liegt hier. */
  planke: 146,
  /** Rechter Rand der linken Klippe — hier beginnt die Zugbrücke. */
  klippe: 118,
  /** Linker Rand des Burgfelsens. */
  mauer: 296,

  /** Linke und rechte Kante der Toröffnung. */
  torLinks: 300,
  torRechts: 336,
  /** Mittelpunkt und Radius des Torbogens. */
  torMitteX: 318,
  torMitteY: 108,
  torRadius: 18,

  /** Ab hier gilt ein Recke als verschluckt. */
  eintritt: 307
};
