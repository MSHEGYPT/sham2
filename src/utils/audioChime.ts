// Web Audio API Sound Chime Generator for Toast Notifications
// Runs natively in all browsers without external mp3 dependencies

class NotificationAudioManager {
  private audioCtx: AudioContext | null = null;
  public isSoundEnabled: boolean = true;

  constructor() {
    // Sound enabled by default
    try {
      const stored = localStorage.getItem('sanad_sound_enabled');
      if (stored !== null) {
        this.isSoundEnabled = JSON.parse(stored);
      }
    } catch {
      this.isSoundEnabled = true;
    }
  }

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
    try {
      localStorage.setItem('sanad_sound_enabled', JSON.stringify(enabled));
    } catch {}
  }

  public play(type: 'new_order' | 'delivered' | 'status_change' | 'warning' | 'proximity' = 'new_order') {
    if (!this.isSoundEnabled) return;

    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      if (type === 'proximity') {
        // High-tech sonar radar proximity chime (F5 -> A5 -> C6 -> E6 pulse)
        this.playTone(698.46, now, 0.09, 'sine', 0.16);
        this.playTone(880.0, now + 0.08, 0.09, 'sine', 0.2);
        this.playTone(1046.5, now + 0.16, 0.14, 'triangle', 0.22);
        this.playTone(1318.5, now + 0.24, 0.25, 'sine', 0.18);
      } else if (type === 'new_order') {
        // High-energy upbeat dual chime for courier new delivery order (D5 -> G5 -> C6)
        this.playTone(587.33, now, 0.12, 'sine', 0.15);
        this.playTone(783.99, now + 0.12, 0.12, 'sine', 0.18);
        this.playTone(1046.5, now + 0.24, 0.25, 'triangle', 0.2);
      } else if (type === 'delivered') {
        // Warm celebratory chime for successful delivery and cash COD (C5 -> E5 -> G5)
        this.playTone(523.25, now, 0.15, 'sine', 0.15);
        this.playTone(659.25, now + 0.14, 0.15, 'sine', 0.18);
        this.playTone(783.99, now + 0.28, 0.35, 'sine', 0.2);
      } else if (type === 'warning') {
        // Soft alert double ping for return or delay
        this.playTone(440, now, 0.15, 'sawtooth', 0.1);
        this.playTone(370, now + 0.18, 0.25, 'sine', 0.12);
      } else {
        // Gentle informational waterdrop chime for status update
        this.playTone(880, now, 0.08, 'sine', 0.12);
        this.playTone(1174.66, now + 0.09, 0.2, 'sine', 0.15);
      }
    } catch {
      // Audio playback fails gracefully if user hasn't interacted yet
    }
  }

  private playTone(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainValue: number = 0.15
  ) {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }
}

export const soundManager = new NotificationAudioManager();
