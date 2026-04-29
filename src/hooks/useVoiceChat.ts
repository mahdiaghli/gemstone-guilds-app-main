import { useState, useRef, useEffect, useCallback } from "react";
import { Socket } from "socket.io-client";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useVoiceChat(
  socket: Socket | null,
  roomId: string,
  playerId: string,
  roomPlayers: Record<string, any>,
) {
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const cleanupPeer = useCallback((peerSocketId: string) => {
    const pc = peerConnectionsRef.current.get(peerSocketId);
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
      peerConnectionsRef.current.delete(peerSocketId);
    }
    const audio = remoteAudioRef.current.get(peerSocketId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      remoteAudioRef.current.delete(peerSocketId);
    }
    pendingIceRef.current.delete(peerSocketId);
  }, []);

  const cleanupAllPeers = useCallback(() => {
    Array.from(peerConnectionsRef.current.keys()).forEach((peerId) =>
      cleanupPeer(peerId),
    );
  }, [cleanupPeer]);

  const stopSpeakingDetection = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const startSpeakingDetection = useCallback(
    (stream: MediaStream) => {
      stopSpeakingDetection();
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContext.resume().catch(() => undefined);
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      source.connect(analyser);

      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const value = (data[i] - 128) / 128;
          sum += value * value;
        }
        const rms = Math.sqrt(sum / data.length);
        setIsSpeaking(rms > 0.05);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    },
    [stopSpeakingDetection],
  );

  const createPeerConnection = useCallback(
    (peerSocketId: string) => {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionsRef.current.set(peerSocketId, pc);

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => pc.addTrack(track, mediaStreamRef.current!));
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("voice-ice", {
            roomId,
            to: peerSocketId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (!stream) return;
        let audio = remoteAudioRef.current.get(peerSocketId);
        if (!audio) {
          audio = new Audio();
          audio.autoplay = true;
          audio.playsInline = true;
          remoteAudioRef.current.set(peerSocketId, audio);
        }
        audio.srcObject = stream;
        audio.play().catch(() => {
          // Autoplay can fail without user gesture; ignore.
        });
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected" ||
          pc.connectionState === "closed"
        ) {
          cleanupPeer(peerSocketId);
        }
      };

      return pc;
    },
    [cleanupPeer, roomId, socket],
  );

  const ensureOffer = useCallback(
    async (peerSocketId: string) => {
      if (!socket || !mediaStreamRef.current) return;
      const existing = peerConnectionsRef.current.get(peerSocketId);
      const pc = existing || createPeerConnection(peerSocketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("voice-offer", {
        roomId,
        to: peerSocketId,
        offer,
      });
    },
    [socket, roomId, createPeerConnection],
  );

  const enableMicrophone = useCallback(async () => {
    try {
      if (!socket) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        setMicrophoneEnabled(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      startSpeakingDetection(stream);
      setMicrophoneEnabled(true);

      socket.emit("microphone-toggled", {
        roomId,
        playerId,
        enabled: true,
      });

      if (socket?.id) {
        const peers = Object.values(roomPlayers || {})
          .map((p: any) => p.socketId)
          .filter((id: string) => id && id !== socket.id);

        peers.forEach((peerId: string) => {
          if (socket.id < peerId) {
            ensureOffer(peerId);
          }
        });
      }
    } catch (err) {
      console.error("Failed to access microphone:", err);
      setMicrophoneEnabled(false);
    }
  }, [socket, roomId, playerId, roomPlayers, startSpeakingDetection, ensureOffer]);

  const disableMicrophone = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    stopSpeakingDetection();
    cleanupAllPeers();

    setMicrophoneEnabled(false);
    setIsSpeaking(false);

    if (socket) {
      socket.emit("microphone-toggled", {
        roomId,
        playerId,
        enabled: false,
      });
      socket.emit("voice-end", { roomId });
    }
  }, [socket, roomId, playerId, cleanupAllPeers, stopSpeakingDetection]);

  const toggleMicrophone = useCallback(async () => {
    if (microphoneEnabled) {
      disableMicrophone();
    } else {
      await enableMicrophone();
    }
  }, [microphoneEnabled, enableMicrophone, disableMicrophone]);

  useEffect(() => {
    if (!socket) return;

    const onOffer = async (data: any) => {
      if (!microphoneEnabled || !mediaStreamRef.current) return;
      const from = data?.from;
      const offer = data?.offer;
      if (!from || !offer) return;

      const pc = peerConnectionsRef.current.get(from) || createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("voice-answer", {
        roomId,
        to: from,
        answer,
      });

      const pending = pendingIceRef.current.get(from);
      if (pending && pending.length) {
        pending.forEach((candidate) => {
          pc.addIceCandidate(candidate).catch(() => undefined);
        });
        pendingIceRef.current.delete(from);
      }
    };

    const onAnswer = async (data: any) => {
      const from = data?.from;
      const answer = data?.answer;
      if (!from || !answer) return;
      const pc = peerConnectionsRef.current.get(from);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => undefined);
    };

    const onIce = (data: any) => {
      const from = data?.from;
      const candidate = data?.candidate;
      if (!from || !candidate) return;
      const pc = peerConnectionsRef.current.get(from);
      if (pc && pc.remoteDescription) {
        pc.addIceCandidate(candidate).catch(() => undefined);
        return;
      }
      const list = pendingIceRef.current.get(from) || [];
      list.push(candidate);
      pendingIceRef.current.set(from, list);
    };

    const onEnd = (data: any) => {
      const from = data?.from;
      if (from) {
        cleanupPeer(from);
      }
    };

    const onDisconnect = () => {
      cleanupAllPeers();
      setIsSpeaking(false);
    };

    socket.on("voice-offer", onOffer);
    socket.on("voice-answer", onAnswer);
    socket.on("voice-ice", onIce);
    socket.on("voice-end", onEnd);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("voice-offer", onOffer);
      socket.off("voice-answer", onAnswer);
      socket.off("voice-ice", onIce);
      socket.off("voice-end", onEnd);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket, roomId, microphoneEnabled, createPeerConnection, cleanupPeer, cleanupAllPeers]);

  useEffect(() => {
    if (!microphoneEnabled || !socket?.id) return;
    const peers = Object.values(roomPlayers || {})
      .map((p: any) => p.socketId)
      .filter((id: string) => id && id !== socket.id);

    peers.forEach((peerId: string) => {
      if (!peerConnectionsRef.current.has(peerId) && socket.id < peerId) {
        ensureOffer(peerId);
      }
    });

    // Cleanup peers that left
    const active = new Set(peers);
    peerConnectionsRef.current.forEach((_pc, peerId) => {
      if (!active.has(peerId)) {
        cleanupPeer(peerId);
      }
    });
  }, [roomPlayers, microphoneEnabled, socket, ensureOffer, cleanupPeer]);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      cleanupAllPeers();
      stopSpeakingDetection();
    };
  }, [cleanupAllPeers, stopSpeakingDetection]);

  return {
    microphoneEnabled,
    toggleMicrophone,
    isSpeaking,
  };
}
