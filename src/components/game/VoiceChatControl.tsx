import { Socket } from 'socket.io-client';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

interface VoiceChatControlProps {
  socket: Socket | null;
  roomId: string;
  playerId: string;
  roomPlayers: Record<string, any>;
  disabled?: boolean;
}

export default function VoiceChatControl({
  socket,
  roomId,
  playerId,
  roomPlayers,
  disabled,
}: VoiceChatControlProps) {
  const { t } = useLanguage();
  const { microphoneEnabled, toggleMicrophone, isSpeaking } = useVoiceChat(
    socket,
    roomId,
    playerId,
    roomPlayers
  );

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
    >
      {microphoneEnabled ? (
        <Mic className="w-4 h-4" />
      ) : (
        <MicOff className="w-4 h-4" />
      )}
    </Button>
  );
}
