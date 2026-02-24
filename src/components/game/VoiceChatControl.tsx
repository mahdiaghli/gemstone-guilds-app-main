import { Socket } from 'socket.io-client';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceChatControlProps {
  socket: Socket | null;
  roomId: string;
  playerId: string;
  disabled?: boolean;
}

export default function VoiceChatControl({
  socket,
  roomId,
  playerId,
  disabled,
}: VoiceChatControlProps) {
  const { microphoneEnabled, toggleMicrophone, isSpeaking } = useVoiceChat(
    socket,
    roomId,
    playerId
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
      title={microphoneEnabled ? 'Disable microphone' : 'Enable microphone'}
    >
      {microphoneEnabled ? (
        <Mic className="w-4 h-4" />
      ) : (
        <MicOff className="w-4 h-4" />
      )}
    </Button>
  );
}
