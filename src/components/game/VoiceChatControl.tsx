import { Socket } from 'socket.io-client';
import { useVoiceChat, type VoiceRoomPlayer } from '@/hooks/useVoiceChat';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface VoiceChatControlProps {
  socket: Socket | null;
  roomId: string;
  playerId: string;
  roomPlayers: Record<string, VoiceRoomPlayer>;
  disabled?: boolean;
}

export default function VoiceChatControl({
  socket,
  roomId,
  playerId,
  roomPlayers,
  disabled,
}: VoiceChatControlProps) {
  const { t, lang } = useLanguage();
  const { microphoneEnabled, toggleMicrophone, isSpeaking, microphoneError } = useVoiceChat(
    socket,
    roomId,
    playerId,
    roomPlayers
  );

  useEffect(() => {
    if (!microphoneError) return;
    const messages: Record<string, { fa: string; en: string }> = {
      'secure-context-required': {
        fa: 'میکروفون در مرورگر فقط با HTTPS یا localhost کار می‌کند.',
        en: 'Microphone access requires HTTPS or localhost.',
      },
      'microphone-permission-denied': {
        fa: 'اجازهٔ میکروفون داده نشد. دسترسی میکروفون را در مرورگر فعال کنید.',
        en: 'Microphone permission was denied. Enable it in browser settings.',
      },
      'microphone-unavailable': {
        fa: 'این دستگاه از دسترسی میکروفون پشتیبانی نمی‌کند.',
        en: 'Microphone access is unavailable on this device.',
      },
      'microphone-start-failed': {
        fa: 'راه‌اندازی میکروفون انجام نشد. دوباره تلاش کنید.',
        en: 'The microphone could not start. Please try again.',
      },
    };
    toast.error(messages[microphoneError]?.[lang === 'fa' ? 'fa' : 'en'] || microphoneError);
  }, [lang, microphoneError]);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleMicrophone}
      disabled={disabled}
      className={cn(
        'relative transition-all',
        microphoneEnabled && 'bg-green-500/10 border-green-500 text-green-600',
        isSpeaking && 'ring-2 ring-green-500/60 shadow-lg shadow-green-500/20 animate-pulse'
      )}
      title={microphoneEnabled ? t("disableMicrophoneShort") : t("enableMicrophoneShort")}
      aria-label={microphoneEnabled ? t("disableMicrophoneShort") : t("enableMicrophoneShort")}
    >
      {microphoneEnabled ? (
        <Mic className="w-4 h-4" />
      ) : (
        <MicOff className="w-4 h-4" />
      )}
    </Button>
  );
}
