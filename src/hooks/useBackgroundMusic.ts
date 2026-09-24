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
let audioUnlocked = false;

function storedVolume() {
  const value = Number(localStorage.getItem(MUSIC_VOLUME_KEY));
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.5;
}

function isMusicEnabled() {
  return localStorage.getItem(MUSIC_ENABLED_KEY) !== "false";
}

function ensureAudio(track: BackgroundTrack) {
  if (!globalAudio) {
    globalAudio = new Audio(TRACKS[track]);
    globalAudio.loop = true;
    globalAudio.preload = "auto";
    globalAudio.playsInline = true;
    globalAudio.autoplay = true;
    globalAudio.volume = storedVolume();
    activeTrack = track;
  }

  if (activeTrack !== track) {
    globalAudio.pause();
    globalAudio.src = TRACKS[track];
    globalAudio.load();
    activeTrack = track;
  }

  return globalAudio;
}

async function playCurrentTrack(track: BackgroundTrack) {
  if (!isMusicEnabled()) return false;
  const audio = ensureAudio(track);
  audio.muted = false;
  audio.volume = storedVolume();
  try {
    await audio.play();
    audioUnlocked = true;
    return true;
  } catch {
    return false;
  }
}

export function setGlobalMusicTrack(track: BackgroundTrack) {
  ensureAudio(track);
  if (audioUnlocked && isMusicEnabled()) {
    void playCurrentTrack(track);
  }
}

export function useBackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(isMusicEnabled());
  const [volume, setVolume] = useState(storedVolume);
  const [track, setTrack] = useState<BackgroundTrack>(activeTrack);

  useEffect(() => {
    const audio = ensureAudio(track);
    audio.volume = volume;
    localStorage.setItem(MUSIC_ENABLED_KEY, isPlaying ? "true" : "false");

    if (isPlaying) {
      void playCurrentTrack(track);
    } else {
      audio.pause();
    }
  }, [track, volume, isPlaying]);

  useEffect(() => {
    const unlockAndPlay = () => {
      if (isPlaying) void playCurrentTrack(activeTrack);
    };
    const resumeOnVisible = () => {
      if (document.visibilityState === "visible" && isPlaying) {
        void playCurrentTrack(activeTrack);
      }
    };

    // Mobile browsers only permit audio playback directly inside a user gesture.
    window.addEventListener("pointerdown", unlockAndPlay, { capture: true, passive: true });
    window.addEventListener("touchstart", unlockAndPlay, { capture: true, passive: true });
    window.addEventListener("keydown", unlockAndPlay, true);
    document.addEventListener("click", unlockAndPlay, true);
    document.addEventListener("visibilitychange", resumeOnVisible);

    return () => {
      window.removeEventListener("pointerdown", unlockAndPlay, true);
      window.removeEventListener("touchstart", unlockAndPlay, true);
      window.removeEventListener("keydown", unlockAndPlay, true);
      document.removeEventListener("click", unlockAndPlay, true);
      document.removeEventListener("visibilitychange", resumeOnVisible);
    };
  }, [isPlaying]);

  const toggleMusic = () => {
    setIsPlaying((previous) => {
      const next = !previous;
      if (next) {
        localStorage.setItem(MUSIC_ENABLED_KEY, "true");
        void playCurrentTrack(activeTrack);
      }
      return next;
    });
  };

  const setMusicVolume = (newVolume: number) => {
    const safeVolume = Math.min(1, Math.max(0, newVolume));
    setVolume(safeVolume);
    localStorage.setItem(MUSIC_VOLUME_KEY, String(safeVolume));
    ensureAudio(track).volume = safeVolume;
  };

  return {
    isPlaying,
    toggleMusic,
    volume,
    setMusicVolume,
    track,
    setTrack,
  };
}