// The park section of the build (BUILD_PLAN 2.3, 3.3, 3.4, S4; GAME_DESIGN
// 4.3, 7.4): rules.park, cut to the M1a scope, and the display map.
//
// compilePark() reads the generated regions (content/park/regions/), the
// play regions' overlays (their loops), content/rules/movement.json and the
// scope file, and makes the rules data the engine routes on:
//   {format: 1, loops, nodes: {id: {type, elev_ft, zone, camp, spur_only}},
//    segs: {id: {a, b, mi10, gain, loss, class, through, spur}}, movement}
// with the scope's 47 nodes and its routable segments (map-only links left
// out). No names and no map positions: those are display.
//
// mapData() makes data/map.json, the pencil map's display data (not
// rules-hashed): {format: 1, bounds: [x0, y0, x1, y1], nodes: {id: {xy,
// kind, label}}, segs: {id: {a, b, class, map_only}}}, map_xy in tenths of
// a mile east and south of the loop's corner (the research's own); kind is
// trailhead, camp, desk, lake (a map Look), junction, peak or group (never
// offered); label is place.<id> for the trailhead and the plannable camps.

import { buildGraph } from '../web/js/engine/graph.js';
import { lineOfPath } from './content.mjs';

const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const REGION_RE = /^content\/park\/regions\/([a-z][a-z0-9_]*)\.json$/;
const OVERLAY_RE = /^content\/park\/overlays\/([a-z][a-z0-9_]*)\.json$/;
const MOVEMENT = 'content/rules/movement.json';

/**
 * The pieces both outputs need: the scope file, the regions by id and the
 * merged scope records.
 * @param {Map<string, {data: any, src: string}>} files the validated content
 * @param {any} scope
 */
function gather(files, scope) {
  if (!scope || !scope.park) return null;
  /** @type {Map<string, any>} */
  const regions = new Map();
  /** @type {Map<string, any>} */
  const overlays = new Map();
  for (const [f, { data }] of files) {
    const r = REGION_RE.exec(f);
    if (r) regions.set(r[1], data);
    const o = OVERLAY_RE.exec(f);
    if (o && o[1] !== 'park') overlays.set(o[1], data);
  }
  if (!regions.size) return null;
  const scopeFile = [...files.keys()].find((f) => /^content\/scope\/[^/]+\.json$/.test(f)) || 'content/scope/m1a.json';
  const scopeSrc = files.has(scopeFile) ? /** @type {{data: any, src: string}} */ (files.get(scopeFile)).src : '';
  const play = scope.park.play || [];
  const order = [...play, ...[...regions.keys()].filter((r) => !play.includes(r)).sort(byCode)];
  const node = (id) => {
    for (const r of order) if (regions.has(r) && regions.get(r).nodes[id]) return regions.get(r).nodes[id];
    return null;
  };
  const inScope = new Set(scope.park.nodes || []);
  /** @type {Map<string, any>} */
  const segs = new Map();
  for (const r of order) {
    if (!regions.has(r)) continue;
    for (const [id, s] of Object.entries(regions.get(r).segments)) if (inScope.has(s.a) && inScope.has(s.b) && !segs.has(id)) segs.set(id, s);
  }
  return { regions, overlays, play, node, inScope, segs, scopeFile, scopeSrc };
}

/**
 * rules.park, or null when the park's sources aren't here.
 * @param {{files: Map<string, {data: any, src: string}>, scope: any, add: (file: string, line: number, code: string, msg: string) => void}} ctx
 */
export function compilePark({ files, scope, add }) {
  const g = gather(files, scope);
  if (!g) return null;
  const at = (path) => lineOfPath(g.scopeSrc, path);
  const movementFile = files.get(MOVEMENT);
  if (!movementFile) {
    add(MOVEMENT, 1, 'R01', 'the park needs the movement rules (GAME_DESIGN 7.4)');
    return null;
  }
  let ok = true;
  const nodes = {};
  for (const id of [...g.inScope].sort(byCode)) {
    const n = g.node(id);
    if (!n) {
      add(g.scopeFile, at('park.nodes'), 'R01', `park.nodes: "${id}" is in no region (run npm run ingest?)`);
      ok = false;
      continue;
    }
    nodes[id] = { type: n.type, elev_ft: n.elev_ft, zone: n.zone, camp: n.camp, spur_only: n.spur_only };
  }
  const mapOnly = new Set(scope.park.map_only || []);
  for (const id of mapOnly) {
    if (!g.segs.has(id)) {
      add(g.scopeFile, at('park.map_only'), 'R01', `park.map_only: "${id}" is not a segment inside the scope`);
      ok = false;
    }
  }
  const segs = {};
  for (const id of [...g.segs.keys()].sort(byCode)) {
    if (mapOnly.has(id)) continue;
    const s = g.segs.get(id);
    if (s.mi10 === null || s.gain === null || s.loss === null) {
      add(g.scopeFile, at('park.nodes'), 'R01', `the segment ${id} inside the scope has no distance, gain or loss`);
      ok = false;
      continue;
    }
    segs[id] = { a: s.a, b: s.b, mi10: s.mi10, gain: s.gain, loss: s.loss, class: s.class, through: s.through, spur: s.spur };
  }
  const loops = {};
  for (const r of g.play) {
    const ov = g.overlays.get(r);
    for (const [id, l] of Object.entries((ov && ov.loops) || {})) {
      const { doc, ...loop } = /** @type {any} */ (l);
      for (const k of ['ccw_first', 'cw_first']) {
        if (!Object.prototype.hasOwnProperty.call(segs, loop[k])) {
          add(`content/park/overlays/${r}.json`, 1, 'R01', `loops.${id}.${k}: "${loop[k]}" is not a routable segment inside the scope`);
          ok = false;
        }
      }
      for (const k of ['trailhead', 'crest_via', 'basin_via']) {
        if (!Object.prototype.hasOwnProperty.call(nodes, loop[k])) {
          add(`content/park/overlays/${r}.json`, 1, 'R01', `loops.${id}.${k}: "${loop[k]}" is not a node inside the scope`);
          ok = false;
        }
      }
      loops[id] = loop;
    }
  }
  const { $comment, ...movement } = movementFile.data;
  const park = { format: 1, loops, nodes, segs, movement };
  if (ok) {
    try {
      buildGraph(park);
    } catch (e) {
      add(g.scopeFile, 1, 'R01', `the park graph doesn't build: ${e.message}`);
    }
  }
  return park;
}

/** The marks the map draws, by kind. */
export const MAP_KINDS = Object.freeze(['trailhead', 'camp', 'desk', 'lake', 'junction', 'peak', 'group']);

/**
 * data/map.json's body, or null when the park's sources aren't here.
 * @param {{files: Map<string, {data: any, src: string}>, scope: any}} ctx
 */
export function mapData({ files, scope }) {
  const g = gather(files, scope);
  if (!g) return null;
  const p = scope.park;
  const camps = new Set(p.camps || []);
  const desk = new Set(p.desk || []);
  const looks = new Set(p.map_looks || []);
  const never = new Set(p.never || []);
  const nodes = {};
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const id of [...g.inScope].sort(byCode)) {
    const n = g.node(id);
    const xy = n && n.place && Array.isArray(n.place.map_xy) ? n.place.map_xy : null;
    if (!xy) continue;
    const kind = n.type === 'trailhead' ? 'trailhead' : camps.has(id) ? 'camp' : desk.has(id) ? 'desk' : looks.has(id) ? 'lake' : never.has(id) ? 'group' : n.type === 'summit' ? 'peak' : 'junction';
    nodes[id] = { xy: [xy[0], xy[1]], kind, label: kind === 'trailhead' || kind === 'camp' || kind === 'desk' ? `place.${id}` : null };
    x0 = Math.min(x0, xy[0]);
    y0 = Math.min(y0, xy[1]);
    x1 = Math.max(x1, xy[0]);
    y1 = Math.max(y1, xy[1]);
  }
  const mapOnly = new Set(p.map_only || []);
  const segs = {};
  for (const id of [...g.segs.keys()].sort(byCode)) {
    const s = g.segs.get(id);
    if (!nodes[s.a] || !nodes[s.b]) continue;
    segs[id] = { a: s.a, b: s.b, class: s.class, map_only: mapOnly.has(id) };
  }
  return { format: 1, bounds: [x0, y0, x1, y1], nodes, segs };
}
