import { Audio } from 'expo-av';

// Sound effects enumeration
export const SoundType = {
  SUCCESS: 'success',
  ERROR: 'error',
  BUTTON_CLICK: 'buttonClick',
  CORRECT_ANSWER: 'correctAnswer',
  WRONG_ANSWER: 'wrongAnswer',
  NOTIFICATION: 'notification',
  SWIPE: 'swipe',
  LEVEL_UP: 'levelUp',
  TIMER_TICK: 'timerTick',
};

// Sound files - require statements bundle them with the app
const SOUND_DATA = {
  [SoundType.BUTTON_CLICK]: require('../../assets/sounds/clickButton.mp3'),
  [SoundType.CORRECT_ANSWER]: require('../../assets/sounds/correct.mp3'),
  [SoundType.WRONG_ANSWER]: require('../../assets/sounds/incorrect.mp3'),
  [SoundType.ERROR]: require('../../assets/sounds/error.mp3'),
  [SoundType.SUCCESS]: require('../../assets/sounds/correct.mp3'), // Use correct sound for success feedback
};

class SoundManager {
  constructor() {
    this.sounds = {};
    this.soundEnabled = true;
    this.volume = 0.7;
    this.initialized = false;
    this.initPromise = null;
  }

  async initialize() {
    // Prevent multiple initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        console.log('[SoundManager] Initializing audio...');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionMode: Audio.InterruptionMode.DoNotMix,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        console.log('[SoundManager] Audio mode set');

        // Load all sounds using require statements
        for (const [soundType, soundModule] of Object.entries(SOUND_DATA)) {
          try {
            console.log(`[SoundManager] Loading ${soundType}...`);
            const { sound } = await Audio.Sound.createAsync(soundModule);
            this.sounds[soundType] = sound;
            console.log(`✓ [SoundManager] Loaded sound: ${soundType}`);
          } catch (error) {
            console.warn(`⚠ [SoundManager] Failed to load sound ${soundType}:`, error);
          }
        }

        this.initialized = true;
        console.log(`✓ [SoundManager] Initialized! Enabled: ${this.soundEnabled}, Volume: ${this.volume}`);
      } catch (error) {
        console.warn('⚠ [SoundManager] Failed to initialize audio:', error);
        this.initialized = true; // Mark as initialized even if there's an error to prevent retry loops
      }
    })();

    return this.initPromise;
  }

  async play(soundType) {
    if (!this.soundEnabled) {
      console.log(`[SoundManager] Sound disabled, skipping ${soundType}`);
      return;
    }
    
    // Wait for initialization if it's still in progress
    if (!this.initialized && this.initPromise) {
      console.log(`[SoundManager] Waiting for initialization before playing ${soundType}...`);
      await this.initPromise;
    }
    
    if (!this.initialized) {
      console.log(`[SoundManager] Not initialized, skipping ${soundType}`);
      return;
    }

    try {
      const sound = this.sounds[soundType];
      if (!sound) {
        console.warn(`[SoundManager] Sound not loaded: ${soundType}`);
        return;
      }

      console.log(`[SoundManager] Playing ${soundType} at volume ${this.volume}`);

      // Set volume
      await sound.setVolumeAsync(this.volume);

      // Stop if already playing and reset position
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
      }

      // Play the sound
      await sound.playAsync();
      console.log(`[SoundManager] ✓ Playing ${soundType}`);
    } catch (error) {
      console.warn(`⚠ [SoundManager] Error playing sound ${soundType}:`, error);
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

  async playNotification() {
    await this.play(SoundType.NOTIFICATION);
  }

  async playSwipe() {
    await this.play(SoundType.SWIPE);
  }

  async playLevelUp() {
    await this.play(SoundType.LEVEL_UP);
  }

  async playTimerTick() {
    await this.play(SoundType.TIMER_TICK);
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
    } catch (error) {
      console.warn('⚠ Error stopping all sounds:', error);
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
      console.log('✓ Sound Manager cleaned up');
    } catch (error) {
      console.warn('⚠ Error cleaning up sounds:', error);
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

export default soundManager;
