// The park graph and its router (BUILD_PLAN 2.3, S4; GAME_DESIGN 4.3, 4.6,
// 7.4; M1A_DATA_CHECK item 1).
//
// PURE, integer-only. buildGraph() turns rules.park (the park section the
// build compiles from content/park/, cut to the scope) into a frozen graph:
// each segment is walkable both ways, each directed edge carries a Regular
// hiker's base seconds (movement.js), and adjacency is sorted by segment id
// (then direction), so every walk of it is in one order everywhere.
//
//   route(graph, points, {ban})  the shortest way by base seconds through
//       every point in order (the plan's via pins): a leg per pair of
//       points. Dijkstra over a binary heap keyed (seconds, node id), strict
//       improvement only. Throws EngineError('route') when a leg can't be
//       made.
//   distAlong(graph, loop, dir)  the 4.3 camp table's mile: the shortest
//       distance from the loop's trailhead with the other direction's first
//       segment banned. The table is distance, not time (by time Cat Basin
//       going counterclockwise would be 11.9, by Bruce's Roost; the doc's
//       11.8 is by Heart Lake), so the table uses this and trips use route.
//
// The spur rule (M1A_DATA_CHECK item 1): a spur_only node (Bogachiel Peak)
// is never inside a leg, and a segment that isn't a through route is walked
// only on a leg that starts or ends at its spur node. A leg that ends at a
// spur node is followed by one that leaves by the very segment it came in
// on; with a spur node among the points, route tries each segment into it
// and keeps the cheapest (ties by segment id), so the peak never shortcuts
// the crest between its two junctions.

import { EngineError } from './error.js';
import { byCode } from './canon.js';
import { baseSeconds, steepOf } from './movement.js';

/**
 * @typedef {import('./movement.js').Movement} Movement
 * @typedef {{type: string, elev_ft: number | null, zone: string | null, camp: any, spur_only: boolean}} ParkNode
 * @typedef {{a: string, b: string, mi10: number, gain: number, loss: number, class: string, through: boolean, spur: any, map_only?: boolean}} ParkSeg
 * @typedef {{trailhead: string, ccw_first: string, cw_first: string, crest_via?: string, basin_via?: string}} Loop
 * @typedef {{format: number, loops: Record<string, Loop>, nodes: Record<string, ParkNode>, segs: Record<string, ParkSeg>, movement: Movement}} Park
 * @typedef {{id: string, from: string, to: string, dir: 1 | -1, s: number, mi10: number, gain: number, loss: number, steep: number, through: boolean}} Edge
 * @typedef {{nodes: Readonly<Record<string, ParkNode>>, adj: Readonly<Record<string, readonly Edge[]>>, loops: Readonly<Record<string, Loop>>, movement: Movement}} Graph
 * @typedef {{nodes: string[], edges: {id: string, dir: 1 | -1}[], mi10: number, gain: number, loss: number, steep: number, s: number}} Leg
 * @typedef {{legs: Leg[], mi10: number, gain: number, loss: number, steep: number, s: number}} Route
 */

const own = (/** @type {any} */ o, /** @type {string} */ k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);

/**
 * The frozen graph of a park. Map-only segments (map_only: true) are left
 * out: they are drawn, never walked.
 * @param {Park} park
 * @returns {Graph}
 */
export function buildGraph(park) {
  if (!park || park.format !== 1 || !park.nodes || !park.segs || !park.movement) throw new EngineError('format', 'graph: not a park, format 1');
  /** @type {Record<string, Edge[]>} */
  const adj = {};
  for (const id of Object.keys(park.nodes).sort(byCode)) adj[id] = [];
  for (const id of Object.keys(park.segs).sort(byCode)) {
    const seg = park.segs[id];
    if (seg.map_only) continue;
    if (!own(adj, seg.a) || !own(adj, seg.b)) throw new EngineError('format', `graph: segment ${id} names a node the park lacks`);
    const through = seg.through !== false;
    for (const dir of /** @type {(1 | -1)[]} */ ([1, -1])) {
      const from = dir === 1 ? seg.a : seg.b;
      const to = dir === 1 ? seg.b : seg.a;
      const gain = dir === 1 ? seg.gain : seg.loss;
      const loss = dir === 1 ? seg.loss : seg.gain;
      adj[from].push(Object.freeze({ id, from, to, dir, s: baseSeconds(park.movement, seg, dir), mi10: seg.mi10, gain, loss, steep: steepOf(park.movement, seg.mi10, loss), through }));
    }
  }
  for (const id of Object.keys(adj)) {
    adj[id].sort((x, y) => byCode(x.id, y.id) || y.dir - x.dir);
    Object.freeze(adj[id]);
  }
  return Object.freeze({ nodes: Object.freeze({ ...park.nodes }), adj: Object.freeze(adj), loops: Object.freeze({ ...(park.loops || {}) }), movement: park.movement });
}

/**
 * A binary heap of [key, node id] pairs, least key first, ties by id.
 */
class Heap {
  constructor() {
    /** @type {{k: number, id: string}[]} */
    this.a = [];
  }

  /** @param {{k: number, id: string}} x @param {{k: number, id: string}} y */
  static less(x, y) {
    return x.k < y.k || (x.k === y.k && x.id < y.id);
  }

  /** @param {number} k @param {string} id */
  push(k, id) {
    const a = this.a;
    a.push({ k, id });
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!Heap.less(a[i], a[p])) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
  }

  pop() {
    const a = this.a;
    const top = a[0];
    const last = /** @type {{k: number, id: string}} */ (a.pop());
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && Heap.less(a[l], a[m])) m = l;
        if (r < a.length && Heap.less(a[r], a[m])) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]];
        i = m;
      }
    }
    return top;
  }

  get size() {
    return this.a.length;
  }
}

/**
 * Dijkstra from src under the spur rule: a spur_only node other than src is
 * reached but never left, and a segment that isn't a through route is
 * walked only out of src or into a spur node. Returns each reached node's
 * cost and the edge that reached it.
 * @param {Graph} g
 * @param {string} src
 * @param {(e: Edge) => number} cost
 * @param {Set<string>} ban segment ids not walked either way
 * @param {string | null} [target] stop once it is settled
 */
function shortest(g, src, cost, ban, target = null) {
  /** @type {Map<string, number>} */
  const dist = new Map([[src, 0]]);
  /** @type {Map<string, Edge>} */
  const prev = new Map();
  const done = new Set();
  const heap = new Heap();
  heap.push(0, src);
  while (heap.size) {
    const { k, id } = heap.pop();
    if (done.has(id) || k !== dist.get(id)) continue;
    done.add(id);
    if (id === target) break;
    if (id !== src && g.nodes[id].spur_only) continue;
    for (const e of g.adj[id]) {
      if (ban.has(e.id)) continue;
      if (!e.through && id !== src && !g.nodes[e.to].spur_only) continue;
      const d = k + cost(e);
      const was = dist.get(e.to);
      if (was === undefined || d < was) {
        dist.set(e.to, d);
        prev.set(e.to, e);
        heap.push(d, e.to);
      }
    }
  }
  return { dist, prev };
}

/**
 * The edges back from to to src, in walking order, or null when to wasn't reached.
 * @param {Map<string, Edge>} prev
 * @param {string} src
 * @param {string} to
 * @param {Map<string, number>} dist
 */
function pathTo(prev, src, to, dist) {
  if (!dist.has(to)) return null;
  /** @type {Edge[]} */
  const out = [];
  let at = to;
  while (at !== src) {
    const e = /** @type {Edge} */ (prev.get(at));
    out.push(e);
    at = e.from;
  }
  return out.reverse();
}

/** The reverse of an edge (the same segment, walked the other way). @param {Graph} g @param {Edge} e */
function reverseOf(g, e) {
  return /** @type {Edge} */ (g.adj[e.to].find((x) => x.id === e.id && x.dir === -e.dir));
}

/**
 * One leg as a list of edges, or null when it can't be made.
 * @param {Graph} g
 * @param {string} from
 * @param {string} to
 * @param {Edge | null} leave the edge out of a spur node `from` (walked first)
 * @param {Edge | null} arrive an edge out of a spur node `to` (walked the other way, last)
 * @param {Set<string>} ban
 */
function legEdges(g, from, to, leave, arrive, ban) {
  const start = leave ? leave.to : from;
  const end = arrive ? arrive.to : to;
  /** @type {Edge[]} */
  let mid = [];
  if (start !== end) {
    const { dist, prev } = shortest(g, start, (e) => e.s, ban, end);
    const p = pathTo(prev, start, end, dist);
    if (!p) return null;
    mid = p;
  }
  return [...(leave ? [leave] : []), ...mid, ...(arrive ? [reverseOf(g, arrive)] : [])];
}

/**
 * A leg's record from its edges.
 * @param {string} from
 * @param {Edge[]} edges
 * @returns {Leg}
 */
function legOf(from, edges) {
  const leg = { nodes: [from], edges: /** @type {{id: string, dir: 1 | -1}[]} */ ([]), mi10: 0, gain: 0, loss: 0, steep: 0, s: 0 };
  for (const e of edges) {
    leg.nodes.push(e.to);
    leg.edges.push({ id: e.id, dir: e.dir });
    leg.mi10 += e.mi10;
    leg.gain += e.gain;
    leg.loss += e.loss;
    leg.steep += e.steep;
    leg.s += e.s;
  }
  return leg;
}

/** Most spur choices a route will weigh (each spur point has a few segments in). */
const MAX_COMBOS = 4096;

/**
 * The shortest route by base seconds through every point in order.
 * @param {Graph} g
 * @param {string[]} points the start, any via pins, the end (two or more)
 * @param {{ban?: string[]}} [o] segment ids not to walk either way
 * @returns {Route}
 */
export function route(g, points, { ban = [] } = {}) {
  if (!Array.isArray(points) || points.length < 2) throw new EngineError('route', 'route: two points or more');
  for (const p of points) if (typeof p !== 'string' || !own(g.nodes, p)) throw new EngineError('route', `route: no node "${String(p)}"`);
  const banned = new Set(ban);
  // Each point's choices: a spur node's segments in (or out), else none.
  /** @type {(Edge | null)[][]} */
  const options = points.map((p) => (g.nodes[p].spur_only ? g.adj[p].filter((e) => !banned.has(e.id)) : [null]));
  let combos = 1;
  for (const o of options) {
    if (!o.length) throw new EngineError('route', 'route: a spur node with no way in');
    combos *= o.length;
    if (combos > MAX_COMBOS) throw new EngineError('route', 'route: too many spur points');
  }
  /** @type {Route | null} */
  let best = null;
  const pick = new Array(points.length).fill(0);
  for (let c = 0; c < combos; c++) {
    let rest = c;
    for (let i = points.length - 1; i >= 0; i--) {
      pick[i] = rest % options[i].length;
      rest = Math.floor(rest / options[i].length);
    }
    /** @type {Leg[]} */
    const legs = [];
    let ok = true;
    for (let i = 0; i + 1 < points.length && ok; i++) {
      const edges = legEdges(g, points[i], points[i + 1], options[i][pick[i]], options[i + 1][pick[i + 1]], banned);
      if (!edges) ok = false;
      else legs.push(legOf(points[i], edges));
    }
    if (!ok) continue;
    const r = { legs, mi10: 0, gain: 0, loss: 0, steep: 0, s: 0 };
    for (const l of legs) {
      r.mi10 += l.mi10;
      r.gain += l.gain;
      r.loss += l.loss;
      r.steep += l.steep;
      r.s += l.s;
    }
    // Strictly better only: combos run in segment-id order, so ties keep the first.
    if (!best || r.s < best.s) best = r;
  }
  if (!best) throw new EngineError('route', `route: no way from ${points[0]} to ${points[points.length - 1]} through the pins`);
  return best;
}

/**
 * The loop's mile at every node it reaches (4.3's camp table): the shortest
 * distance in tenths of a mile from its trailhead, the other direction's
 * first segment banned, the spur rule kept.
 * @param {Graph} g
 * @param {string} loop a loop id (rules.park.loops)
 * @param {'ccw' | 'cw'} dir
 * @returns {Readonly<Record<string, number>>}
 */
export function distAlong(g, loop, dir) {
  if (!own(g.loops, loop)) throw new EngineError('route', `distAlong: no loop "${loop}"`);
  if (dir !== 'ccw' && dir !== 'cw') throw new EngineError('invalid', 'distAlong: dir is ccw or cw');
  const l = g.loops[loop];
  const ban = new Set([dir === 'ccw' ? l.cw_first : l.ccw_first]);
  const { dist } = shortest(g, l.trailhead, (e) => e.mi10, ban);
  /** @type {Record<string, number>} */
  const out = {};
  for (const id of [...dist.keys()].sort(byCode)) out[id] = /** @type {number} */ (dist.get(id));
  return Object.freeze(out);
}
