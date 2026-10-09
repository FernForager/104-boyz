// The graph lints (BUILD_PLAN 6.7, S4; GAME_DESIGN F.3, E.4, 4.3, 4.6;
// M1A_DATA_CHECK item 1), run by `npm run lint`.
//
// They read the merged park (every generated region in content/park/
// regions/), the overlays, the scope file, the presets the regions keep,
// the research's own region files (for G04) and, when they exist, the dated
// conditions and the drives' roads (G01's references). Inside the M1a scope
// (content/scope/m1a.json park.nodes, and the segments with both ends among
// them) every finding is an error; outside it, a finding is an error until
// content/park/ingest_known.json acknowledges it, by the same "<code>:
// <region>/<id>" keys ingest uses (so lint and ingest agree on what's
// explained). An acknowledgement of a G code that matches nothing is stale,
// and an error too.
//
//   G01  references: every segment end is a node after the merge; every
//        hazard where, preset trailhead, to and via, crossing and traffic
//        segment, overlay and scope id, and conditions applies_to resolves
//   G02  reachability over routable segments: every trailhead reaches a
//        camp, and every camp is reachable from a trailhead (in the scope,
//        the plannable camps; a footnote has no trail)
//   G03  elevation sanity: gain - loss matches the endpoints' difference
//        within 100 ft (endpoints with measured elevations); no null
//        elevation in the scope but a footnote's
//   G04  a shared id whose research records disagree by more than 100 ft
//        in elevation or position
//   G05  every place has a picture recipe (lands S5, with recipes.json)
//   G06  presets: every kept preset routes and ends at a trailhead (a loop
//        at its start); no preset, trip file or first trip names a
//        phone-only camp (Lake Morgenroth, 4.3)
//   G07  spurs: Bogachiel Peak is spur_only, both its segments aren't
//        through routes and carry a spur block, and routing every pair of
//        the plannable camps never passes through a spur node
//   G08  the M1a scope: its lists name real ids; the map-only segments are
//        exactly the off-trail links and Long Lake to Morgenroth; group and
//        stock sites are never plannable; every plannable camp has sites,
//        bear_can, food_storage, fires, toilet and water; the loop's
//        direction gates and forks name loop segments

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './pics.mjs';
import { lineOfPath } from './content.mjs';
import { buildGraph, route } from '../web/js/engine/graph.js';
import { covers } from './ingest/report.mjs';

const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const own = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
/** Feet per degree of latitude (as ingest's G04 check). */
const FT_PER_DEG = 364000;

/** References a conditions entry may name that aren't graph ids (B1: the park-wide fire ban). */
export const SPECIAL_REFS = Object.freeze(['all_wilderness_camps']);

/**
 * @typedef {{file: string, line: number, code: string, msg: string, level?: 'error' | 'warn', key?: string}} Issue
 */

/** Read a JSON file under root, with its source, or null. */
function readJson(root, rel) {
  const p = join(root, rel);
  if (!existsSync(p)) return null;
  const src = readFileSync(p, 'utf8');
  return { src, data: JSON.parse(src) };
}

/** Every JSON file in a folder under root, by name. */
function readDir(root, rel) {
  const dir = join(root, rel);
  const out = new Map();
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir).sort(byCode)) if (n.endsWith('.json')) out.set(n.slice(0, -5), readJson(root, `${rel}/${n}`));
  return out;
}

/**
 * What the lints read, from a tree.
 * @param {string} root
 */
export function readPark(root = ROOT) {
  const regions = readDir(root, 'content/park/regions');
  const overlays = readDir(root, 'content/park/overlays');
  const points = overlays.get('park') || null;
  overlays.delete('park');
  const raw = readDir(root, 'design/data/regions');
  const scope = readJson(root, 'content/scope/m1a.json');
  const known = readJson(root, 'content/park/ingest_known.json');
  const movement = readJson(root, 'content/rules/movement.json');
  const conditions = readDir(root, 'content/park/conditions');
  const drives = readJson(root, 'content/drive/routes.json');
  const trips = readDir(root, 'content/trips');
  return { regions, overlays, points, raw, scope, known, movement, conditions, drives, trips };
}

/**
 * The merged park from the generated regions: nodes and segments by id
 * (the first region's record), with the region each came from.
 * @param {Map<string, {src: string, data: any}>} regions
 */
export function mergePark(regions) {
  /** @type {Map<string, {n: any, region: string}>} */
  const nodes = new Map();
  /** @type {Map<string, {s: any, region: string}>} */
  const segs = new Map();
  for (const [region, f] of [...regions].sort((a, b) => byCode(a[0], b[0]))) {
    for (const [id, n] of Object.entries(f.data.nodes || {})) if (!nodes.has(id)) nodes.set(id, { n, region });
    for (const [id, s] of Object.entries(f.data.segments || {})) if (!segs.has(id)) segs.set(id, { s, region });
  }
  return { nodes, segs };
}

/**
 * Run every graph lint over a tree.
 * @param {string} [root]
 * @param {ReturnType<typeof readPark>} [input]
 * @returns {Issue[]}
 */
export function lintGraph(root = ROOT, input = readPark(root)) {
  const { regions, overlays, raw, scope: scopeFile, known, movement, conditions, drives, trips } = input;
  /** @type {Issue[]} */
  const found = [];
  if (!regions.size || !scopeFile) return found;
  const scope = scopeFile.data;
  const sp = scope.park || {};
  const inScope = new Set(sp.nodes || []);
  const footnotes = new Set(sp.footnotes || []);
  const mapOnly = new Set(sp.map_only || []);
  const plannable = [...(sp.camps || []), ...(sp.desk || [])];
  const { nodes, segs } = mergePark(regions);
  const segIn = (s) => inScope.has(s.a) && inScope.has(s.b);
  const regionFile = (r) => `content/park/regions/${r}.json`;
  const lineIn = (r, path) => (regions.has(r) ? lineOfPath(regions.get(r).src, path) : 1);
  /**
   * One finding: an error inside the scope, else keyed for acknowledgement.
   * @param {string} code
   * @param {boolean} scoped
   * @param {string} region
   * @param {string} id
   * @param {string} file
   * @param {number} line
   * @param {string} msg
   */
  const add = (code, scoped, region, id, file, line, msg) => found.push({ file, line, code, msg, key: `${code}:${region}/${id}`, level: scoped ? 'error' : 'warn' });
  const scopeLine = (path) => lineOfPath(scopeFile.src, path);
  const isRef = (x) => nodes.has(x) || segs.has(x);

  // G01: references.
  for (const [id, { s, region }] of segs) {
    for (const end of [s.a, s.b]) if (!nodes.has(end)) add('G01', segIn(s), region, id, regionFile(region), lineIn(region, `segments.${id}`), `segment ${id}: ${end} is no node`);
  }
  for (const [region, f] of regions) {
    for (const [hid, h] of Object.entries(f.data.hazards || {})) for (const w of h.where) if (!isRef(w)) add('G01', false, region, hid, regionFile(region), lineIn(region, `hazards.${hid}`), `hazard ${hid}: where "${w}" is no node or segment`);
    for (const [pid, p] of Object.entries(f.data.presets || {})) {
      const names = [p.trailhead, ...p.days.flatMap((d) => [d.to, ...d.via])];
      const scoped = (sp.play || []).includes(region) && names.every((x) => inScope.has(x));
      for (const x of names) if (!nodes.has(x)) add('G01', scoped, region, pid, regionFile(region), lineIn(region, `presets.${pid}`), `preset ${pid}: "${x}" is no node`);
    }
    (f.data.crossings || []).forEach((c, i) => {
      if (!nodes.has(c.at)) add('G01', inScope.has(c.at), region, `crossings[${i}]`, regionFile(region), lineIn(region, `crossings[${i}]`), `crossing at "${c.at}": no such node`);
      if (!segs.has(c.segment)) add('G01', inScope.has(c.at), region, `crossings[${i}]`, regionFile(region), lineIn(region, `crossings[${i}]`), `crossing on "${c.segment}": no such segment`);
    });
    for (const [sec, t] of Object.entries((f.data.traffic && f.data.traffic.sections) || {})) for (const sid of t.segments) if (!segs.has(sid)) add('G01', region === 'sol_duc_high_divide', region, `traffic.${sec}`, regionFile(region), lineIn(region, `traffic.sections.${sec}`), `traffic section ${sec}: "${sid}" is no segment`);
  }
  for (const [r, ov] of overlays) {
    const file = `content/park/overlays/${r}.json`;
    const at = (path) => lineOfPath(ov.src, path);
    for (const [lid, l] of Object.entries(ov.data.loops || {})) {
      for (const k of ['trailhead', 'crest_via', 'basin_via']) if (!nodes.has(l[k])) add('G01', true, r, `loops.${lid}`, file, at(`loops.${lid}.${k}`), `loops.${lid}.${k}: "${l[k]}" is no node`);
      for (const k of ['ccw_first', 'cw_first']) if (!segs.has(l[k])) add('G01', true, r, `loops.${lid}`, file, at(`loops.${lid}.${k}`), `loops.${lid}.${k}: "${l[k]}" is no segment`);
    }
    for (const [fid, fk] of Object.entries(ov.data.forks || {})) {
      if (!nodes.has(fid)) add('G01', true, r, `forks.${fid}`, file, at(`forks.${fid}`), `forks: "${fid}" is no node`);
      if (!segs.has(fk.way_in)) add('G01', true, r, `forks.${fid}`, file, at(`forks.${fid}.way_in`), `forks.${fid}.way_in: "${fk.way_in}" is no segment`);
    }
    for (const [pid, p] of Object.entries(ov.data.presets || {})) for (const [d, day] of Object.entries(p.days || {})) for (const x of day.via) if (!nodes.has(x)) add('G01', true, r, `presets.${pid}`, file, at(`presets.${pid}.days.${d}.via`), `presets.${pid} day ${d}: via "${x}" is no node`);
    for (const id of Object.keys(ov.data.nodes || {})) if (!nodes.has(id)) add('G01', inScope.has(id), r, `nodes.${id}`, file, at(`nodes.${id}`), `nodes: "${id}" is no node`);
    for (const id of Object.keys(ov.data.segments || {})) if (!segs.has(id)) add('G01', true, r, `segments.${id}`, file, at(`segments.${id}`), `segments: "${id}" is no segment`);
  }
  const scopeLists = ['nodes', 'camps', 'desk', 'never', 'pencil_rows', 'map_looks', 'footnotes', 'phone_only_m1b'];
  for (const k of scopeLists) for (const id of sp[k] || []) if (!nodes.has(id)) add('G01', true, 'scope', `park.${k}`, 'content/scope/m1a.json', scopeLine(`park.${k}`), `park.${k}: "${id}" is no node`);
  for (const id of sp.map_only || []) if (!segs.has(id)) add('G01', true, 'scope', 'park.map_only', 'content/scope/m1a.json', scopeLine('park.map_only'), `park.map_only: "${id}" is no segment`);
  for (const r of sp.play || []) if (!regions.has(r)) add('G01', true, 'scope', 'park.play', 'content/scope/m1a.json', scopeLine('park.play'), `park.play: "${r}" is no region`);
  if (scope.first_trip && !nodes.has(scope.first_trip.trailhead)) add('G01', true, 'scope', 'first_trip', 'content/scope/m1a.json', scopeLine('first_trip.trailhead'), `first_trip.trailhead: "${scope.first_trip.trailhead}" is no node`);
  const roads = new Set(Object.keys((drives && drives.data && drives.data.roads) || {}));
  for (const [name, f] of conditions) {
    const entries = Array.isArray(f.data.entries) ? f.data.entries : Array.isArray(f.data.conditions) ? f.data.conditions : [];
    entries.forEach((e, i) => {
      for (const ref of (e && e.applies_to) || []) {
        if (isRef(ref) || regions.has(ref) || roads.has(ref) || SPECIAL_REFS.includes(ref)) continue;
        add('G01', inScope.has(ref) || e.region === 'sol_duc_high_divide', String(e.region || name), String(e.id || `entries[${i}]`), `content/park/conditions/${name}.json`, lineOfPath(f.src, `${Array.isArray(f.data.entries) ? 'entries' : 'conditions'}[${i}].applies_to`), `applies_to "${ref}" is no node, segment, region or road`);
      }
    });
  }

  // The routing graph: every segment with its numbers, the scope's map-only links left out.
  const parkNodes = {};
  for (const [id, { n }] of nodes) parkNodes[id] = { type: n.type, elev_ft: n.elev_ft, zone: n.zone, camp: n.camp, spur_only: n.spur_only };
  const routable = {};
  for (const [id, { s }] of segs) if (s.mi10 !== null && s.gain !== null && s.loss !== null && nodes.has(s.a) && nodes.has(s.b) && !mapOnly.has(id)) routable[id] = { a: s.a, b: s.b, mi10: s.mi10, gain: s.gain, loss: s.loss, class: s.class, through: s.through, spur: s.spur };
  let graph = null;
  try {
    graph = movement ? buildGraph({ format: 1, loops: {}, nodes: parkNodes, segs: routable, movement: movement.data }) : null;
  } catch (e) {
    found.push({ file: 'content/park/regions', line: 1, code: 'G01', msg: `the park graph doesn't build: ${e.message}`, level: 'error' });
  }

  // G02: reachability (undirected components over routable segments).
  const comp = new Map();
  const adj = new Map([...nodes.keys()].map((id) => [id, []]));
  for (const s of Object.values(routable)) {
    adj.get(s.a).push(s.b);
    adj.get(s.b).push(s.a);
  }
  let c = 0;
  for (const id of [...nodes.keys()].sort(byCode)) {
    if (comp.has(id)) continue;
    const stack = [id];
    comp.set(id, c);
    while (stack.length) {
      const x = stack.pop();
      for (const y of adj.get(x)) if (!comp.has(y)) {
        comp.set(y, c);
        stack.push(y);
      }
    }
    c++;
  }
  const hasTrailhead = new Set();
  const hasCamp = new Set();
  const isCamp = (id, n) => (inScope.has(id) ? plannable.includes(id) : !!n.camp);
  for (const [id, { n }] of nodes) {
    if (n.type === 'trailhead') hasTrailhead.add(comp.get(id));
    if (isCamp(id, n)) hasCamp.add(comp.get(id));
  }
  for (const [id, { n, region }] of [...nodes].sort((a, b) => byCode(a[0], b[0]))) {
    if (footnotes.has(id)) continue;
    const line = lineIn(region, `nodes.${id}`);
    if (n.type === 'trailhead' && !hasCamp.has(comp.get(id))) add('G02', inScope.has(id), region, id, regionFile(region), line, `the trailhead ${id} reaches no camp over routable segments`);
    if (isCamp(id, n) && !hasTrailhead.has(comp.get(id))) add('G02', inScope.has(id), region, id, regionFile(region), line, `the camp ${id} can't be reached from a trailhead over routable segments`);
  }

  // G03: elevation sanity.
  for (const [id, { s, region }] of [...segs].sort((a, b) => byCode(a[0], b[0]))) {
    const a = nodes.get(s.a);
    const b = nodes.get(s.b);
    if (!a || !b || s.gain === null || s.loss === null) continue;
    if (!isNum(a.n.elev_ft) || !isNum(b.n.elev_ft) || a.n.elev_est || b.n.elev_est) continue;
    const want = b.n.elev_ft - a.n.elev_ft;
    const got = s.gain - s.loss;
    if (Math.abs(want - got) > 100) add('G03', segIn(s), region, id, regionFile(region), lineIn(region, `segments.${id}`), `gain - loss is ${got} ft, but the endpoints differ by ${want} ft (${Math.abs(want - got)} ft apart)`);
  }
  for (const id of inScope) {
    const n = nodes.get(id);
    if (n && n.n.elev_ft === null && !footnotes.has(id)) add('G03', true, n.region, id, regionFile(n.region), lineIn(n.region, `nodes.${id}`), `${id} has no elevation inside the M1a scope`);
  }

  // G04: shared ids in the research.
  /** @type {Map<string, {region: string, n: any}[]>} */
  const rawNodes = new Map();
  for (const [, f] of raw) {
    const region = f.data.region_id;
    for (const n of f.data.nodes || []) {
      if (!rawNodes.has(n.id)) rawNodes.set(n.id, []);
      /** @type {any[]} */ (rawNodes.get(n.id)).push({ region, n });
    }
  }
  for (const [id, list] of [...rawNodes].sort((a, b) => byCode(a[0], b[0]))) {
    for (let i = 1; i < list.length; i++) {
      const p = list[0].n;
      const q = list[i].n;
      const dz = isNum(p.elevation_ft) && isNum(q.elevation_ft) ? Math.abs(p.elevation_ft - q.elevation_ft) : 0;
      let dp = 0;
      if ([p.lat, p.lon, q.lat, q.lon].every(isNum)) {
        const dy = (p.lat - q.lat) * FT_PER_DEG;
        const dx = (p.lon - q.lon) * FT_PER_DEG * Math.cos((((p.lat + q.lat) / 2) * Math.PI) / 180);
        dp = Math.sqrt(dx * dx + dy * dy);
      }
      if (dz > 100 || dp > 100) add('G04', inScope.has(id), list[i].region, id, `design/data/regions/${list[i].region}.json`, 1, `${id} is in ${list[0].region} and ${list[i].region}, ${Math.round(dz)} ft apart in elevation and ${Math.round(dp)} ft in position: two places sharing an id?`);
    }
  }

  // G06: presets.
  const phoneOnly = new Set(sp.phone_only_m1b || []);
  for (const [region, f] of [...regions].sort((a, b) => byCode(a[0], b[0]))) {
    for (const [pid, p] of Object.entries(f.data.presets || {})) {
      const names = [p.trailhead, ...p.days.flatMap((d) => [d.to, ...d.via])];
      const scoped = (sp.play || []).includes(region) && names.every((x) => inScope.has(x));
      const line = lineIn(region, `presets.${pid}`);
      for (const x of names) if (phoneOnly.has(x)) add('G06', true, region, pid, regionFile(region), line, `preset ${pid} names ${x}, which only the phone call reaches (GAME_DESIGN 4.3)`);
      const last = p.days[p.days.length - 1].to;
      const endsOk = p.shape === 'loop' ? last === p.trailhead : nodes.has(last) && nodes.get(last).n.type === 'trailhead';
      if (!endsOk) add('G06', scoped, region, pid, regionFile(region), line, `preset ${pid} ends at ${last}, not ${p.shape === 'loop' ? 'its start' : 'a trailhead'}`);
      if (!graph) continue;
      let at = p.trailhead;
      for (const d of p.days) {
        if (!(d.mi10 === 0 && d.to === at && !d.via.length)) {
          try {
            const r = route(graph, [at, ...d.via, d.to]);
            if (r.mi10 !== d.mi10) add('G06', scoped, region, pid, regionFile(region), line, `preset ${pid}: the day to ${d.to} routes to ${(r.mi10 / 10).toFixed(1)} mi now, not ${(d.mi10 / 10).toFixed(1)} (run npm run ingest)`);
          } catch (e) {
            add('G06', scoped, region, pid, regionFile(region), line, `preset ${pid}: the day to ${d.to} doesn't route: ${e.message}`);
          }
        }
        at = d.to;
      }
    }
  }
  if (scope.first_trip) for (const x of scope.first_trip.never || []) if (!phoneOnly.has(x)) add('G06', true, 'scope', 'first_trip', 'content/scope/m1a.json', scopeLine('first_trip.never'), `first_trip.never: ${x} is not phone-only in park.phone_only_m1b`);
  for (const [name, f] of trips) {
    const hits = [];
    const visit = (v, path) => {
      if (typeof v === 'string' && phoneOnly.has(v)) hits.push(path);
      else if (Array.isArray(v)) v.forEach((x, i) => visit(x, `${path}[${i}]`));
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) visit(x, path ? `${path}.${k}` : k);
    };
    visit(f.data, '');
    for (const h of hits) add('G06', true, 'trips', name, `content/trips/${name}.json`, lineOfPath(f.src, h), `${h} names a phone-only camp (GAME_DESIGN 4.3: it's never in a preset, a fill or a first trip)`);
  }

  // G07: spurs.
  const spurNodes = [...nodes].filter(([, { n }]) => n.spur_only).map(([id]) => id);
  if (inScope.has('bogachiel_peak')) {
    const bp = nodes.get('bogachiel_peak');
    if (!bp || !bp.n.spur_only) add('G07', true, 'sol_duc_high_divide', 'bogachiel_peak', regionFile('sol_duc_high_divide'), lineIn('sol_duc_high_divide', 'nodes.bogachiel_peak'), 'Bogachiel Peak must be spur_only (M1A_DATA_CHECK item 1)');
    const into = [...segs].filter(([, { s }]) => s.a === 'bogachiel_peak' || s.b === 'bogachiel_peak');
    if (into.length !== 2) add('G07', true, 'sol_duc_high_divide', 'bogachiel_peak', regionFile('sol_duc_high_divide'), 1, `Bogachiel Peak has ${into.length} segments, not its two spurs`);
    for (const [id, { s, region }] of into) if (s.through !== false || !s.spur) add('G07', true, region, id, regionFile(region), lineIn(region, `segments.${id}`), `${id} must not be a through route, and must carry its spur block`);
  }
  for (const id of spurNodes) {
    const { region } = /** @type {{region: string}} */ (nodes.get(id));
    for (const [sid, { s }] of segs) if ((s.a === id || s.b === id) && s.through !== false) add('G07', inScope.has(id), region, sid, regionFile(region), lineIn(region, `segments.${sid}`), `${sid} touches the spur node ${id} but is a through route`);
  }
  if (graph) {
    const spur = new Set(spurNodes);
    for (const a of plannable) {
      for (const b of plannable) {
        if (a === b || !nodes.has(a) || !nodes.has(b)) continue;
        try {
          const r = route(graph, [a, b]);
          const inner = r.legs[0].nodes.slice(1, -1).filter((x) => spur.has(x));
          if (inner.length) add('G07', true, 'sol_duc_high_divide', `${a}->${b}`, regionFile('sol_duc_high_divide'), 1, `the route from ${a} to ${b} passes through the spur node ${inner[0]}`);
        } catch (e) {
          add('G07', true, 'sol_duc_high_divide', `${a}->${b}`, regionFile('sol_duc_high_divide'), 1, `no route from ${a} to ${b}: ${e.message}`);
        }
      }
    }
  }

  // G08: the M1a scope.
  const S = 'content/scope/m1a.json';
  const scopeSegs = [...segs].filter(([, { s }]) => segIn(s));
  const wantMapOnly = new Set(scopeSegs.filter(([, { s }]) => s.class === 'off_trail').map(([id]) => id));
  for (const [id, { s }] of scopeSegs) if (phoneOnly.has(s.a) || phoneOnly.has(s.b)) if (!wantMapOnly.has(id) && s.class !== 'off_trail' && [s.a, s.b].some((x) => (sp.pencil_rows || []).includes(x))) wantMapOnly.add(id);
  for (const id of wantMapOnly) if (!mapOnly.has(id)) add('G08', true, 'scope', 'park.map_only', S, scopeLine('park.map_only'), `${id} is ${segs.get(id).s.class === 'off_trail' ? 'an off-trail link' : 'the way to a phone-only lake from a pencil row'}: it belongs in park.map_only (BUILD_PLAN 3.4)`);
  for (const id of mapOnly) if (segs.has(id) && !wantMapOnly.has(id)) add('G08', true, 'scope', 'park.map_only', S, scopeLine('park.map_only'), `${id} is in park.map_only, but it is neither an off-trail link nor the way to a phone-only lake (BUILD_PLAN 3.4)`);
  for (const id of plannable) {
    const x = nodes.get(id);
    if (!x) continue;
    const cp = x.n.camp;
    const line = lineIn(x.region, `nodes.${id}`);
    if (!inScope.has(id)) add('G08', true, 'scope', id, S, scopeLine('park.camps'), `the plannable camp ${id} is outside park.nodes`);
    if (!cp) {
      add('G08', true, x.region, id, regionFile(x.region), line, `the plannable camp ${id} has no camp record`);
      continue;
    }
    if (cp.group_site || cp.stock_site) add('G08', true, x.region, id, regionFile(x.region), line, `${id} is a ${cp.group_site ? 'group' : 'stock'} site: never offered to a solo hiker (GAME_DESIGN 4.6)`);
    const desk = (sp.desk || []).includes(id);
    if (!desk && !(Number.isInteger(cp.sites) && cp.sites > 0)) add('G08', true, x.region, id, regionFile(x.region), line, `${id} has no sites (a quota camp's sites are its quota)`);
    for (const k of ['bear_can', 'food_storage', 'fires', 'toilet']) if (cp[k] === null || cp[k] === undefined) add('G08', true, x.region, id, regionFile(x.region), line, `${id} has no ${k}`);
    const water = x.n.place && x.n.place.water;
    for (const m of scope.months || []) if (!water || !water[String(m)]) add('G08', true, x.region, id, regionFile(x.region), line, `${id} has no water for month ${m}`);
  }
  for (const id of sp.never || []) {
    const x = nodes.get(id);
    if (x && !(x.n.camp && (x.n.camp.group_site || x.n.camp.stock_site))) add('G08', true, 'scope', 'park.never', S, scopeLine('park.never'), `${id} is in park.never but is no group or stock site`);
    if (plannable.includes(id)) add('G08', true, 'scope', 'park.never', S, scopeLine('park.never'), `${id} is never offered, but it is listed as plannable`);
  }
  for (const [id, { n }] of nodes) if (inScope.has(id) && n.camp && (n.camp.group_site || n.camp.stock_site) && !(sp.never || []).includes(id)) add('G08', true, 'scope', 'park.never', S, scopeLine('park.never'), `${id} is a group or stock site inside the scope: list it in park.never`);
  const scopeRoutable = new Set(scopeSegs.map(([id]) => id).filter((id) => !mapOnly.has(id)));
  for (const [r, ov] of overlays) {
    if (!(sp.play || []).includes(r)) continue;
    const file = `content/park/overlays/${r}.json`;
    const at = (path) => lineOfPath(ov.src, path);
    for (const [lid, l] of Object.entries(ov.data.loops || {})) {
      for (const k of ['ccw_first', 'cw_first']) if (segs.has(l[k]) && !scopeRoutable.has(l[k])) add('G08', true, r, `loops.${lid}`, file, at(`loops.${lid}.${k}`), `loops.${lid}.${k}: ${l[k]} is not a routable loop segment`);
      for (const k of ['ccw_first', 'cw_first']) {
        const s = segs.get(l[k]);
        if (s && s.s.a !== l.trailhead && s.s.b !== l.trailhead && graph) {
          // A direction gate leaves the falls, the first junction out of the trailhead: both gates share a node.
          const other = segs.get(l[k === 'ccw_first' ? 'cw_first' : 'ccw_first']);
          if (other && ![other.s.a, other.s.b].some((x) => x === s.s.a || x === s.s.b)) add('G08', true, r, `loops.${lid}`, file, at(`loops.${lid}.${k}`), `loops.${lid}: the two direction gates don't leave one junction`);
        }
      }
    }
    for (const [fid, fk] of Object.entries(ov.data.forks || {})) {
      const s = segs.get(fk.way_in);
      if (s && !scopeRoutable.has(fk.way_in)) add('G08', true, r, `forks.${fid}`, file, at(`forks.${fid}.way_in`), `forks.${fid}.way_in: ${fk.way_in} is not a routable loop segment`);
      if (s && s.s.a !== fid && s.s.b !== fid) add('G08', true, r, `forks.${fid}`, file, at(`forks.${fid}.way_in`), `forks.${fid}.way_in: ${fk.way_in} doesn't touch ${fid}`);
    }
  }

  // Acknowledgements: outside the scope a finding is explained only by ingest_known.json.
  const acks = Object.keys((known && known.data) || {}).filter((k) => /^G\d\d:/.test(k));
  const used = new Set();
  /** @type {Issue[]} */
  const out = [];
  for (const f of found) {
    if (f.level === 'warn') {
      const ack = acks.find((a) => covers(a, /** @type {string} */ (f.key)));
      if (ack) {
        used.add(ack);
        continue;
      }
      out.push({ ...f, level: 'error', msg: `${f.msg} (outside the M1a scope: acknowledge "${f.key}" in content/park/ingest_known.json with its why)` });
    } else out.push({ ...f, level: 'error' });
  }
  for (const a of acks) if (!used.has(a)) out.push({ file: 'content/park/ingest_known.json', line: known ? lineOfPath(known.src, a) : 1, code: a.slice(0, 3), msg: `"${a}" acknowledges nothing (stale)`, level: 'error' });
  return out.map(({ key, ...i }) => i).sort((a, b) => byCode(a.file, b.file) || a.line - b.line || byCode(a.code, b.code));
}

/**
 * The findings before acknowledgement, with their keys (for ingest_known.json and the tests).
 * @param {string} [root]
 * @param {ReturnType<typeof readPark>} [input]
 */
export function graphFindings(root = ROOT, input = readPark(root)) {
  const noAcks = { ...input, known: null };
  return lintGraph(root, noAcks);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const issues = lintGraph();
  for (const i of issues) console.log(`${i.file}:${i.line}: ${i.code} ${i.msg}`);
  console.log(issues.length ? `graphlint: ${issues.length} problem${issues.length === 1 ? '' : 's'}` : 'graphlint: clean (G01-G04, G06-G08)');
  process.exit(issues.length ? 1 : 0);
}
