import { useEffect, useMemo, useState } from "react";
import { Copy, Gamepad2, MessageSquare, Search, UserPlus, X } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import AppPageShell from "@/components/game/AppPageShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { generateClientId } from "@/lib/clientId";
import { GAME_CATALOG, getGameById } from "@/lib/gameCatalog";
import { shellBackgrounds } from "@/lib/pageBackgrounds";
import {
  getChatParticipants,
  getConversation,
  getFriendRequests,
  getFriends,
  getGroupRequestsForCreator,
  getGroupsRemote,
  getPendingGameInvites,
  getUserAvatar,
  getUserCode,
  getUserDisplayName,
  respondToFriendRequest,
  respondToGameInvite,
  respondToGroupRequestRemote,
  searchUsersRemote,
  sendChatMessage,
  sendFriendRequest,
  sendGameInvite,
  syncSocialStateRemote,
} from "@/lib/social";

export default function Friends() {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; username: string }>>([]);
  const [requestSentOpen, setRequestSentOpen] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState<{ title: string; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState("chats");
  const [inviteDialogFriendId, setInviteDialogFriendId] = useState<string | null>(null);
  const [inviteGameId, setInviteGameId] = useState("splendor");
  const [invitePlayerCount, setInvitePlayerCount] = useState(2);
  const [inviteHumanPlayers, setInviteHumanPlayers] = useState(2);
  const [inviteTurnTime, setInviteTurnTime] = useState<15 | 30 | 45 | 60>(45);

  const requests = useMemo(() => (user ? getFriendRequests(user.id) : []), [user, refreshKey]);
  const groupRequests = useMemo(() => (user ? getGroupRequestsForCreator(user.id) : []), [user, refreshKey]);
  const gameInvites = useMemo(() => (user ? getPendingGameInvites(user.id) : []), [user, refreshKey]);
  const friends = useMemo(() => (user ? getFriends(user.id) : []), [user, refreshKey]);
  const chats = useMemo(() => (user ? getChatParticipants(user.id) : []), [user, refreshKey]);
  const conversation = useMemo(() => {
    if (!user || !selectedChatUserId) return [];
    return getConversation(user.id, selectedChatUserId);
  }, [selectedChatUserId, user, refreshKey]);

  const refresh = () => setRefreshKey((value) => value + 1);
  const myUserCode = getUserCode(user?.id);
  const inviteFriendName = getUserDisplayName(inviteDialogFriendId || undefined);

  useEffect(() => {
    let cancelled = false;
    searchUsersRemote(query, user?.id).then((results) => {
      if (!cancelled) setSearchResults(results);
    });
    return () => {
      cancelled = true;
    };
  }, [query, user?.id, refreshKey]);

  useEffect(() => {
    Promise.all([getGroupsRemote(), syncSocialStateRemote()]).then(() => refresh());
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      Promise.all([getGroupsRemote(), syncSocialStateRemote()]).then(refresh);
    }, 500);
    const sync = () => refresh();
    window.addEventListener("splendor-social-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("splendor-social-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <AppPageShell currentPath="/friends" backgroundImage={shellBackgrounds.friends}>
      <div className="mb-4 rounded-[32px] border border-primary/20 bg-[radial-gradient(circle_at_top_right,rgba(81,168,255,0.18),transparent_35%),linear-gradient(145deg,rgba(14,21,39,0.95),rgba(23,39,49,0.88))] p-5 shadow-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className={dir === "rtl" ? "text-right" : ""}>
            <p className="text-sm text-muted-foreground">{t("yourUserCode")}</p>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(myUserCode);
              }}
              className="inline-flex items-center gap-2 text-lg font-semibold text-primary"
            >
              {myUserCode}
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${dir === "rtl" ? "right-3" : "left-3"}`} />
              <Input
                dir={dir}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchUsersPlaceholder")}
                className={dir === "rtl" ? "pr-9 text-right" : "pl-9"}
              />
            </div>
          </div>
        </div>

        {query.trim() && (
          <div className="mt-4 space-y-2">
            {searchResults.length === 0 && <p className="text-sm text-muted-foreground">{t("noPlayersFound")}</p>}
            {searchResults.map((result) => (
              <motion.div key={result.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-2xl border border-primary/20 bg-background/40 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 border border-primary/20">
                    <AvatarImage src={getUserAvatar(result.id)} alt={result.username} />
                    <AvatarFallback>{result.username.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{result.username}</p>
                    <p className="text-xs text-muted-foreground">{getUserCode(result.id)}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!user) return;
                    const status = sendFriendRequest(user.id, result.id);
                    if (status === "sent") {
                      setRequestSentOpen(true);
                    } else {
                      setRequestFeedback({
                        title: t(status === "already-friends" ? "alreadyFriendsTitle" : "requestAlreadySentTitle"),
                        message: t(status === "already-friends" ? "alreadyFriendsMessage" : "requestAlreadySentMessage"),
                      });
                    }
                    refresh();
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  {t("sendRequest")}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chats">{t("chatsTab")}</TabsTrigger>
          <TabsTrigger value="friends">{t("friendsTab")}</TabsTrigger>
          <TabsTrigger value="requests">{t("requestsTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="chats">
          {!selectedChatUserId ? (
            <div className="space-y-2 rounded-3xl border border-primary/20 bg-card/70 p-4">
              {chats.length === 0 && <p className="text-sm text-muted-foreground">{t("noChatsYet")}</p>}
              {chats.map((chatUserId) => (
                <button
                  key={chatUserId}
                  onClick={() => setSelectedChatUserId(chatUserId)}
                  className="flex w-full items-center justify-between rounded-2xl border border-primary/15 bg-background/30 px-4 py-3 text-left transition hover:bg-background/60"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border border-primary/20">
                      <AvatarImage src={getUserAvatar(chatUserId)} alt={getUserDisplayName(chatUserId)} />
                      <AvatarFallback>{getUserDisplayName(chatUserId).slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getUserDisplayName(chatUserId)}</p>
                      <p className="text-xs text-muted-foreground">{getUserCode(chatUserId)}</p>
                    </div>
                  </div>
                  <MessageSquare className="h-4 w-4 text-primary" />
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-primary/20 bg-card/70 p-4">
              <div className="flex min-h-[340px] flex-col">
                <div className="mb-4 border-b border-primary/10 pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-primary/20">
                        <AvatarImage src={getUserAvatar(selectedChatUserId)} alt={getUserDisplayName(selectedChatUserId)} />
                        <AvatarFallback>{getUserDisplayName(selectedChatUserId).slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{getUserDisplayName(selectedChatUserId)}</p>
                        <p className="text-xs text-muted-foreground">{getUserCode(selectedChatUserId)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedChatUserId(null);
                        setMessageText("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {conversation.map((message) => {
                    const mine = message.senderId === user?.id;
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`flex max-w-[92%] items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                          <Avatar className="h-9 w-9 border border-primary/20">
                            <AvatarImage src={getUserAvatar(message.senderId)} alt={getUserDisplayName(message.senderId)} />
                            <AvatarFallback>{getUserDisplayName(message.senderId).slice(0, 1)}</AvatarFallback>
                          </Avatar>
                          <div className={`rounded-2xl px-4 py-3 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-background/50"}`}>
                            <div className={`mb-1 text-xs font-semibold ${mine ? "text-primary-foreground/80" : "text-primary"}`}>
                              {getUserDisplayName(message.senderId)}
                            </div>
                            {message.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form
                  className="mt-4 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!user || !selectedChatUserId || !messageText.trim()) return;
                    sendChatMessage(user.id, selectedChatUserId, messageText.trim());
                    setMessageText("");
                    refresh();
                  }}
                >
                  <Input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder={t("typeMessage")} />
                  <Button type="submit">{t("sendMessage")}</Button>
                </form>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="friends">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {friends.length === 0 && <p className="text-sm text-muted-foreground">{t("noFriendsYet")}</p>}
            {friends.map((friendId) => (
              <div key={friendId} className="rounded-3xl border border-primary/20 bg-card/70 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-primary/20">
                    <AvatarImage src={getUserAvatar(friendId)} alt={getUserDisplayName(friendId)} />
                    <AvatarFallback>{getUserDisplayName(friendId).slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{getUserDisplayName(friendId)}</h3>
                    <p className="text-xs text-muted-foreground">{getUserCode(friendId)}</p>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Button variant="outline" onClick={() => {
                    setSelectedChatUserId(friendId);
                    setActiveTab("chats");
                  }}>
                    {t("openChat")}
                  </Button>
                  <Button
                    onClick={() => {
                      setInviteDialogFriendId(friendId);
                      setInviteGameId("splendor");
                      setInvitePlayerCount(2);
                      setInviteHumanPlayers(2);
                      setInviteTurnTime(45);
                    }}
                  >
                    <Gamepad2 className="h-4 w-4" />
                    {t("sendGameInvite")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <div className="space-y-3">
            {requests.length === 0 && groupRequests.length === 0 && gameInvites.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("noRequestsYet")}</p>
            )}

            {gameInvites.map((invite) => (
              <div key={invite.id} className="flex flex-col gap-3 rounded-3xl border border-primary/20 bg-card/70 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{getUserDisplayName(invite.fromUserId)}</p>
                  <p className="text-xs text-muted-foreground">{t("incomingGameInvite")}</p>
                  <p className="text-xs text-muted-foreground">
                    {getGameById(invite.gameId).name} | {invite.playerCount} players | {invite.humanPlayers} human | {invite.turnTime}s
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      respondToGameInvite(invite.id, false);
                      refresh();
                    }}
                  >
                    {t("decline")}
                  </Button>
                  <Button
                    onClick={() => {
                      const acceptedInvite = respondToGameInvite(invite.id, true);
                      refresh();
                      if (!acceptedInvite || !user?.username) return;
                      const playerId = generateClientId();
                      localStorage.setItem(
                        "splendor-online-room",
                        JSON.stringify({
                          roomId: acceptedInvite.roomId,
                          playerId,
                          playerName: user.username,
                          isHost: false,
                          playerCount: acceptedInvite.playerCount,
                          turnTime: acceptedInvite.turnTime,
                          gameId: acceptedInvite.gameId,
                          humans: acceptedInvite.humanPlayers,
                          invitedBy: acceptedInvite.fromUserId,
                        }),
                      );
                      navigate(`/online-game/${acceptedInvite.roomId}?player=${playerId}&game=${acceptedInvite.gameId}`);
                    }}
                  >
                    {t("playWithFriend")}
                  </Button>
                </div>
              </div>
            ))}

            {requests.map((request) => (
              <div key={request.id} className="flex flex-col gap-3 rounded-3xl border border-primary/20 bg-card/70 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{getUserDisplayName(request.fromUserId)}</p>
                  <p className="text-xs text-muted-foreground">{getUserCode(request.fromUserId)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      respondToFriendRequest(request.id, false);
                      refresh();
                    }}
                  >
                    {t("decline")}
                  </Button>
                  <Button
                    onClick={() => {
                      respondToFriendRequest(request.id, true);
                      refresh();
                    }}
                  >
                    {t("accept")}
                  </Button>
                </div>
              </div>
            ))}

            {groupRequests.map((request) => (
              <div key={`${request.groupId}-${request.requesterId}`} className="flex flex-col gap-3 rounded-3xl border border-primary/20 bg-card/70 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{getUserDisplayName(request.requesterId)}</p>
                  <p className="text-xs text-muted-foreground">{t("groupRequestFor")} {request.groupName}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      respondToGroupRequestRemote(request.groupId, request.requesterId, false).then(refresh);
                    }}
                  >
                    {t("decline")}
                  </Button>
                  <Button
                    onClick={() => {
                      respondToGroupRequestRemote(request.groupId, request.requesterId, true).then(refresh);
                    }}
                  >
                    {t("accept")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={requestSentOpen} onOpenChange={setRequestSentOpen}>
        <DialogContent className="max-w-sm rounded-[28px]" dir={dir}>
          <DialogHeader className={dir === "rtl" ? "text-right" : ""}>
            <DialogTitle>{t("requestSentTitle")}</DialogTitle>
          </DialogHeader>
          <p className={dir === "rtl" ? "text-right" : ""}>{t("requestSentMessage")}</p>
          <Button onClick={() => setRequestSentOpen(false)}>{t("continueLabel")}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(requestFeedback)} onOpenChange={(open) => !open && setRequestFeedback(null)}>
        <DialogContent className="max-w-sm rounded-[28px]" dir={dir}>
          <DialogHeader className={dir === "rtl" ? "text-right" : ""}>
            <DialogTitle>{requestFeedback?.title}</DialogTitle>
          </DialogHeader>
          <p className={dir === "rtl" ? "text-right" : ""}>{requestFeedback?.message}</p>
          <Button onClick={() => setRequestFeedback(null)}>{t("continueLabel")}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(inviteDialogFriendId)} onOpenChange={(open) => !open && setInviteDialogFriendId(null)}>
        <DialogContent className="max-w-md rounded-[28px]" dir={dir}>
          <DialogHeader className={dir === "rtl" ? "text-right" : ""}>
            <DialogTitle>Send Game Invite to {inviteFriendName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium">Game</label>
            <select
              value={inviteGameId}
              onChange={(event) => setInviteGameId(event.target.value)}
              className="w-full rounded-xl border border-primary/20 bg-background/60 px-3 py-2 text-sm"
            >
              {GAME_CATALOG.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Total players</label>
                <select
                  value={invitePlayerCount}
                  onChange={(event) => {
                    const nextPlayers = Number(event.target.value);
                    setInvitePlayerCount(nextPlayers);
                    setInviteHumanPlayers((current) => Math.min(nextPlayers, Math.max(1, current)));
                  }}
                  className="w-full rounded-xl border border-primary/20 bg-background/60 px-3 py-2 text-sm"
                >
                  {[2, 3, 4].map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Human players</label>
                <select
                  value={inviteHumanPlayers}
                  onChange={(event) => setInviteHumanPlayers(Number(event.target.value))}
                  className="w-full rounded-xl border border-primary/20 bg-background/60 px-3 py-2 text-sm"
                >
                  {Array.from({ length: invitePlayerCount }, (_, i) => i + 1).map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Turn time limit</label>
              <select
                value={inviteTurnTime}
                onChange={(event) => setInviteTurnTime(Number(event.target.value) as 15 | 30 | 45 | 60)}
                className="w-full rounded-xl border border-primary/20 bg-background/60 px-3 py-2 text-sm"
              >
                {[15, 30, 45, 60].map((seconds) => (
                  <option key={seconds} value={seconds}>
                    {seconds} seconds
                  </option>
                ))}
              </select>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                if (!user || !inviteDialogFriendId) return;
                sendGameInvite({
                  fromUserId: user.id,
                  toUserId: inviteDialogFriendId,
                  gameId: inviteGameId,
                  playerCount: invitePlayerCount,
                  humanPlayers: inviteHumanPlayers,
                  turnTime: inviteTurnTime,
                });
                setInviteDialogFriendId(null);
                refresh();
              }}
            >
              {t("sendGameInvite")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppPageShell>
  );
}
