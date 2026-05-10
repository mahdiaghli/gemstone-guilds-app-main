import { useState, useRef, useEffect } from "react";
import { Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

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
  placement?: "fixed" | "inline";
  align?: "left" | "right";
  className?: string;
}

export default function Chat({
  socket,
  roomId,
  playerId,
  playerName,
  placement = "fixed",
  align: alignProp,
  className,
}: ChatProps) {
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Listen for chat messages
  useEffect(() => {
    if (!socket) return;

    socket.on("chat-message", (data: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      if (!isOpen) {
        setHasUnread(true);
      }
    });

    return () => {
      socket.off("chat-message");
    };
  }, [socket, isOpen]);

  // Auto-scroll to recent messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = () => {
    if (!socket) return;

    if (!newMessage.trim()) return;
    const finalMessage = newMessage.trim();
    setNewMessage("");

    const message: ChatMessage = {
      id: `${playerId}-${Date.now()}`,
      playerId,
      playerName,
      message: finalMessage,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, message]);
    socket.emit("send-chat-message", { roomId, message });
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      handleOpen();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (lang === "fa") {
      return date.toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isInline = placement === "inline";
  const align = alignProp || (lang === "fa" ? "left" : "right");

  const panel = (
    <div
      className={cn(
        "w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-border bg-card shadow-lg flex flex-col max-h-96",
        lang === "fa" && "text-right",
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-border">
        {lang === "fa" ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="w-6 h-6"
            >
              <X className="w-4 h-4" />
            </Button>
            <h3 className="font-semibold text-sm">{t("gameChatTitle")}</h3>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-sm">{t("gameChatTitle")}</h3>
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
              {t("noMessagesYet")}
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="text-xs">
              <div
                className={cn(
                  "flex gap-2",
                  lang === "fa" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <span className="font-semibold text-primary flex-1">
                  {msg.playerName}
                </span>
                <span className="text-muted-foreground text-[11px] whitespace-nowrap">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <p className="text-muted-foreground break-words leading-relaxed">
                {msg.message}
              </p>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <Input
            placeholder={t("typeMessageShort")}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className={cn("text-sm h-8", lang === "fa" && "text-right")}
            dir={lang === "fa" ? "rtl" : "ltr"}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newMessage.trim()}
            className="h-8 whitespace-nowrap"
          >
            {t("sendShort")}
          </Button>
        </form>
      </div>
    </div>
  );

  const wrapperClass = isInline
    ? cn(
        "relative flex flex-col gap-2",
        align === "left" ? "items-start" : "items-end",
        className,
      )
    : cn("fixed z-50 top-4", lang === "fa" ? "left-4" : "right-4", className);

  return (
    <div className={wrapperClass}>
      {(isInline || !isOpen) && (
        <Button
          onClick={isInline ? handleToggle : handleOpen}
          variant="outline"
          size="icon"
          className={cn(
            "relative rounded-full w-12 h-12",
            hasUnread &&
              "bg-blue-500/10 border-blue-500 text-blue-600 animate-pulse",
          )}
          title={lang === "fa" ? "چت بازی" : "Game Chat"}
        >
          <MessageCircle className="w-5 h-5" />
          {hasUnread && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
          )}
        </Button>
      )}

      {isInline ? (
        isOpen && (
          <div
            className={cn(
              "absolute top-full mt-2 z-50 max-w-[calc(100vw-2rem)]",
              align === "left" ? "left-0" : "right-0",
            )}
          >
            {panel}
          </div>
        )
      ) : (
        isOpen && panel
      )}
    </div>
  );
}
