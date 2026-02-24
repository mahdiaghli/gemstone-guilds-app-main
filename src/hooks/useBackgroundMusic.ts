import { useState, useRef, useEffect } from 'react';

export function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;
      audio.volume = volume;
      // Try to use a public music file or fallback
      audio.src = '/background-music.mp3'; // Will need to add this file
      audioRef.current = audio;
    }
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.warn('Failed to play music:', err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const setMusicVolume = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return {
    isPlaying,
    toggleMusic,
    volume,
    setMusicVolume,
  };
}
