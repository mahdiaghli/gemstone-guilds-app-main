import { useState, useCallback } from 'react';
import { audioManager } from '@/lib/audioManager';

export function useAudio() {
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(audioManager.backgroundMusicEnabled);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(audioManager.soundEffectsEnabled);

  const toggleBackgroundMusic = useCallback(() => {
    const newState = !backgroundMusicEnabled;
    setBackgroundMusicEnabled(newState);
    audioManager.setBackgroundMusicEnabled(newState);
  }, [backgroundMusicEnabled]);

  const toggleSoundEffects = useCallback(() => {
    const newState = !soundEffectsEnabled;
    setSoundEffectsEnabled(newState);
    audioManager.setSoundEffectsEnabled(newState);
    if (newState) {
      audioManager.playSound('notification');
    }
  }, [soundEffectsEnabled]);

  return {
    backgroundMusicEnabled,
    soundEffectsEnabled,
    toggleBackgroundMusic,
    toggleSoundEffects,
  };
}
