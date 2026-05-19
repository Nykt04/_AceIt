import { useEffect } from 'react';
import soundManager from '../services/soundService';

/**
 * Custom hook to use sound manager in components
 * Initializes sound manager on mount and provides easy access to sound functions
 */
export const useSound = () => {
  useEffect(() => {
    // Initialize sound manager on first use
    if (!soundManager.initialized) {
      soundManager.initialize().catch(error => {
        console.warn('Failed to initialize sound manager:', error);
      });
    }

    return () => {
      // Cleanup on unmount
      soundManager.stopAll().catch(error => {
        console.warn('Failed to stop all sounds:', error);
      });
    };
  }, []);

  return {
    play: (soundType) => soundManager.play(soundType),
    playButtonClick: () => soundManager.playButtonClick(),
    playSuccess: () => soundManager.playSuccess(),
    playError: () => soundManager.playError(),
    playCorrectAnswer: () => soundManager.playCorrectAnswer(),
    playWrongAnswer: () => soundManager.playWrongAnswer(),
    setSoundEnabled: (enabled) => soundManager.setSoundEnabled(enabled),
    setVolume: (volume) => soundManager.setVolume(volume),
  };
};

export default useSound;
