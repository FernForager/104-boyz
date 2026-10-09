// Deterministic exp, ln, pow, sin and cos (BUILD_PLAN 2.3, 6.6; GAME_DESIGN
// E.12 #3).
//
// PURE. JavaScript lets each engine approximate Math.exp, Math.log,
// Math.pow and the trig functions its own way, so V8 (Node) and
// JavaScriptCore (the phone) can differ in the last bit, and a roll on that
// bit would go differently. These use only exactly rounded IEEE operations
// (+ - * /, Math.round, comparisons) and literal coefficients, so they
// return the same bits everywhere. The literals are the "build-time tables"
// of 2.3: polynomials, not lookup arrays.
//
// - exp: fdlibm's reduction, x = k ln2 + r with ln2 split in two
//   (LN2_HI's trailing zero bits keep k * LN2_HI exact for every k in
//   range), its rational kernel on |r| <= 0.35 (P1 to P5, a degree-10
//   polynomial in r with one division, within an ulp), and 2^k built
//   exactly by binary exponentiation of 2.
// - ln: x = m 2^e with m in [sqrt(1/2), sqrt(2)) by exact halving and
//   doubling, f = (m - 1) / (m + 1), ln m = 2(f + f^3/3 + ... + f^21/21)
//   (Horner in f^2), then e LN2_HI + (e LN2_LO + ln m).
// - pow: repeated multiplication for a small integer y, else exp(y ln x),
//   with the exact cases and the sign for a negative x and an integer y.
// - sin, cos: k = round(x 2/pi), r = x - k pi/2 in three 33-bit parts
//   (fdlibm's PIO2_1, _2, _3: each k * part is exact for |k| < 2^20), then
//   fdlibm's minimax kernels (degree 13 odd for sin, 14 even for cos) on
//   |r| <= pi/4, and the quadrant from k & 3.
//
// Out of its domain each throws EngineError('expr'); none returns NaN, an
// infinity or -0. Nothing in S3's live content calls them; the self-check's
// math group pins their bits on the phone.

import { EngineError } from './error.js';

/** pi, the nearest double. */
export const PI = 3.141592653589793;

// exp (fdlibm e_exp.c; the hex in each comment is the double's bits).
const LN2_HI = 6.93147180369123816490e-01; // 0x3FE62E42 FEE00000
const LN2_LO = 1.90821492927058770002e-10; // 0x3DEA39EF 35793C76
const INV_LN2 = 1.44269504088896338700e+00; // 0x3FF71547 652B82FE
const P1 = 1.66666666666666019037e-01; // 0x3FC55555 5555553E
const P2 = -2.77777777770155933842e-03; // 0xBF66C16C 16BEBD93
const P3 = 6.61375632143793436117e-05; // 0x3F11566A AF25DE2C
const P4 = -1.65339022054652515390e-06; // 0xBEBBBD41 C5D26BF1
const P5 = 4.13813679705723846039e-08; // 0x3E663769 72BEA4D0
/** exp's domain: |x| <= EXP_MAX, so the result is a normal double. */
export const EXP_MAX = 700;

// ln: 2 / (2j + 1), j = 1 to 10.
const L1 = 0.6666666666666666;
const L2 = 0.4;
const L3 = 0.2857142857142857;
const L4 = 0.2222222222222222;
const L5 = 0.18181818181818182;
const L6 = 0.15384615384615385;
const L7 = 0.13333333333333333;
const L8 = 0.11764705882352941;
const L9 = 0.10526315789473684;
const L10 = 0.09523809523809523;
const SQRT2 = 1.4142135623730951;

// sin and cos (fdlibm e_rem_pio2.c, k_sin.c, k_cos.c).
const TWO_OVER_PI = 6.36619772367581382433e-01; // 0x3FE45F30 6DC9C883
const PIO2_1 = 1.57079632673412561417e+00; // 0x3FF921FB 54400000, the first 33 bits of pi/2
const PIO2_2 = 6.07710050630396597660e-11; // 0x3DD0B461 1A600000, the next 33
const PIO2_3 = 2.02226624871116645580e-21; // 0x3BA3198A 2E000000, the next 33
const S1 = -1.66666666666666324348e-01; // 0xBFC55555 55555549
const S2 = 8.33333333332248946124e-03; // 0x3F811111 1110F8A6
const S3 = -1.98412698298579493134e-04; // 0xBF2A01A0 19C161D5
const S4 = 2.75573137070700676789e-06; // 0x3EC71DE3 57B1FE7D
const S5 = -2.50507602534068634195e-08; // 0xBE5AE5E6 8A2B9CEB
const S6 = 1.58969099521155010221e-10; // 0x3DE5D93A 5ACFD57C
const C1 = 4.16666666666666019037e-02; // 0x3FA55555 5555554C
const C2 = -1.38888888888741095749e-03; // 0xBF56C16C 16C15177
const C3 = 2.48015872894767294178e-05; // 0x3EFA01A0 19CB1590
const C4 = -2.75573143513906633035e-07; // 0xBE927E4F 809C52AD
const C5 = 2.08757232129817482790e-09; // 0x3E21EE9E BDB4B1C4
const C6 = -1.13596475577881948265e-11; // 0xBDA8FAE9 BE8838D4
/** sin's and cos's domain: |x| <= TRIG_MAX. */
export const TRIG_MAX = 1e5;

/** 2^(2^i) and 2^-(2^i), i = 0 to 9, by squaring (each exact). */
const UP = [2];
const DOWN = [0.5];
for (let i = 1; i < 10; i++) {
  UP.push(UP[i - 1] * UP[i - 1]);
  DOWN.push(DOWN[i - 1] * DOWN[i - 1]);
}

/** @param {string} what */
const domain = (what) => new EngineError('expr', `math: ${what} is out of its domain`);
/** @param {number} v */
const noNegZero = (v) => (v === 0 ? 0 : v);

/**
 * 2^k, exactly, for an integer k from -1074 to 1023.
 * @param {number} k
 */
export function twoPow(k) {
  let n = k < 0 ? -k : k;
  let base = k < 0 ? 0.5 : 2;
  let out = 1;
  while (n > 0) {
    if (n % 2 === 1) out *= base;
    n = Math.floor(n / 2);
    if (n > 0) base *= base;
  }
  return out;
}

/**
 * e^x, for |x| <= 700.
 * @param {number} x
 */
export function exp(x) {
  if (typeof x !== 'number' || !(x >= -EXP_MAX && x <= EXP_MAX)) throw domain('exp');
  if (x === 0) return 1;
  const k = noNegZero(Math.round(x * INV_LN2));
  const hi = x - k * LN2_HI;
  const lo = k * LN2_LO;
  const r = hi - lo;
  const rr = r * r;
  const c = r - rr * (P1 + rr * (P2 + rr * (P3 + rr * (P4 + rr * P5))));
  const y = 1 - (lo - (r * c) / (2 - c) - hi);
  return k === 0 ? y : y * twoPow(k);
}

/**
 * The natural logarithm, for a finite x > 0.
 * @param {number} x
 */
export function ln(x) {
  if (typeof x !== 'number' || !(x > 0) || x === Infinity) throw domain('ln');
  if (x === 1) return 0;
  let m = x;
  let e = 0;
  for (let i = 9; i >= 0; i--) {
    if (m >= UP[i]) {
      m *= DOWN[i];
      e += 1 << i;
    }
  }
  while (m < DOWN[9]) {
    m *= UP[9];
    e -= 512;
  }
  for (let i = 8; i >= 0; i--) {
    if (m < DOWN[i]) {
      m *= UP[i];
      e -= 1 << i;
    }
  }
  if (m < 1) {
    m *= 2;
    e -= 1;
  }
  if (m >= SQRT2) {
    m *= 0.5;
    e += 1;
  }
  const f = (m - 1) / (m + 1);
  const s = f * f;
  const lnm = f * (2 + s * (L1 + s * (L2 + s * (L3 + s * (L4 + s * (L5 + s * (L6 + s * (L7 + s * (L8 + s * (L9 + s * L10))))))))));
  return noNegZero(e * LN2_HI + (e * LN2_LO + lnm));
}

/** Integer powers up to this are repeated multiplication (exact when the result is). */
const INT_POW_MAX = 64;

/**
 * x^y: 1 for y = 0; x for y = 1; 0 for x = 0 and y > 0; repeated
 * multiplication for an integer |y| <= 64 (so 2^3 is 8); otherwise
 * exp(y ln |x|) (|y ln |x|| <= 700), a negative x only with an integer y.
 * @param {number} x
 * @param {number} y
 */
export function pow(x, y) {
  if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) throw domain('pow');
  if (y === 0) return 1;
  if (y === 1) return noNegZero(x);
  if (x === 0) {
    if (y > 0) return 0;
    throw domain('pow');
  }
  const whole = Math.floor(y) === y;
  if (whole && y >= -INT_POW_MAX && y <= INT_POW_MAX) {
    let n = y < 0 ? -y : y;
    let base = x;
    let out = 1;
    while (n > 0) {
      if (n % 2 === 1) out *= base;
      n = Math.floor(n / 2);
      if (n > 0) base *= base;
    }
    if (y < 0) out = 1 / out;
    if (!Number.isFinite(out) || out === 0) throw domain('pow');
    return out;
  }
  if (x > 0) return exp(y * ln(x));
  if (!whole) throw domain('pow');
  const v = exp(y * ln(-x));
  return y % 2 === 0 ? v : -v;
}

/**
 * x reduced by pi/2: [quadrant 0 to 3, r with |r| <= about pi/4].
 * @param {number} x
 * @param {string} what
 * @returns {[number, number]}
 */
function reduce(x, what) {
  if (typeof x !== 'number' || !(x >= -TRIG_MAX && x <= TRIG_MAX)) throw domain(what);
  const k = noNegZero(Math.round(x * TWO_OVER_PI));
  const r = x - k * PIO2_1 - k * PIO2_2 - k * PIO2_3;
  return [k & 3, r];
}

/** sin on |r| <= pi/4 (fdlibm __kernel_sin, no tail). @param {number} r */
function sinK(r) {
  const z = r * r;
  const w = z * z;
  const t = S2 + z * (S3 + z * S4) + z * w * (S5 + z * S6);
  const v = z * r;
  return r + v * (S1 + z * t);
}

/** cos on |r| <= pi/4 (fdlibm __kernel_cos, no tail). @param {number} r */
function cosK(r) {
  const z = r * r;
  const w = z * z;
  const t = z * (C1 + z * (C2 + z * C3)) + w * w * (C4 + z * (C5 + z * C6));
  const hz = 0.5 * z;
  const u = 1 - hz;
  return u + (1 - u - hz + z * t);
}

/**
 * The sine, for |x| <= 1e5.
 * @param {number} x
 */
export function sin(x) {
  const [n, r] = reduce(x, 'sin');
  const v = n === 0 ? sinK(r) : n === 1 ? cosK(r) : n === 2 ? -sinK(r) : -cosK(r);
  return noNegZero(v);
}

/**
 * The cosine, for |x| <= 1e5.
 * @param {number} x
 */
export function cos(x) {
  const [n, r] = reduce(x, 'cos');
  const v = n === 0 ? cosK(r) : n === 1 ? -sinK(r) : n === 2 ? -cosK(r) : sinK(r);
  return noNegZero(v);
}
