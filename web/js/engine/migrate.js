// Save-format migrations between builds (BUILD_PLAN 2.3; GAME_DESIGN E.6).
//
// PURE. Each saved record (device, hiker, trip) carries its format, v. A
// table of `from v -> v + 1` functions brings an older record forward,
// one step at a time; S3's tables were empty, since v1 is the first. S7
// adds the first step: device 1 to 2 adds the lockbox's quiz, null (the
// box shut), so a phone from before S7 meets the lockbox once at its next
// return home (lead call 53); its hiker and any trip under way are
// untouched. A
// record from a newer build than this one throws EngineError('format'):
// nothing is ever silently dropped (the UI shows the error sheet, with
// Copy bug report).

import { EngineError } from './error.js';

/** The current format of each record. */
export const VERSIONS = Object.freeze({ device: 2, hiker: 1, trip: 1 });

/**
 * The steps: kind -> {from v: record -> record at v + 1}.
 * @type {Readonly<Record<string, Readonly<Record<number, (r: any) => any>>>>}
 */
export const STEPS = Object.freeze({
  // S7: the device record gains the lockbox's quiz, shut.
  device: Object.freeze({ 1: (/** @type {any} */ r) => ({ ...r, v: 2, quiz: null }) }),
  hiker: Object.freeze({}),
  trip: Object.freeze({}),
});

/**
 * A record at the current format, or null for a missing one.
 * @param {'device' | 'hiker' | 'trip'} kind
 * @param {any} record
 * @param {Record<string, Record<number, (r: any) => any>>} [steps] the table (tests pass their own)
 * @param {Record<string, number>} [versions]
 */
export function migrate(kind, record, steps = STEPS, versions = VERSIONS) {
  if (record === null || record === undefined) return null;
  if (!Object.prototype.hasOwnProperty.call(versions, kind)) throw new EngineError('state', 'migrate: no such record kind');
  if (typeof record !== 'object' || Array.isArray(record) || !Number.isSafeInteger(record.v) || record.v < 1) throw new EngineError('format', 'migrate: a record with no format');
  const want = versions[kind];
  if (record.v > want) throw new EngineError('format', 'migrate: a record from a newer build', { kind, v: record.v });
  let r = record;
  while (r.v < want) {
    const f = steps[kind] && steps[kind][r.v];
    if (!f) throw new EngineError('format', 'migrate: no step from this format', { kind, v: r.v });
    const next = f(r);
    if (!next || next.v !== r.v + 1) throw new EngineError('state', 'migrate: a step that does not move one format on');
    r = next;
  }
  return r;
}
