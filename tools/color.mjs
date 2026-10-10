// Color arithmetic for the tools and tests (BUILD_PLAN 4.1, S6; GAME_DESIGN
// 11.1, 11.4, 11.9; decision 68): WCAG 2's relative luminance and contrast
// ratio, OKLab (lightness, chroma) and decision 68's lift. Node only: the
// phone never needs it, so it stays out of web/js/gfx/palette.js.
//
// OKLab is Björn Ottosson's (2020), from linear sRGB, with his published
// matrices.

import { hexToRgb } from '../web/js/gfx/palette.js';

/** sRGB 0-255 -> linear 0-1. @param {number} c */
export function toLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** linear 0-1 -> sRGB 0-255, rounded and clamped. @param {number} c */
export function fromLinear(c) {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, v)) * 255);
}

/** WCAG 2's relative luminance of '#rrggbb'. @param {string} hex */
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG 2's contrast ratio of two colors (1 to 21).
 * @param {string} a '#rrggbb'
 * @param {string} b '#rrggbb'
 */
export function contrastRatio(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** '#rrggbb' -> OKLab [L, a, b]. @param {string} hex */
export function oklab(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLab [L, a, b] -> '#rrggbb'. @param {number[]} lab */
export function fromOklab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(fromLinear);
  return `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** OKLab chroma, the distance from grey. @param {string} hex */
export function chroma(hex) {
  const [, a, b] = oklab(hex);
  return Math.hypot(a, b);
}

/**
 * Decision 68's lift: OKLab lightness L becomes L + 0.18 x (1 - L)^2, its
 * a and b (hue and chroma) kept, so the darks lift most and snow and paper
 * cream barely move.
 * @param {string} hex
 */
export function lift(hex) {
  const [L, a, b] = oklab(hex);
  return fromOklab([L + 0.18 * (1 - L) ** 2, a, b]);
}
