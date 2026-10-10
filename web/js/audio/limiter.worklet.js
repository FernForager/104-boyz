// The master limiter's AudioWorklet (BUILD_PLAN 13.5, S5 sound A1; GAME_DESIGN
// 13.11): dsp.js's own lookahead limiter (ceiling -1 dBFS, 5 ms lookahead,
// 80 ms release), run on the audio thread, so the phone's ceiling is the
// one Node's renders are checked against, never a DynamicsCompressorNode.
//
// It is loaded only through audioWorklet.addModule() (audio/engine.js),
// never imported by a page module: WebKit once failed a class when one
// file was loaded both ways (bug 221879). Mono in, mono out: the node is
// built with one channel, and any extra output channel gets a copy. With
// nothing connected it limits silence, so the delay line drains.

import { makeLimiter, limitBlock, LIMITER } from './dsp.js';

/** A quantum of silence for an input with nothing connected. */
const QUANTUM = 128;

class MasterLimiter extends AudioWorkletProcessor {
  /** @param {{processorOptions?: {ceilingDb?: number, lookaheadMs?: number, releaseMs?: number}}} [options] */
  constructor(options) {
    super(options);
    const o = (options && options.processorOptions) || {};
    this.state = makeLimiter({ rate: sampleRate, ceilingDb: o.ceilingDb ?? LIMITER.ceilingDb, lookaheadMs: o.lookaheadMs ?? LIMITER.lookaheadMs, releaseMs: o.releaseMs ?? LIMITER.releaseMs });
    this.silence = new Float32Array(QUANTUM);
  }

  /**
   * @param {Float32Array[][]} inputs
   * @param {Float32Array[][]} outputs
   * @returns {boolean}
   */
  process(inputs, outputs) {
    const out = outputs[0];
    if (!out || !out[0]) return true;
    const first = out[0];
    const given = inputs[0] && inputs[0][0];
    if (this.silence.length !== first.length) this.silence = new Float32Array(first.length);
    limitBlock(this.state, given && given.length === first.length ? given : this.silence, first);
    for (let c = 1; c < out.length; c++) out[c].set(first);
    return true;
  }
}

registerProcessor('master-limiter', MasterLimiter);
