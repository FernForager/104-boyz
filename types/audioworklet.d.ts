// The AudioWorklet's global scope (Web Audio API, AudioWorkletGlobalScope),
// for jsconfig.worklet.json only: TypeScript's libraries have no worklet
// scope, and the DOM's would be wrong there. Just what limiter.worklet.js
// uses (BUILD_PLAN S5, sound A1).

/** The context's sample rate, in Hz. */
declare const sampleRate: number;
/** The context's time, in seconds, and its frame. */
declare const currentTime: number;
declare const currentFrame: number;

declare class AudioWorkletProcessor {
  constructor(options?: { processorOptions?: unknown });
  /** The processor's end of its node's MessagePort. */
  readonly port: unknown;
}

declare function registerProcessor(
  name: string,
  processorCtor: new (options?: any) => AudioWorkletProcessor & {
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
  },
): void;
