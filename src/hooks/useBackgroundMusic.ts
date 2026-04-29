import { useState, useEffect } from 'react';
import bgMusic from '@/assets/Mohsen Lorestani _ Bacha Nana128 (UpMusic).mp3';

let globalAudio: HTMLAudioElement | null = null;
const MUSIC_ENABLED_KEY = 'splendor-music-enabled';
const MUSIC_VOLUME_KEY = 'splendor-music-volume';

export function useBackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(() => localStorage.getItem(MUSIC_ENABLED_KEY) !== 'false');
  const [volume, setVolume] = useState(() => {
    const raw = Number(localStorage.getItem(MUSIC_VOLUME_KEY));
    return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 0.5;
  });

  useEffect(() => {
    if (!globalAudio) {
      globalAudio = new Audio(bgMusic);
      globalAudio.loop = true;
    }
    globalAudio.volume = volume;

    if (isPlaying) {
      globalAudio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }, [volume, isPlaying]);

  useEffect(() => {
    if (!globalAudio) {
      globalAudio = new Audio(bgMusic);
      globalAudio.loop = true;
      globalAudio.volume = volume;
    }

    localStorage.setItem(MUSIC_ENABLED_KEY, isPlaying ? 'true' : 'false');

    if (isPlaying) {
      globalAudio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      globalAudio.pause();
    }
  }, [isPlaying]);

  const toggleMusic = () => {
    if (!globalAudio) return;
    setIsPlaying((prev) => !prev);
  };

  const setMusicVolume = (newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem(MUSIC_VOLUME_KEY, String(newVolume));
    if (globalAudio) {
      globalAudio.volume = newVolume;
    }
  };

  return {
    isPlaying,
    toggleMusic,
    volume,
    setMusicVolume,
  };
}
