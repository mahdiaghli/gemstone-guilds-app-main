import { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

interface ChatProps {
  socket: Socket | null;
  roomId: string;
  playerId: string;
  playerName: string;
}

export default function Chat({ socket, roomId, playerId, playerName }: ChatProps) {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Listen for chat messages
  useEffect(() => {
    if (!socket) return;

    socket.on('chat-message', (data: ChatMessage) => {
      setMessages(prev => [...prev, data]);
      if (!isOpen) {
        setHasUnread(true);
      }
    });

    return () => {
      socket.off('chat-message');
    };
  }, [socket, isOpen]);

  // Auto-scroll to recent messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const message: ChatMessage = {
      id: `${playerId}-${Date.now()}`,
      playerId,
      playerName,
      message: newMessage,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, message]);
    socket.emit('send-chat-message', { roomId, message });
    setNewMessage('');
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={handleOpen}
          variant="outline"
          size="icon"
          className={cn(
            'relative rounded-full w-12 h-12',
            hasUnread && 'bg-blue-500/10 border-blue-500 text-blue-600 animate-pulse'
          )}
        >
          <MessageCircle className="w-5 h-5" />
          {hasUnread && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
          )}
        </Button>
      ) : (
        <div className="w-80 rounded-lg border border-border bg-card shadow-lg flex flex-col max-h-96">
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b border-border">
            <h3 className="font-semibold text-sm">
              {lang === 'fa' ? 'چت بازی' : 'Game Chat'}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="w-6 h-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className="text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-primary">{msg.playerName}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-muted-foreground break-words">{msg.message}</p>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              placeholder={lang === 'fa' ? 'پیام بنویسید...' : 'Type message...'}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              className="text-sm h-8"
            />
            <Button
              onClick={sendMessage}
              size="sm"
              disabled={!newMessage.trim()}
              className="h-8"
            >
              {lang === 'fa' ? 'ارسال' : 'Send'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
