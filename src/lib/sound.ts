type SoundKind = 'move' | 'capture' | 'check' | 'end' | 'notify'

let ctx: AudioContext | null = null

const TONES: Record<SoundKind, { freq: number[]; duration: number; type: OscillatorType; gain: number }> = {
  move: { freq: [520], duration: 0.07, type: 'triangle', gain: 0.12 },
  capture: { freq: [330, 260], duration: 0.09, type: 'square', gain: 0.07 },
  check: { freq: [740, 880], duration: 0.09, type: 'sine', gain: 0.12 },
  end: { freq: [523, 659, 784], duration: 0.14, type: 'sine', gain: 0.12 },
  notify: { freq: [880, 1175], duration: 0.08, type: 'sine', gain: 0.08 },
}

/** Short synthesized UI sounds via Web Audio; silently does nothing when audio is unavailable. */
export function playSound(kind: SoundKind) {
  try {
    ctx ??= new AudioContext()
    const tone = TONES[kind]
    let t = ctx.currentTime
    for (const f of tone.freq) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = tone.type
      osc.frequency.value = f
      gain.gain.setValueAtTime(tone.gain, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + tone.duration)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + tone.duration)
      t += tone.duration * 0.9
    }
  } catch {
    // Audio is optional.
  }
}
