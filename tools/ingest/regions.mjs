// Ingest of the park's regions (BUILD_PLAN 3.2, 3.4, S4; GAME_DESIGN 4.1,
// E.4, E.5): design/data/regions/*.json to content/park/regions/*.json.
//
// ingestRegions(ctx) normalizes each region, merges the seven by id,
// applies the hand overlays, routes every preset day on the merged graph
// and returns the generated files and the report entries. The rules, in
// the order they run (GAME_DESIGN E.4, as built):
//   IG01  the source's shape: every region needs region_id, researched_on,
//         nodes and segments; a node id, name and type; a segment from, to
//         and trail_class (an error drops the record). Distances in
//         hundredths round to tenths, half up; a camp's sites given as text
//         are read as their first number, an estimate.
//   IG02  the same node id in two regions merges into one record (the
//         region whose id sorts first wins, nulls filled from the others);
//         shared_with names the other regions. Elevations or positions more
//         than 100 ft apart: an error inside the M1a scope, a warning
//         elsewhere (E.4's G04, which lint G04 re-checks).
//   IG03  the same segment in two regions (written either way) merges:
//         its id and numbers from the region whose id sorts first, hazards
//         the union. Info within 0.1 mi and 100 ft, a warning beyond. Two
//         segments written between one pair in opposite directions inside
//         one region are two trails (loop trails), each kept, noted once.
//   IG04  a null gain or loss is derived from the endpoints' elevations and
//         listed in the segment's est; a null distance can't be derived, so
//         the segment is kept but left out of routing (a warning).
//   IG05  a null elevation is the mean of its neighbors' along segments,
//         rounded to 10 ft (elev_est); an overlay may pin it. Inside the
//         scope a null elevation is an error, except a footnote's (no trail
//         reaches it). Null coordinates stay null; the map draws map_xy.
//   IG06  hazard words map to the canonical tags (content/park/vocab/
//         hazards.json); an unknown word becomes x_<word>, a warning.
//   IG07  statuses written as hazards (trail_closed_2026,
//         possibly_closed_2026) leave the segment and go to the dated
//         conditions (tools/ingest/conditions.mjs, track B).
//   IG08  snow_free_typical text parses to day-of-year windows (non-leap
//         days; early, mid and late a month are its 5th, 15th and 25th, a
//         bare month its first or last day; year-round is [1, 366]); a
//         phrase the parser can't read is null, a warning.
//   IG09  every preset day is routed on the merged graph (web/js/engine/
//         graph.js, by base seconds, with the day's via pins); the typed
//         miles stay as typed_mi10. Different by more than 0.1 mi, or a
//         null day: a warning, an error inside the scope.
//   IG10  a preset that doesn't end at a trailhead (a loop: at its start),
//         or can't route, is left out: a warning, an error inside the scope.
//   IG11  rule text that disagrees with park_rules.json (WAG bags, where
//         the park says blue bags), the research's prose fields (counted
//         per field), and uncertain claims (the M1a region's by index).
//   IG12  a Strava link is stripped from every list of sources.
//   IG22  tide limits in free text (E.4): for each coast segment (beach or
//         headland overland) whose notes give a tide height, the strictest
//         is proposed as its tide_max_ft, quoting the words it came from;
//         a tide-dependent segment whose notes give none is listed too.
//         Proposals only: a human confirms each in the coast overlay (M4),
//         so nothing reaches the generated region file from here.
// The M1a scope is content/scope/m1a.json's park.nodes, and the segments
// with both ends among them.

import { buildGraph, route } from '../../web/js/engine/graph.js';

/** The research's region files. */
export const REGION_DIR = 'design/data/regions';
/** Where the normalized regions go. */
export const OUT_DIR = 'content/park/regions';
/** Feet per degree of latitude (a mean; the G04 check needs 100 ft, not survey precision). */
const FT_PER_DEG = 364000;

const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const own = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** Tenths of a mile, half up, from a decimal (read to the hundredth, so 0.95 is 1.0, never 0.9 by float error). */
export function mi10Of(miles) {
  const h = Math.round(miles * 100);
  return Math.floor((h + 5) / 10);
}

// ---- Snow windows (IG08) ----------------------------------------------------

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const BEFORE = MONTH_DAYS.reduce((a, d, i) => (a.push(a[i] + d), a), [0]);
const MONTHS = { jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12 };
const QUAL = { early: 5, mid: 15, late: 25 };
/** Day of the (non-leap) year. */
export const doyOf = (m, d) => BEFORE[m - 1] + d;
const MONTH_RE = '(january|february|march|april|may|june|july|august|september|october|november|december|sept|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\\b';
const QUAL_RE = '(?:(early|mid|late)[\\s-]*(?:/\\s*(?:early|mid|late)[\\s-]*)?)';
const RANGE_RE = new RegExp(`${QUAL_RE}?${MONTH_RE}(?:\\s+(\\d{1,2})\\b)?(?:\\s*(?:/|\\bor\\b)\\s*${QUAL_RE.replace(/\(early\|mid\|late\)/, '(?:early|mid|late)')}?${MONTH_RE.replace(/^\(/, '(?:')})?\\s*(?:to|through|until|-|–)\\s*${QUAL_RE}?${MONTH_RE}(?:\\s+(\\d{1,2})\\b)?`, 'g');

/**
 * snow_free_typical text to day-of-year windows, or null when it can't be read.
 * @param {unknown} text
 * @returns {number[][] | null}
 */
export function parseSnow(text) {
  if (typeof text !== 'string') return null;
  const t = text.toLowerCase();
  if (/^\W*(?:(?:about|typically|usually|roughly)\s+)?(?:year-round|all seasons)/.test(t)) return [[1, 366]];
  if (/^\W*never\s+(?:reliably\s+)?snow-free/.test(t)) return [];
  for (const m of t.matchAll(RANGE_RE)) {
    const before = t.slice(Math.max(0, m.index - 30), m.index);
    if (/snow(?:-covered)?[^;]*$/.test(before) && !/snow-free[^;]*$/.test(before)) continue;
    const [, q1, m1, d1, q2, m2, d2] = m;
    const a = MONTHS[m1];
    const b = MONTHS[m2];
    const start = doyOf(a, d1 ? Number(d1) : q1 ? QUAL[q1] : 1);
    const end = doyOf(b, d2 ? Number(d2) : q2 ? QUAL[q2] : MONTH_DAYS[b - 1]);
    return start <= end ? [[start, end]] : [[start, 366], [1, end]];
  }
  return null;
}

// ---- Tide limits (IG22) -----------------------------------------------------

/** The trail classes a tide can close (the coast's). */
export const TIDE_CLASSES = Object.freeze(['beach', 'headland_overland']);
const FT = '([+-]?\\d+(?:\\.\\d+)?)\\s*(?:ft|feet)\\b';
/** The phrases that state a passage's tide limit, each giving one or two heights (the strictest wins). */
const TIDE_RES = Object.freeze([
  new RegExp(`(?:(?:about|~)\\s*)?${FT}\\s+or\\s+lower`, 'gi'),
  new RegExp(`underwater\\s+above\\s+(?:(?:about|~)\\s*)?${FT}`, 'gi'),
  new RegExp(`restrictions?\\s+of\\s+([+-]?\\d+(?:\\.\\d+)?)\\s*-\\s*[+-]?\\d+(?:\\.\\d+)?\\s*(?:ft|feet)\\b`, 'gi'),
  new RegExp(`pinches\\s+at\\s+${FT}\\s+and\\s+${FT}`, 'gi'),
]);

/**
 * The tide limit a segment's free text states (E.4): the strictest height
 * among its limit phrases ("N ft or lower", "underwater above N ft",
 * "restrictions of N-M ft", "pinches at N ft and M ft"), with the phrases,
 * or null when it states none. A depth at a tide ("knee-deep at +6 ft") or a
 * height of something else ("250 ft bluffs") is no limit.
 * @param {unknown} text
 * @returns {{ft: number, phrases: string[]} | null}
 */
export function tideLimit(text) {
  if (typeof text !== 'string') return null;
  const heights = [];
  const phrases = [];
  for (const re of TIDE_RES) {
    for (const m of text.matchAll(re)) {
      for (const h of m.slice(1)) if (h !== undefined) heights.push(Number(h));
      phrases.push(m[0].trim());
    }
  }
  return heights.length ? { ft: Math.min(...heights), phrases } : null;
}

// ---- Shapes ---------------------------------------------------------------

/** The research's prose fields, dropped (names reach the game only through the gazetteer, B7). */
export const DROPPED = Object.freeze({
  region: ['region_name', 'summary', 'wildlife_and_plants', 'permit_and_rules', 'uncertain_claims', 'camp_field_notes', 'conditions_2026_fields', 'classic_trips_via_note'],
  node: ['name', 'description', 'scene_art_notes', 'game_notes', 'routing.rule', 'camp.reservation_or_quota', 'camp.water', 'camp.notes'],
  segment: ['notes', 'spur.rule'],
  trailhead: ['access', 'road_status_2026', 'notes'],
  preset: ['name', 'best_months', 'highlights', 'layover_ideas', 'what_goes_wrong_for_underprepared_hikers', 'itinerary[].note', 'itinerary[].via_note', 'itinerary[].gain_ft'],
  hazard: ['name', 'season', 'real_world', 'game_event_idea'],
});

/** Stale rule text in a region file, which park_rules.json overrides (IG11). */
export const STALE_TEXT = Object.freeze([{ re: /\bwag\s+bags?\b/i, what: 'says WAG bags; park_rules.json (food_storage, Mount Olympus) says blue bags, and wins' }]);

/** URLs ingest never carries (IG12). */
const STRAVA = /strava\.com/i;

/** Trail classes as the movement rules name them (GAME_DESIGN 7.4). */
export const CLASS_MAP = Object.freeze({
  road_walk: 'road_walk',
  maintained: 'maintained',
  primitive: 'primitive',
  way_trail: 'way_trail',
  off_trail: 'off_trail',
  snow_or_glacier: 'snow',
  headland_overland: 'coast_overland',
  beach: 'beach_sand',
});

/** Month names to their numbers, for the place fields' month keys. */
const MONTH_KEY = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

/** "Jul 1" to "07-01". */
function mmdd(s) {
  const m = /^([A-Z][a-z]{2})\s+(\d{1,2})$/.exec(String(s));
  if (!m || !MONTH_KEY[m[1]]) return null;
  return `${String(MONTH_KEY[m[1]]).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

/** Month-keyed object ("Aug") to number keys ("8"). */
function monthKeys(o) {
  if (!o || typeof o !== 'object') return o ?? null;
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    if (k === 'note') continue;
    out[own(MONTH_KEY, k) ? String(MONTH_KEY[k]) : k] = v;
  }
  return out;
}

/** Keep the URLs, minus Strava; report each stripped, and each source that isn't a URL. */
function urls(list, where, entries) {
  const out = [];
  for (const u of Array.isArray(list) ? list : []) {
    if (typeof u !== 'string') continue;
    if (STRAVA.test(u)) {
      entries.push({ code: 'IG12', level: 'info', where, msg: 'a Strava link stripped' });
      continue;
    }
    if (!/^https?:\/\//.test(u)) {
      entries.push({ code: 'IG11', level: 'info', where, msg: `the source "${u}" is not a URL: kept in design/data, not carried` });
      continue;
    }
    if (!out.includes(u)) out.push(u);
  }
  return out;
}

/** A hazard's mitigations as ids (lowercase); a word that isn't one stays in design/data (IG11). */
function mitigationsOf(h, where, entries) {
  const out = [];
  for (const m of Array.isArray(h.mitigations) ? h.mitigations : []) {
    if (typeof m !== 'string') continue;
    const id = m.toLowerCase();
    if (/^[a-z][a-z0-9_]*$/.test(id)) out.push(id);
    else entries.push({ code: 'IG11', level: 'info', where, msg: `the mitigation "${m}" is not an id: not carried` });
  }
  return out;
}

/** Every string in a value, with its path. */
function* strings(v, path = '') {
  if (typeof v === 'string') yield [path, v];
  else if (Array.isArray(v)) for (let i = 0; i < v.length; i++) yield* strings(v[i], `${path}[${i}]`);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) yield* strings(x, path ? `${path}.${k}` : k);
}

/** Feet apart, two lat/lon points (flat, at their mean latitude). */
function feetApart(a, b) {
  if (![a.lat, a.lon, b.lat, b.lon].every(isNum)) return 0;
  const dy = (a.lat - b.lat) * FT_PER_DEG;
  const dx = (a.lon - b.lon) * FT_PER_DEG * Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  return Math.sqrt(dx * dx + dy * dy);
}

// ---- One region -----------------------------------------------------------

/**
 * A hazard word to its canonical tag, from the vocab.
 * @param {any} hazards content/park/vocab/hazards.json
 */
export function hazardMap(hazards) {
  const map = new Map();
  for (const [tag, words] of Object.entries(hazards.tags || {})) for (const w of words) map.set(w, tag);
  return map;
}

/** A camp record, normalized (IG01 for sites given as text). */
function normCamp(c, desk, where, entries) {
  if (!c || typeof c !== 'object') return null;
  let sites = c.sites ?? null;
  let sitesEst = false;
  if (typeof sites === 'string') {
    const m = /\d+/.exec(sites);
    entries.push({ code: 'IG01', level: 'warn', where, msg: `camp.sites is text ("${sites}"): read as ${m ? m[0] : 'unknown'}, an estimate` });
    sites = m ? Number(m[0]) : null;
    sitesEst = true;
  }
  const out = {
    sites,
    group_site: c.group_site === true,
    stock_site: c.stock_site === true,
    group_sites: Number.isInteger(c.group_sites) ? c.group_sites : 0,
    stock_sites: Number.isInteger(c.stock_sites) ? c.stock_sites : 0,
    desk,
    bear_can: c.bear_can_required ?? null,
    food_storage: c.food_storage ?? null,
    fires: c.fires_allowed ?? null,
    toilet: c.toilet ?? null,
  };
  if (sitesEst) out.sites_est = true;
  return out;
}

/** A place record from m1a_play_inputs.places (E.5's overlay fields), words left out. */
function normPlace(p) {
  if (!p) return null;
  const out = {
    map_xy: Array.isArray(p.map_xy) ? p.map_xy : null,
    canopy: p.canopy ?? null,
    cold_pool: p.cold_pool ?? null,
    water: monthKeys(p.water),
    views: Array.isArray(p.views) ? p.views : [],
    view_score: p.view_score ?? null,
    traffic: p.traffic_section ?? null,
    lily: p.bonfire_lily_weight ? { m1a: p.bonfire_lily_weight.m1a, from_m1b: p.bonfire_lily_weight.from_m1b } : null,
  };
  if (p.snow_feature) {
    const s = p.snow_feature;
    out.snow_feature = {
      normal_window: (s.normal_window || []).map(mmdd),
      low_shift_days: s.low_snow_year_shift_days ?? null,
      high_shift_days: s.high_snow_year_shift_days ?? null,
      estimate: s.estimate === true,
    };
  }
  return out;
}

/**
 * Normalize one region's raw file (before the merge).
 * @param {{file: string, data: any}} src
 * @param {{hazards: Map<string, string>, notHazards: any, scopeNodes: Set<string>}} o
 * @param {any[]} entries
 */
export function normalizeRegion({ file, data }, { hazards, notHazards, scopeNodes }, entries) {
  const bad = (where, msg) => entries.push({ code: 'IG01', level: 'error', where, msg });
  if (!data || typeof data !== 'object') {
    bad(file, 'not a region object');
    return null;
  }
  for (const k of ['region_id', 'researched_on']) if (typeof data[k] !== 'string') bad(`${file}:${k}`, `needs ${k}`);
  for (const k of ['nodes', 'segments']) if (!Array.isArray(data[k])) bad(`${file}:${k}`, `needs ${k} (a list)`);
  if (typeof data.region_id !== 'string' || !Array.isArray(data.nodes) || !Array.isArray(data.segments)) return null;
  const region = data.region_id;
  const inputs = data.m1a_play_inputs || null;
  const places = (inputs && inputs.places && inputs.places.nodes) || {};
  const deskIds = new Set(inputs && inputs.desk_requests ? [...(inputs.desk_requests.m1a || []), ...(inputs.desk_requests.m1b || [])] : []);
  const dropped = new Map();
  const drop = (field, n = 1) => dropped.set(field, (dropped.get(field) || 0) + n);
  for (const k of DROPPED.region) if (own(data, k)) drop(k);

  /** @type {Record<string, any>} */
  const nodes = {};
  data.nodes.forEach((n, i) => {
    const where = `${region}/${n && n.id ? n.id : `nodes[${i}]`}`;
    if (!n || typeof n.id !== 'string' || typeof n.name !== 'string' || typeof n.type !== 'string') {
      bad(where, 'a node needs id, name and type');
      return;
    }
    if (own(nodes, n.id)) {
      bad(where, 'the node id is listed twice in its region');
      return;
    }
    for (const k of DROPPED.node) {
      const [a, b] = k.split('.');
      if (b ? n[a] && own(n[a], b) : own(n, a)) drop(`node.${k}`);
    }
    nodes[n.id] = {
      type: n.type,
      elev_ft: Number.isInteger(n.elevation_ft) ? n.elevation_ft : null,
      elev_est: false,
      lat: isNum(n.lat) ? n.lat : null,
      lon: isNum(n.lon) ? n.lon : null,
      zone: null,
      camp: normCamp(n.camp, deskIds.has(n.id), where, entries),
      spur_only: !!(n.routing && n.routing.spur_only === true),
      place: own(places, n.id) ? normPlace(places[n.id]) : null,
      shared_with: [],
      sources: urls(n.sources, where, entries),
    };
  });

  /** @type {Record<string, any>} */
  const segments = {};
  /** @type {any[]} */
  const statuses = [];
  const words = new Map();
  data.segments.forEach((s, i) => {
    const id = s && typeof s.from === 'string' && typeof s.to === 'string' ? `${s.from}->${s.to}` : `segments[${i}]`;
    const where = `${region}/${id}`;
    if (!s || typeof s.from !== 'string' || typeof s.to !== 'string' || typeof s.trail_class !== 'string') {
      bad(where, 'a segment needs from, to and trail_class');
      return;
    }
    if (own(segments, id)) {
      bad(where, 'the segment is listed twice in its region');
      return;
    }
    const inScope = scopeNodes.has(s.from) && scopeNodes.has(s.to);
    for (const k of DROPPED.segment) {
      const [a, b] = k.split('.');
      if (b ? s[a] && own(s[a], b) : own(s, a)) drop(`segment.${k}`);
    }
    const est = [];
    let mi10 = null;
    if (isNum(s.miles)) {
      mi10 = mi10Of(s.miles);
      if (Math.abs(mi10 - s.miles * 10) > 1e-6) entries.push({ code: 'IG01', level: 'info', where, msg: `${s.miles} mi rounds to ${(mi10 / 10).toFixed(1)} (tenths, half up)`, scope: inScope });
    }
    const cls = own(CLASS_MAP, s.trail_class) ? CLASS_MAP[s.trail_class] : null;
    if (!cls) bad(where, `trail_class "${s.trail_class}" is not one ingest knows`);
    if (s.trail_class === 'beach') est.push('class');
    const tags = new Set();
    let noCamping = false;
    for (const w of Array.isArray(s.hazards) ? s.hazards : []) {
      if (own(notHazards, w)) {
        const nh = notHazards[w];
        if (nh.as === 'status') {
          statuses.push({ applies_to: [id], from: null, persists: true, last_confirmed: data.researched_on, effect: nh.effect, derived_from: 'hazard', region, word: w });
          entries.push({ code: 'IG07', level: 'info', where, msg: `${w} moved to the dated conditions as ${nh.effect}`, scope: inScope });
        } else if (nh.as === 'field' && nh.field === 'no_camping') noCamping = true;
        continue;
      }
      const tag = hazards.get(w);
      if (tag) {
        tags.add(tag);
        words.set(w, (words.get(w) || 0) + 1);
      } else {
        tags.add(`x_${w}`);
        entries.push({ code: 'IG06', level: 'warn', where, msg: `the hazard word "${w}" maps to no canonical tag: x_${w}`, scope: inScope });
      }
    }
    const snow = parseSnow(s.snow_free_typical);
    if (snow === null) entries.push({ code: 'IG08', level: 'warn', where, msg: `snow_free_typical "${s.snow_free_typical}" doesn't parse: no window (an overlay may supply one)`, scope: inScope });
    if (TIDE_CLASSES.includes(s.trail_class)) {
      const tide = tideLimit(s.notes);
      const tideWord = Array.isArray(s.hazards) && s.hazards.includes('tide_dependent');
      if (tide) entries.push({ code: 'IG22', level: 'info', where, msg: `propose tide_max_ft ${tide.ft} (${s.trail_class}; its notes: ${tide.phrases.map((p) => `"${p}"`).join(', ')}): a human confirms it in the coast overlay`, scope: inScope });
      else if (tideWord) entries.push({ code: 'IG22', level: 'info', where, msg: `tide_dependent, but its notes give no height: the coast overlay sets tide_max_ft`, scope: inScope });
    }
    const spur = s.spur && typeof s.spur === 'object' ? { summit: s.spur.summit, junction: s.spur.junction, out_and_back: s.spur.out_and_back === true, preferred: s.spur.preferred_path === true } : null;
    segments[id] = {
      a: s.from,
      b: s.to,
      mi10,
      gain: Number.isInteger(s.gain_ft) ? s.gain_ft : null,
      loss: Number.isInteger(s.loss_ft) ? s.loss_ft : null,
      est,
      class: cls || s.trail_class,
      through: s.through_route !== false,
      spur,
      one_way: false,
      no_camping: noCamping,
      hazards: [...tags].sort(byCode),
      snow_free_doy: snow,
      snow_text: typeof s.snow_free_typical === 'string' ? s.snow_free_typical : null,
      sources: urls(s.sources, where, entries),
    };
  });
  for (const [w, n] of [...words].sort((a, b) => byCode(a[0], b[0]))) entries.push({ code: 'IG06', level: 'info', where: `${region}/hazard:${w}`, msg: `"${w}" -> ${hazards.get(w)} on ${n} segment${n === 1 ? '' : 's'}`, scope: region === 'sol_duc_high_divide' });

  /** @type {Record<string, any>} */
  const trailheads = {};
  for (const t of Array.isArray(data.trailheads) ? data.trailheads : []) {
    if (!t || typeof t.node_id !== 'string') continue;
    for (const k of DROPPED.trailhead) if (own(t, k)) drop(`trailhead.${k}`);
    const dm = {};
    for (const [k, v] of Object.entries(t.drive_minutes_from || {})) dm[k] = Number.isInteger(v) ? v : null;
    trailheads[t.node_id] = { drive_min: dm, drive_est: true };
  }

  /** @type {Record<string, any>} */
  const hazardsOut = {};
  const tokens = [...hazards.keys(), ...new Set(hazards.values())].sort((a, b) => b.length - a.length || byCode(a, b));
  for (const h of Array.isArray(data.hazards) ? data.hazards : []) {
    if (!h || typeof h.id !== 'string') continue;
    for (const k of DROPPED.hazard) if (own(h, k)) drop(`hazard.${k}`);
    const tags = new Set();
    for (const w of tokens) if (new RegExp(`(^|_)${w}(_|$)`).test(h.id)) tags.add(hazards.get(w) || w);
    hazardsOut[h.id] = {
      where: (h.where || []).map((w) => String(w).replace(/^([a-z0-9_]+)(?:>|\|)([a-z0-9_]+)$/, '$1->$2')),
      tags: [...tags].sort(byCode),
      mitigations: mitigationsOf(h, `${region}/${h.id}`, entries),
    };
  }

  const presets = [];
  for (const t of Array.isArray(data.classic_trips) ? data.classic_trips : []) {
    if (!t || typeof t.id !== 'string') continue;
    for (const k of DROPPED.preset) {
      if (k.startsWith('itinerary[].')) {
        const f = k.slice('itinerary[].'.length);
        const n = (t.itinerary || []).filter((d) => d && own(d, f)).length;
        if (n) drop(`preset.${k}`, n);
      } else if (own(t, k)) drop(`preset.${k}`);
    }
    presets.push(t);
  }

  // Stale text (IG11), anywhere in the file.
  for (const [path, s] of strings(data)) for (const st of STALE_TEXT) if (st.re.test(s)) entries.push({ code: 'IG11', level: 'info', where: `${file}:${path}`, msg: st.what });
  for (const [field, n] of [...dropped].sort((a, b) => byCode(a[0], b[0]))) entries.push({ code: 'IG11', level: 'info', where: `${region}/dropped:${field}`, msg: `${n} dropped (research prose stays in design/data for authors)` });
  const claims = Array.isArray(data.uncertain_claims) ? data.uncertain_claims : [];
  if (region === 'sol_duc_high_divide') {
    claims.forEach((c, i) => entries.push({ code: 'IG11', level: 'info', where: `${region}/uncertain_claims[${i}]`, msg: `uncertain, not carried: ${String(typeof c === 'string' ? c : JSON.stringify(c)).slice(0, 160)}`, scope: true }));
  } else if (claims.length) entries.push({ code: 'IG11', level: 'info', where: `${region}/uncertain_claims`, msg: `${claims.length} uncertain claims, not carried` });

  const crossings = inputs && inputs.crossings && Array.isArray(inputs.crossings.list) ? inputs.crossings.list.map((c) => ({ at: c.at, segment: c.segment, kind: c.kind })) : [];
  let traffic = {};
  if (inputs && inputs.trail_traffic) {
    const tt = inputs.trail_traffic;
    const sections = {};
    for (const [k, v] of Object.entries(tt.sections || {})) sections[k] = { segments: v.segments || [], parties_per_hour: v.parties_per_hour || {}, rangers_per_hour: v.rangers_per_hour || {} };
    traffic = { hour_factor: tt.hour_factor || {}, month_factor: monthKeys(tt.month_factor), weather_factor: tt.weather_factor || {}, sections, estimate: inputs.estimate === true };
  }
  return {
    file,
    region,
    researched_on: data.researched_on,
    nodes,
    segments,
    trailheads,
    presets,
    hazards: hazardsOut,
    crossings,
    traffic,
    statuses,
    sources: urls(data.sources, `${region}/sources`, entries),
    raw: data,
  };
}

// ---- The merge, the fixes, the presets -----------------------------------

/**
 * The whole run over the regions.
 * @param {object} ctx
 * @param {{file: string, data: any}[]} ctx.regions the parsed region files, sorted by file
 * @param {any} ctx.hazards content/park/vocab/hazards.json
 * @param {any} ctx.zones content/park/vocab/zones.json
 * @param {Record<string, any>} ctx.overlays region overlays by region id
 * @param {any} ctx.scope content/scope/m1a.json
 * @param {any} ctx.movement content/rules/movement.json
 */
export function ingestRegions({ regions: raws, hazards, zones, overlays, scope, movement }) {
  /** @type {any[]} */
  const entries = [];
  const estimates = [];
  const doubts = [];
  const scopeNodes = new Set((scope && scope.park && scope.park.nodes) || []);
  const footnotes = new Set((scope && scope.park && scope.park.footnotes) || []);
  const play = new Set((scope && scope.park && scope.park.play) || []);
  const mapOnly = new Set((scope && scope.park && scope.park.map_only) || []);
  const hmap = hazardMap(hazards);
  const regions = raws.map((r) => normalizeRegion(r, { hazards: hmap, notHazards: hazards.not_hazards || {}, scopeNodes }, entries)).filter(Boolean);
  regions.sort((a, b) => byCode(a.region, b.region));
  const inScopeSeg = (s) => scopeNodes.has(s.a) && scopeNodes.has(s.b);

  // Nodes: one record per id, the first region's, nulls filled from the rest (IG02).
  /** @type {Map<string, any>} */
  const nodes = new Map();
  /** @type {Map<string, string[]>} */
  const nodeRegions = new Map();
  for (const r of regions) {
    for (const [id, n] of Object.entries(r.nodes)) {
      if (!nodes.has(id)) {
        nodes.set(id, structuredClone(n));
        nodeRegions.set(id, [r.region]);
        continue;
      }
      const m = nodes.get(id);
      const first = nodeRegions.get(id)[0];
      /** @type {string[]} */ (nodeRegions.get(id)).push(r.region);
      const dz = isNum(m.elev_ft) && isNum(n.elev_ft) ? Math.abs(m.elev_ft - n.elev_ft) : 0;
      const dp = feetApart(m, n);
      const inScope = scopeNodes.has(id);
      if (dz > 100 || dp > 100) {
        entries.push({ code: 'IG02', level: inScope ? 'error' : 'warn', where: `${r.region}/${id}`, msg: `shared with ${first}, but ${dz > 100 ? `${dz} ft apart in elevation` : ''}${dz > 100 && dp > 100 ? ' and ' : ''}${dp > 100 ? `${Math.round(dp)} ft apart in position` : ''} (G04)`, scope: inScope });
      } else entries.push({ code: 'IG02', level: 'info', where: `${r.region}/${id}`, msg: `shared with ${first}: merged (${Math.round(dz)} ft apart in elevation, ${Math.round(dp)} ft in position)`, scope: inScope });
      for (const k of ['elev_ft', 'lat', 'lon', 'camp', 'place']) if (m[k] === null && n[k] !== null) m[k] = structuredClone(n[k]);
      if (m.camp && n.camp) {
        for (const [k, v] of Object.entries(n.camp)) if (m.camp[k] === null || m.camp[k] === undefined) m.camp[k] = v;
        m.camp.desk = m.camp.desk || n.camp.desk;
      }
      m.spur_only = m.spur_only || n.spur_only;
      for (const u of n.sources) if (!m.sources.includes(u)) m.sources.push(u);
    }
  }

  // Segments: by id, and a pair written the other way in another region is the same segment (IG03).
  /** @type {Map<string, any>} */
  const segs = new Map();
  /** @type {Map<string, string[]>} */
  const segRegions = new Map();
  /** @type {Map<string, string>} */
  const alias = new Map();
  const pairs = new Map();
  for (const r of regions) {
    for (const [id, s] of Object.entries(r.segments)) {
      const rev = `${s.b}->${s.a}`;
      let target = null;
      let flipped = false;
      if (segs.has(id) && !(segRegions.get(id) || []).includes(r.region)) target = id;
      else if (segs.has(rev) && !(segRegions.get(rev) || []).includes(r.region)) {
        target = rev;
        flipped = true;
      }
      if (!target) {
        if (segs.has(rev)) {
          const k = [s.a, s.b].sort(byCode).join('|');
          if (!pairs.has(k)) {
            pairs.set(k, true);
            entries.push({ code: 'IG03', level: 'info', where: `${r.region}/${rev}`, msg: `${rev} and ${id} are written between one pair, opposite ways, in one region: two trails, each kept`, scope: inScopeSeg(s) });
          }
        }
        segs.set(id, structuredClone(s));
        segRegions.set(id, [r.region]);
        continue;
      }
      const m = segs.get(target);
      const first = segRegions.get(target)[0];
      /** @type {string[]} */ (segRegions.get(target)).push(r.region);
      if (flipped) alias.set(id, target);
      const gain = flipped ? s.loss : s.gain;
      const loss = flipped ? s.gain : s.loss;
      const dmi = isNum(m.mi10) && isNum(s.mi10) ? Math.abs(m.mi10 - s.mi10) : 0;
      const dft = Math.max(isNum(m.gain) && isNum(gain) ? Math.abs(m.gain - gain) : 0, isNum(m.loss) && isNum(loss) ? Math.abs(m.loss - loss) : 0);
      const where = `${r.region}/${id}`;
      const how = flipped ? `written the other way in ${first} as ${target}` : `also in ${first}`;
      if (dmi > 1 || dft > 100) entries.push({ code: 'IG03', level: 'warn', where, msg: `${how}: ${dmi / 10} mi and ${dft} ft apart; ${first}'s numbers kept`, scope: inScopeSeg(m) });
      else entries.push({ code: 'IG03', level: 'info', where, msg: `${how}: merged (${dmi / 10} mi and ${dft} ft apart; ${first}'s numbers kept, the hazards joined)`, scope: inScopeSeg(m) });
      for (const k of ['mi10', 'gain', 'loss']) {
        const v = k === 'gain' ? gain : k === 'loss' ? loss : s.mi10;
        if (m[k] === null && v !== null) m[k] = v;
      }
      m.hazards = [...new Set([...m.hazards, ...s.hazards])].sort(byCode);
      if (m.snow_free_doy === null && s.snow_free_doy !== null) m.snow_free_doy = s.snow_free_doy;
      m.no_camping = m.no_camping || s.no_camping;
      for (const u of s.sources) if (!m.sources.includes(u)) m.sources.push(u);
    }
  }
  const segId = (id) => alias.get(id) || id;

  // Overlays: pinned values (nodes, segments), before the derived ones.
  for (const [rid, ov] of Object.entries(overlays || {})) {
    for (const [id, patch] of Object.entries((ov && ov.nodes) || {})) {
      const n = nodes.get(id);
      if (!n) {
        entries.push({ code: 'IG01', level: 'error', where: `content/park/overlays/${rid}.json:nodes.${id}`, msg: 'patches a node no region has (G01)' });
        continue;
      }
      for (const [k, v] of Object.entries(patch)) if (k !== 'doc' && k !== 'source') n[k] = v;
      entries.push({ code: 'IG05', level: 'info', where: `${rid}/${id}`, msg: `pinned by the overlay: ${Object.keys(patch).filter((k) => k !== 'doc' && k !== 'source').join(', ')}`, scope: scopeNodes.has(id) });
    }
    for (const [id, patch] of Object.entries((ov && ov.segments) || {})) {
      const s = segs.get(segId(id));
      if (!s) {
        entries.push({ code: 'IG01', level: 'error', where: `content/park/overlays/${rid}.json:segments.${id}`, msg: 'patches a segment no region has (G01)' });
        continue;
      }
      for (const [k, v] of Object.entries(patch)) if (k !== 'doc' && k !== 'source') s[k] = v;
      if (patch.snow_free_doy) {
        // The overlay supplies the window the text didn't give: no longer a warning.
        for (let i = entries.length - 1; i >= 0; i--) if (entries[i].code === 'IG08' && entries[i].level === 'warn' && entries[i].where.endsWith(`/${id}`)) entries.splice(i, 1);
        entries.push({ code: 'IG08', level: 'info', where: `${rid}/${segId(id)}`, msg: `the overlay supplies the snow window ${JSON.stringify(patch.snow_free_doy)} (${patch.source})`, scope: inScopeSeg(s) });
      }
    }
  }

  // Null elevations: the mean of the neighbors', to 10 ft, repeated until nothing moves (IG05).
  /** @type {Map<string, string[]>} */
  const nbrs = new Map([...nodes.keys()].map((id) => [id, []]));
  for (const s of segs.values()) {
    if (nbrs.has(s.a) && nbrs.has(s.b)) {
      /** @type {string[]} */ (nbrs.get(s.a)).push(s.b);
      /** @type {string[]} */ (nbrs.get(s.b)).push(s.a);
    }
  }
  for (;;) {
    const fill = [];
    for (const id of [...nodes.keys()].sort(byCode)) {
      const n = nodes.get(id);
      if (n.elev_ft !== null) continue;
      const known = /** @type {string[]} */ (nbrs.get(id)).map((x) => nodes.get(x).elev_ft).filter(isNum);
      if (!known.length) continue;
      const sum = known.reduce((a, b) => a + b, 0);
      fill.push([id, Math.floor((sum + 5 * known.length) / (10 * known.length)) * 10, known.length]);
    }
    if (!fill.length) break;
    for (const [id, v, k] of fill) {
      const n = nodes.get(id);
      n.elev_ft = v;
      n.elev_est = true;
      entries.push({ code: 'IG05', level: 'info', where: `${(nodeRegions.get(id) || ['?'])[0]}/${id}`, msg: `no elevation: ${v} ft, the mean of ${k} neighbor${k === 1 ? '' : 's'}, an estimate`, scope: scopeNodes.has(id) });
      estimates.push({ where: `${(nodeRegions.get(id) || ['?'])[0]}/${id}`, what: `elevation ${v} ft, interpolated`, evidence: 'the mean of its neighbors along segments, rounded to 10 ft (GAME_DESIGN E.4)' });
    }
  }
  for (const id of [...nodes.keys()].sort(byCode)) {
    const n = nodes.get(id);
    const rid = (nodeRegions.get(id) || ['?'])[0];
    const inScope = scopeNodes.has(id);
    if (n.elev_ft === null) {
      if (inScope && !footnotes.has(id)) entries.push({ code: 'IG05', level: 'error', where: `${rid}/${id}`, msg: 'no elevation, and no neighbor to take one from, inside the M1a scope', scope: true });
      else entries.push({ code: 'IG05', level: inScope ? 'info' : 'warn', where: `${rid}/${id}`, msg: inScope ? 'no elevation and no trail: a footnote, never routed' : 'no elevation, and no neighbor to take one from', scope: inScope });
    }
    if (n.lat === null || n.lon === null) {
      entries.push({ code: 'IG05', level: 'info', where: `${rid}/${id}`, msg: inScope ? 'no coordinates: a pencil footnote, drawn from map_xy alone' : 'no coordinates: kept null; the map draws only from map_xy', scope: inScope });
    }
  }

  // Null gain or loss: from the endpoints (IG04); a null distance stays out of routing.
  for (const [id, s] of [...segs].sort((a, b) => byCode(a[0], b[0]))) {
    const rid = (segRegions.get(id) || ['?'])[0];
    const where = `${rid}/${id}`;
    const ea = nodes.get(s.a) ? nodes.get(s.a).elev_ft : null;
    const eb = nodes.get(s.b) ? nodes.get(s.b).elev_ft : null;
    for (const k of ['gain', 'loss']) {
      if (s[k] !== null) continue;
      if (!isNum(ea) || !isNum(eb)) {
        entries.push({ code: 'IG04', level: 'warn', where, msg: `no ${k}, and an endpoint has no elevation: left out of routing`, scope: inScopeSeg(s) });
        continue;
      }
      // With the other one known, gain - loss still meets the endpoints' difference.
      const d = eb - ea;
      const other = k === 'gain' ? s.loss : s.gain;
      const known = other !== null && !s.est.includes(k === 'gain' ? 'loss' : 'gain');
      s[k] = k === 'gain' ? Math.max(0, known ? d + other : d) : Math.max(0, known ? other - d : -d);
      s.est.push(k);
      entries.push({ code: 'IG04', level: 'info', where, msg: `no ${k}: ${s[k]} ft from the endpoints (${ea} to ${eb} ft)${known ? ` and the ${k === 'gain' ? 'loss' : 'gain'} (${other} ft)` : ''}, an estimate`, scope: inScopeSeg(s) });
      estimates.push({ where, what: `${k} ${s[k]} ft, derived (in est)`, evidence: `the endpoints' elevations, ${ea} and ${eb} ft${known ? `, and the research's ${k === 'gain' ? 'loss' : 'gain'}` : ''} (GAME_DESIGN E.4)` });
    }
    if (s.mi10 === null) {
      s.est.push('mi10');
      entries.push({ code: 'IG04', level: 'warn', where, msg: 'no distance: kept, left out of routing (E.4: off-trail links stay hand-checked)', scope: inScopeSeg(s) });
    }
    s.est = [...new Set(s.est)].sort(byCode);
    if (s.est.includes('class')) estimates.push({ where, what: 'trail class beach read as beach_sand (x1.3)', evidence: 'the research writes beach without sand or cobble; GAME_DESIGN 7.4 has both; the coast milestone (M4) sets each beach' });
  }

  // Zones (content/park/vocab/zones.json), by each record's first region.
  const bands = zones.bands || { high_ft: 4000, alpine_ft: 6000 };
  for (const [id, n] of nodes) {
    const row = (zones.regions || {})[(nodeRegions.get(id) || [''])[0]];
    if (!row || n.elev_ft === null) n.zone = null;
    else n.zone = n.elev_ft >= bands.alpine_ft ? 'alpine' : n.elev_ft >= bands.high_ft ? row.high : row.low;
  }

  // Snow windows that parsed: one info per phrase and region.
  for (const r of regions) {
    const seen = new Map();
    for (const id of Object.keys(r.segments).sort(byCode)) {
      const s = r.segments[id];
      if (s.snow_free_doy === null || s.snow_text === null) continue;
      const k = s.snow_text;
      if (!seen.has(k)) seen.set(k, { id, n: 0, w: s.snow_free_doy, scope: false });
      const e = seen.get(k);
      e.n++;
      e.scope = e.scope || inScopeSeg(s);
    }
    for (const [k, e] of [...seen].sort((a, b) => byCode(a[1].id, b[1].id))) entries.push({ code: 'IG08', level: 'info', where: `${r.region}/${e.id}`, msg: `"${k}" -> ${JSON.stringify(e.w)} (${e.n} segment${e.n === 1 ? '' : 's'})`, scope: e.scope });
  }

  // The routing graph: every segment with its numbers, map-only links left out.
  const routable = {};
  for (const [id, s] of segs) {
    if (s.mi10 === null || s.gain === null || s.loss === null) continue;
    if (!nodes.has(s.a) || !nodes.has(s.b)) {
      entries.push({ code: 'IG01', level: scopeNodes.has(s.a) && scopeNodes.has(s.b) ? 'error' : 'warn', where: `${(segRegions.get(id) || ['?'])[0]}/${id}`, msg: 'names a node no region has (G01)' });
      continue;
    }
    routable[id] = { a: s.a, b: s.b, mi10: s.mi10, gain: s.gain, loss: s.loss, class: s.class, through: s.through, spur: s.spur, map_only: mapOnly.has(id) };
  }
  const parkNodes = {};
  for (const [id, n] of nodes) parkNodes[id] = { type: n.type, elev_ft: n.elev_ft, zone: n.zone, camp: n.camp, spur_only: n.spur_only };
  const graph = buildGraph({ format: 1, loops: {}, nodes: parkNodes, segs: routable, movement });

  // Presets (IG09, IG10), with the overlays' turnaround pins.
  /** @type {Map<string, Record<string, any>>} */
  const presetsByRegion = new Map();
  const counts = { kept: 0, rejected: 0 };
  for (const r of regions) {
    const out = {};
    const ov = (overlays || {})[r.region];
    const patches = (ov && ov.presets) || {};
    for (const p of Object.keys(patches)) if (!r.presets.some((t) => t.id === p)) entries.push({ code: 'IG01', level: 'error', where: `content/park/overlays/${r.region}.json:presets.${p}`, msg: 'patches a preset its region lacks (G01)' });
    for (const t of r.presets) {
      const where = `${r.region}/${t.id}`;
      const patch = patches[t.id] || null;
      const itin = Array.isArray(t.itinerary) ? t.itinerary : [];
      const named = [t.trailhead, ...itin.flatMap((d) => [d && d.to, ...((d && d.via) || [])]), ...(patch ? Object.values(patch.days || {}).flatMap((d) => d.via || []) : [])];
      const inScope = play.has(r.region) && named.every((x) => scopeNodes.has(x));
      const reject = (msg) => {
        counts.rejected++;
        entries.push({ code: 'IG10', level: inScope ? 'error' : 'warn', where, msg: `rejected as a preset: ${msg}`, scope: inScope });
      };
      if (!nodes.has(t.trailhead)) {
        reject(`its trailhead ${t.trailhead} is no node`);
        continue;
      }
      const last = itin.length ? itin[itin.length - 1].to : null;
      if (!itin.length) {
        reject('it has no days');
        continue;
      }
      const ends = t.shape === 'loop' ? last === t.trailhead : nodes.has(last) && nodes.get(last).type === 'trailhead';
      if (!ends) {
        reject(t.shape === 'loop' ? `the loop ends at ${last}, not its start` : `it ends at ${last}, not a trailhead`);
        continue;
      }
      let at = t.trailhead;
      const days = [];
      let failed = null;
      let total = 0;
      let typedTotal = 0;
      let unpinned = 0;
      itin.forEach((d, i) => {
        if (failed) return;
        const pd = patch && patch.days ? patch.days[String(d.day ?? i + 1)] : null;
        const via = pd && pd.via ? pd.via : Array.isArray(d.via) ? d.via : [];
        const typed = isNum(d.miles) ? mi10Of(d.miles) : null;
        if (!via.length && d.to === at && typed !== null && typed > 0) {
          // A side trip from camp (or the whole trip) whose turnaround is only in words.
          entries.push({ code: 'IG09', level: inScope ? 'error' : 'warn', where: `${where}/day${d.day ?? i + 1}`, msg: `goes back to ${at} with no turnaround pin: typed ${(typed / 10).toFixed(1)} mi can't be checked (the turnaround is only in the trip's words; an overlay may pin it)`, scope: inScope });
          days.push({ to: d.to, via, mi10: 0, typed_mi10: typed });
          typedTotal = typedTotal === null ? null : typedTotal + typed;
          unpinned++;
          return;
        }
        let r1;
        try {
          r1 = route(graph, [at, ...via, d.to]);
        } catch (e) {
          failed = `day ${d.day ?? i + 1} (${at} to ${d.to}${via.length ? ` by ${via.join(', ')}` : ''}) doesn't route`;
          return;
        }
        if (pd && pd.via) entries.push({ code: 'IG09', level: 'info', where, msg: `day ${d.day ?? i + 1}: the overlay pins ${pd.via.join(', ')} (${pd.doc || 'no doc'})`, scope: inScope });
        const dw = `${where}/day${d.day ?? i + 1}`;
        if (typed === null) entries.push({ code: 'IG09', level: inScope ? 'error' : 'warn', where: dw, msg: `day ${d.day ?? i + 1}'s miles are null; the graph gives ${(r1.mi10 / 10).toFixed(1)}`, scope: inScope });
        else if (Math.abs(typed - r1.mi10) > 1) entries.push({ code: 'IG09', level: inScope ? 'error' : 'warn', where: dw, msg: `typed ${(typed / 10).toFixed(1)} mi, the graph gives ${(r1.mi10 / 10).toFixed(1)}`, scope: inScope });
        else entries.push({ code: 'IG09', level: 'info', where: dw, msg: `${(r1.mi10 / 10).toFixed(1)} mi, as typed${typed !== r1.mi10 ? ` (${(typed / 10).toFixed(1)})` : ''}`, scope: inScope });
        days.push({ to: d.to, via, mi10: r1.mi10, typed_mi10: typed });
        total += r1.mi10;
        typedTotal = typed === null || typedTotal === null ? null : typedTotal + typed;
        at = d.to;
      });
      if (!failed && total === 0 && unpinned) failed = 'no day routes anywhere: its turnaround is only in words';
      if (failed) {
        reject(failed);
        continue;
      }
      counts.kept++;
      const typedSum = isNum(t.total_miles) ? mi10Of(t.total_miles) : null;
      out[t.id] = {
        trailhead: t.trailhead,
        shape: t.shape,
        nights: Array.isArray(t.nights_typical) ? t.nights_typical : null,
        difficulty: t.difficulty ?? null,
        days,
        mi10: total,
        typed_mi10: typedSum,
      };
      if (typedSum !== null && Math.abs(typedSum - total) > 1 && days.every((d) => d.typed_mi10 !== null && Math.abs(d.typed_mi10 - d.mi10) <= 1)) entries.push({ code: 'IG09', level: inScope ? 'error' : 'warn', where, msg: `total typed ${(typedSum / 10).toFixed(1)} mi, the graph gives ${(total / 10).toFixed(1)}`, scope: inScope });
    }
    presetsByRegion.set(r.region, out);
  }

  // Reference fixes in the region's own lists (merged segment ids).
  for (const r of regions) {
    for (const h of Object.values(r.hazards)) h.where = h.where.map(segId);
    for (const c of r.crossings) c.segment = segId(c.segment);
    for (const s of Object.values(r.traffic.sections || {})) s.segments = s.segments.map(segId);
    for (const st of r.statuses) st.applies_to = st.applies_to.map(segId);
  }
  for (const [from, to] of [...alias].sort((a, b) => byCode(a[0], b[0]))) entries.push({ code: 'IG03', level: 'info', where: `${(segRegions.get(to) || ['?'])[1] || '?'}/${from}`, msg: `is ${to} (one id for one trail; references renamed)`, scope: scopeNodes.has(segs.get(to).a) && scopeNodes.has(segs.get(to).b) });

  // The research's flagged estimates the regions carry.
  for (const r of regions) {
    const inputs = r.raw.m1a_play_inputs;
    if (inputs) entries.push({ code: 'IG11', level: 'info', where: `${r.region}/m1a_play_inputs`, msg: "copied into this generated region file (each node's place, the crossings, the traffic), not into the overlay its own note names, so the overlay stays hand-only (BUILD_PLAN 2.6); the quota, desk and ranger odds go to permits.json (track B); its prose stays in design/data", scope: true });
    if (inputs && inputs.estimate === true) estimates.push({ where: `${r.region}/m1a_play_inputs`, what: 'place fields (canopy, water, views, map_xy, snow features) and trail traffic, copied as each node\'s place and the region\'s traffic', evidence: (inputs.evidence || []).join(' ') || 'the research flags the block an estimate' });
    if (Object.keys(r.trailheads).length) estimates.push({ where: `${r.region}/trailheads`, what: `drive minutes from Port Angeles, Forks and Quilcene or Hoodsport at ${Object.keys(r.trailheads).length} trailheads (drive_est)`, evidence: 'routing estimates (OSRM), as the trailheads\' notes say' });
  }

  // The files: each region's nodes and segments, merged records, as written by the first region.
  const files = {};
  /** @type {Map<string, any>} */
  const normalized = new Map();
  for (const r of regions) {
    const ns = {};
    for (const id of Object.keys(r.nodes).sort(byCode)) {
      const n = structuredClone(nodes.get(id));
      n.shared_with = (nodeRegions.get(id) || []).filter((x) => x !== r.region).sort(byCode);
      if (n.place === null) delete n.place;
      ns[id] = n;
    }
    const ss = {};
    for (const id of Object.keys(r.segments).sort(byCode)) {
      const mid = segId(id);
      const s = structuredClone(segs.get(mid));
      delete s.snow_text;
      ss[mid] = s;
    }
    const out = {
      $comment: `Generated by tools/ingest.mjs from ${REGION_DIR}/${r.file.split('/').pop()}, merged with the other regions and content/park/overlays/ (BUILD_PLAN 3.2; GAME_DESIGN E.4). Never hand-edit: run npm run ingest.`,
      format: 1,
      region: r.region,
      researched_on: r.researched_on,
      nodes: ns,
      segments: ss,
      trailheads: r.trailheads,
      presets: presetsByRegion.get(r.region) || {},
      hazards: r.hazards,
      crossings: r.crossings,
      traffic: r.traffic,
      sources: r.sources,
    };
    normalized.set(r.region, out);
    files[`${OUT_DIR}/${r.region}.json`] = out;
  }

  const shared = [...nodeRegions.values()].filter((l) => l.length > 1).length;
  const sharedSegs = [...segRegions.values()].filter((l) => l.length > 1).length;
  const nRoutable = Object.keys(routable).filter((id) => !routable[id].map_only).length;
  const camps = [...nodes.values()].filter((n) => n.camp).length;
  const scopeSegs = [...segs.values()].filter(inScopeSeg);
  const report = [
    ['Regions', regions.length],
    ['Node records', regions.reduce((a, r) => a + Object.keys(r.nodes).length, 0)],
    ['Unique nodes', nodes.size],
    ['Shared node ids', shared],
    ['Segment records', regions.reduce((a, r) => a + Object.keys(r.segments).length, 0)],
    ['Unique segments', segs.size],
    ['Shared segments (merged across regions)', sharedSegs],
    ['Routable segments', nRoutable],
    ['Directed edges (each routable segment both ways)', 2 * nRoutable],
    ['Camps (nodes with a camp record)', camps],
    ['Presets kept', counts.kept],
    ['Presets rejected', counts.rejected],
    ['M1a scope: nodes', scopeNodes.size],
    ['M1a scope: segments (both ends in the scope)', scopeSegs.length],
    ['M1a scope: map-only segments', scopeSegs.filter((s) => mapOnly.has(`${s.a}->${s.b}`)).length],
  ];
  return { files, normalized, nodes, segs, alias, nodeRegions, segRegions, statuses: regions.flatMap((r) => r.statuses), entries, estimates, doubts, counts: report, graph, regions };
}
