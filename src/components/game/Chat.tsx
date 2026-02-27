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
  const [bilingualMode, setBilingualMode] = useState(true);
  const [enMessage, setEnMessage] = useState('');
  const [faMessage, setFaMessage] = useState('');
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
    if (!socket) return;

    let finalMessage = '';

    if (bilingualMode) {
      // Bilingual mode - combine both languages
      const enPart = enMessage.trim();
      const faPart = faMessage.trim();
      
      if (!enPart && !faPart) return;
      
      if (enPart && faPart) {
        finalMessage = `[\U0001F1FA\U0001F1F8 ${enPart}] [\U0001F1EE\U0001F1F7 ${faPart}]`;
      } else if (enPart) {
        finalMessage = `[\U0001F1FA\U0001F1F8 ${enPart}]`;
      } else {
        finalMessage = `[\U0001F1EE\U0001F1F7 ${faPart}]`;
      }
      
      setEnMessage('');
      setFaMessage('');
    } else {
      // Single language mode
      if (!newMessage.trim()) return;
      finalMessage = newMessage;
      setNewMessage('');
    }

    const message: ChatMessage = {
      id: `${playerId}-${Date.now()}`,
      playerId,
      playerName,
      message: finalMessage,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, message]);
    socket.emit('send-chat-message', { roomId, message });
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (lang === 'fa') {
      return date.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn('fixed z-50', lang === 'fa' ? 'left-4' : 'right-4', 'bottom-4')}>
      {!isOpen ? (
        <Button
          onClick={handleOpen}
          variant="outline"
          size="icon"
          className={cn(
            'relative rounded-full w-12 h-12',
            hasUnread && 'bg-blue-500/10 border-blue-500 text-blue-600 animate-pulse'
          )}
          title={lang === 'fa' ? 'چت بازی' : 'Game Chat'}
        >
          <MessageCircle className="w-5 h-5" />
          {hasUnread && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
          )}
        </Button>
      ) : (
        <div className={cn('w-80 rounded-lg border border-border bg-card shadow-lg flex flex-col max-h-96', lang === 'fa' && 'text-right')}>
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b border-border">
            {lang === 'fa' ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6"
                >
                  <X className="w-4 h-4" />
                </Button>
                <h3 className="font-semibold text-sm">
                  چت بازی 💬
                </h3>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-sm">
                  💬 Game Chat
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-xs py-4">
                  {lang === 'fa' ? '💭 هنوز پیامی ارسال نشده' : '💭 No messages yet'}
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className="text-xs">
                  <div className={cn('flex gap-2', lang === 'fa' ? 'flex-row-reverse' : 'flex-row')}>
                    <span className="font-semibold text-primary flex-1">{msg.playerName}</span>
                    <span className="text-muted-foreground text-[10px] whitespace-nowrap">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-muted-foreground break-words leading-relaxed">{msg.message}</p>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border space-y-2">
            {/* Language Toggle */}
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setBilingualMode(!bilingualMode)}
                className={cn(
                  'text-xs px-2 py-1 rounded transition-colors',
                  bilingualMode
                    ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                    : 'bg-muted text-muted-foreground border border-border'
                )}
              >
                {bilingualMode ? '🌐 دو زبانه | Bilingual' : '🌐 یک زبانه | Single'}
              </button>
            </div>

            {/* Input Fields */}
            {bilingualMode ? (
              // Bilingual Mode - Two inputs
              <div className="space-y-2">
                <Input
                  placeholder="English message..."
                  value={enMessage}
                  onChange={e => setEnMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  className="text-sm h-8"
                  dir="ltr"
                />
                <Input
                  placeholder="پیام فارسی..."
                  value={faMessage}
                  onChange={e => setFaMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  className="text-sm h-8"
                  dir="rtl"
                />
                <Button
                  onClick={sendMessage}
                  size="sm"
                  disabled={!enMessage.trim() && !faMessage.trim()}
                  className="w-full h-8"
                >
                  {lang === 'fa' ? '✉️ ارسال' : '✉️ Send'}
                </Button>
              </div>
            ) : (
              // Single language mode
              <div className="flex gap-2">
                <Input
                  placeholder={lang === 'fa' ? 'پیام بنویسید...' : 'Type message...'}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  className={cn('text-sm h-8', lang === 'fa' && 'text-right')}
                  dir={lang === 'fa' ? 'rtl' : 'ltr'}
                />
                <Button
                  onClick={sendMessage}
                  size="sm"
                  disabled={!newMessage.trim()}
                  className="h-8 whitespace-nowrap"
                >
                  {lang === 'fa' ? '✉️ ارسال' : '✉️ Send'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
