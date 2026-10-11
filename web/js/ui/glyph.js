// A pixel glyph (BUILD_PLAN S5, S7; GAME_DESIGN 11.9): whole grid squares
// as an inline SVG, crisp, in the text's color, hidden from VoiceOver (its
// button carries the name). Shared by the trail's chrome (ui/choices.js,
// ui/sheet.js, ui/outcome.js) and the cabin's (ui/status.js, ui/textbox.js,
// ui/cabin.js), so the cabin's modules never import a trail module.

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * A pixel glyph as an inline SVG: whole grid squares, crisp, in the text's
 * color, hidden from VoiceOver (its button carries the name).
 * @param {Document} doc
 * @param {number} w grid width
 * @param {number} h grid height
 * @param {readonly (readonly number[])[]} rects [x, y, w, h] on the grid
 * @param {string} cls
 */
export function pixelGlyph(doc, w, h, rects, cls) {
  const make = (/** @type {string} */ tag) => (typeof doc.createElementNS === 'function' ? doc.createElementNS(SVG_NS, tag) : doc.createElement(tag));
  const svg = make('svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const [x, y, rw, rh] of rects) {
    const r = make('rect');
    r.setAttribute('x', String(x));
    r.setAttribute('y', String(y));
    r.setAttribute('width', String(rw));
    r.setAttribute('height', String(rh));
    svg.appendChild(r);
  }
  return svg;
}
