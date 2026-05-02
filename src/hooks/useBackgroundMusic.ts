import { useEffect, useState } from "react";
import lobbyMusic from "@/assets/Mohsen Lorestani _ Bacha Nana128 (UpMusic).mp3";
import inGameMusic from "@/assets/Mohammad Alizadeh - Kheily Khosh halam.mp3";

const MUSIC_ENABLED_KEY = "splendor-music-enabled";
const MUSIC_VOLUME_KEY = "splendor-music-volume";

export type BackgroundTrack = "lobby" | "game";

const TRACKS: Record<BackgroundTrack, string> = {
  lobby: lobbyMusic,
  game: inGameMusic,
};

let globalAudio: HTMLAudioElement | null = null;
let activeTrack: BackgroundTrack = "lobby";

function ensureAudio(track: BackgroundTrack) {
  if (!globalAudio) {
    globalAudio = new Audio(TRACKS[track]);
    globalAudio.loop = true;
  }

  if (activeTrack !== track) {
    const wasPlaying = !globalAudio.paused;
    globalAudio.pause();
    globalAudio.src = TRACKS[track];
    globalAudio.load();
    activeTrack = track;
    if (wasPlaying) {
      globalAudio.play().catch(() => {});
    }
  }

  return globalAudio;
}

function isMusicEnabled() {
  return localStorage.getItem(MUSIC_ENABLED_KEY) !== "false";
}

export function setGlobalMusicTrack(track: BackgroundTrack) {
  const audio = ensureAudio(track);
  if (isMusicEnabled()) {
    audio.play().catch(() => {});
  }
}

export function useBackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(isMusicEnabled());
  const [volume, setVolume] = useState(() => {
    const raw = Number(localStorage.getItem(MUSIC_VOLUME_KEY));
    return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 0.5;
  });
  const [track, setTrack] = useState<BackgroundTrack>(activeTrack);

  useEffect(() => {
    const audio = ensureAudio(track);
    audio.volume = volume;

    if (isPlaying) {
      audio.play().catch(() => {});
    }
  }, [track, volume, isPlaying]);

  useEffect(() => {
    const audio = ensureAudio(track);
    localStorage.setItem(MUSIC_ENABLED_KEY, isPlaying ? "true" : "false");

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, track]);

  const toggleMusic = () => {
    setIsPlaying((prev) => !prev);
  };

  const setMusicVolume = (newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem(MUSIC_VOLUME_KEY, String(newVolume));
    const audio = ensureAudio(track);
    audio.volume = newVolume;
  };

  const switchTrack = (nextTrack: BackgroundTrack) => {
    setTrack(nextTrack);
  };

  return {
    isPlaying,
    toggleMusic,
    volume,
    setMusicVolume,
    track,
    setTrack: switchTrack,
  };
}
