import { useState, useRef, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export function useVoiceChat(socket: Socket | null, roomId: string, playerId: string) {
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Initialize microphone access
  const enableMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      // Setup audio context for monitoring
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;

      source.connect(analyser);

      // Listen for speech
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      analyser.connect(processor);
      processor.connect(audioContext.destination);

      processor.addEventListener('audioprocess', (event) => {
        const data = event.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data[i] * data[i];
        }
        const rms = Math.sqrt(sum / data.length);
        setIsSpeaking(rms > 0.05); // Threshold for speaking detection
      });

      setMicrophoneEnabled(true);

      // Broadcast microphone enabled to other players
      if (socket) {
        socket.emit('microphone-toggled', {
          roomId,
          playerId,
          enabled: true,
        });
      }
    } catch (err) {
      console.error('Failed to access microphone:', err);
      setMicrophoneEnabled(false);
    }
  }, [socket, roomId, playerId]);

  // Disable microphone
  const disableMicrophone = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setMicrophoneEnabled(false);
    setIsSpeaking(false);

    if (socket) {
      socket.emit('microphone-toggled', {
        roomId,
        playerId,
        enabled: false,
      });
    }
  }, [socket, roomId, playerId]);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (microphoneEnabled) {
      disableMicrophone();
    } else {
      await enableMicrophone();
    }
  }, [microphoneEnabled, enableMicrophone, disableMicrophone]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (microphoneEnabled) {
        disableMicrophone();
      }
    };
  }, []);

  return {
    microphoneEnabled,
    toggleMicrophone,
    isSpeaking,
  };
}
