import { useEffect, useState } from "react";
import lobbyMusic from "@/assets/Mohsen Lorestani _ Bacha Nana128 (UpMusic).mp3";
import inGameMusic from "@/assets/Mohammad Alizadeh - Kheily Khosh halam.mp3";
import { isNativeApp } from "@/lib/nativeApp";

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

function ensureAudio(track: BackgroundTrack) {
  if (!globalAudio) {
    globalAudio = new Audio(TRACKS[track]);
    globalAudio.loop = true;
    globalAudio.preload = "auto";
    globalAudio.playsInline = true;
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

async function tryUnlockAudio(track: BackgroundTrack) {
  const audio = ensureAudio(track);

  if (audioUnlocked) {
    return audio;
  }

  try {
    audio.muted = true;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    audioUnlocked = true;
  } catch {
    audio.muted = false;
  }

  return audio;
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
    let active = true;

    const syncPlayback = async () => {
      const audio = ensureAudio(track);
      audio.volume = volume;

      if (!isPlaying) return;

      if (isNativeApp()) {
        await tryUnlockAudio(track);
      }

      if (active) {
        audio.play().catch(() => {});
      }
    };

    syncPlayback();

    return () => {
      active = false;
    };
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

  useEffect(() => {
    const unlock = () => {
      if (!isPlaying) return;
      tryUnlockAudio(track).then((audio) => {
        audio.play().catch(() => {});
      });
    };

    const resumeOnVisible = () => {
      if (document.visibilityState === "visible" && isPlaying) {
        ensureAudio(track).play().catch(() => {});
      }
    };

    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("touchend", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    document.addEventListener("visibilitychange", resumeOnVisible);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchend", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", resumeOnVisible);
    };
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
