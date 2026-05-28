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
  const palette = [
    "border-sky-400/25 bg-sky-500/15 text-sky-100",
    "border-emerald-400/25 bg-emerald-500/15 text-emerald-100",
    "border-amber-400/25 bg-amber-500/15 text-amber-100",
    "border-fuchsia-400/25 bg-fuchsia-500/15 text-fuchsia-100",
  ];

  const getPlayerColorClass = (id: string) => {
    let hash = 0;
    for (let index = 0; index < id.length; index += 1) {
      hash = (hash + id.charCodeAt(index) * (index + 1)) % palette.length;
    }
    return palette[hash];
  };

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
        "w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card shadow-lg flex flex-col max-h-[28rem] overflow-hidden",
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
      <ScrollArea className="h-72 flex-1 p-3">
        <div className="flex min-h-full flex-col gap-3">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-xs py-4">
              {t("noMessagesYet")}
            </div>
          )}
          {messages.map((msg) => {
            const mine = msg.playerId === playerId;
            return (
              <div
                key={msg.id}
                className={cn("flex text-xs", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl border px-3 py-2 shadow-sm",
                    getPlayerColorClass(msg.playerId),
                    mine ? "rounded-br-sm" : "rounded-bl-sm",
                  )}
                >
                  <div className={cn("mb-1 flex items-center gap-2", lang === "fa" ? "flex-row-reverse" : "")}>
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {msg.playerName}
                    </span>
                    <span className="shrink-0 text-[10px] text-white/55">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "whitespace-pre-wrap break-words leading-relaxed text-slate-100 [overflow-wrap:anywhere]",
                      lang === "fa" ? "text-right" : "text-left",
                    )}
                    dir={lang === "fa" ? "rtl" : "ltr"}
                  >
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })}
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
