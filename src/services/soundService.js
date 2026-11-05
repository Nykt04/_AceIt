import { Audio } from 'expo-av';

// Detect if running in web environment
const IS_WEB = typeof window !== 'undefined' && !window.expo;

// Sound effects enumeration
export const SoundType = {
  SUCCESS: 'success',
  ERROR: 'error',
  BUTTON_CLICK: 'buttonClick',
  CORRECT_ANSWER: 'correctAnswer',
  WRONG_ANSWER: 'wrongAnswer',
};

// Sound files for React Native platforms
let SOUND_DATA = {};
if (!IS_WEB) {
  SOUND_DATA = {
    [SoundType.BUTTON_CLICK]: require('../../assets/sounds/clickButton.mp3'),
    [SoundType.CORRECT_ANSWER]: require('../../assets/sounds/correct.mp3'),
    [SoundType.WRONG_ANSWER]: require('../../assets/sounds/incorrect.mp3'),
    [SoundType.ERROR]: require('../../assets/sounds/error.mp3'),
    [SoundType.SUCCESS]: require('../../assets/sounds/correct.mp3'),
  };
}

class SoundManager {
  constructor() {
    this.sounds = {};
    this.soundEnabled = true;
    this.volume = 0.7;
    this.initialized = false;
    this.initPromise = null;
    this.audioContext = null;

    // Immediately kick off initialization in background
    this.initialize().catch(() => {});
  }

  getWebAudioContext() {
    if (!IS_WEB) return null;
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  playWebTone(type) {
    const ctx = this.getWebAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      gain.gain.value = Math.min(0.2, this.volume * 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === SoundType.BUTTON_CLICK) {
        // Subtle tactile pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === SoundType.CORRECT_ANSWER || type === SoundType.SUCCESS) {
        // High upbeat dual chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === SoundType.WRONG_ANSWER || type === SoundType.ERROR) {
        // Low soft thud
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      }
    } catch {
      // AudioContext autoplay restrictions are handled silently
    }
  }

  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        if (IS_WEB) {
          // On web, use Web Audio API synthesis
          this.initialized = true;
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionMode: Audio.InterruptionMode.DoNotMix,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        for (const [soundType, soundModule] of Object.entries(SOUND_DATA)) {
          try {
            const { sound } = await Audio.Sound.createAsync(soundModule);
            this.sounds[soundType] = sound;
          } catch {
            /* skip individual sound failure */
          }
        }

        this.initialized = true;
      } catch {
        this.initialized = true;
      }
    })();

    return this.initPromise;
  }

  async play(soundType) {
    if (!this.soundEnabled) return;

    if (!this.initialized) {
      if (this.initPromise) {
        await this.initPromise;
      } else {
        await this.initialize();
      }
    }

    if (IS_WEB) {
      this.playWebTone(soundType);
      return;
    }

    try {
      const sound = this.sounds[soundType];
      if (!sound) return;

      await sound.setVolumeAsync(this.volume);

      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
      }

      await sound.playAsync();
    } catch {
      /* ignore native play glitch */
    }
  }

  async playButtonClick() {
    await this.play(SoundType.BUTTON_CLICK);
  }

  async playSuccess() {
    await this.play(SoundType.SUCCESS);
  }

  async playError() {
    await this.play(SoundType.ERROR);
  }

  async playCorrectAnswer() {
    await this.play(SoundType.CORRECT_ANSWER);
  }

  async playWrongAnswer() {
    await this.play(SoundType.WRONG_ANSWER);
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  async stopAll() {
    try {
      for (const sound of Object.values(this.sounds)) {
        if (sound) {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await sound.stopAsync();
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  async cleanup() {
    try {
      for (const sound of Object.values(this.sounds)) {
        if (sound) {
          await sound.unloadAsync();
        }
      }
      this.sounds = {};
      this.initialized = false;
    } catch {
      /* ignore */
    }
  }
}

export const soundManager = new SoundManager();
export default soundManager;
