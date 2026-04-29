import type { ReactNode } from "react";
import { Copy, Lock, MessageCircle, Pencil, Search, Trophy, UserRound, Users } from "lucide-react";
import { motion } from "framer-motion";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { readPlayerExtras } from "@/lib/playerExtras";
import { getLevelFromXp, readProgress } from "@/lib/progression";
import {
  getGroupMembersInfo,
  getGroupScore,
  getUserAvatar,
  getUserCode,
  getUserDisplayName,
  type GroupEntry,
  type RankedPlayerInfo,
} from "@/lib/social";

export type GroupsView = "chat" | "create" | "find" | "rank";
export type RankViewMode = "groups" | "players";
export type FlagOption = { id: string; src: string };

function getActionLabel(group: GroupEntry, t: (key: string) => string) {
  if (group.visibility === "public") return t("joinGroup");
  if (group.visibility === "private") return t("privateGroupRequest");
  return t("closedGroup");
}

export function GroupsTopNav({
  view,
  dir,
  t,
  onNavigate,
}: {
  view: GroupsView;
  dir: string;
  t: (key: string) => string;
  onNavigate: (view: GroupsView) => void;
}) {
  const topButtons: Array<{ key: GroupsView; label: string; icon: typeof Users }> = [
    { key: "chat", label: t("groupChat"), icon: MessageCircle },
    { key: "create", label: t("createGroupTab"), icon: Users },
    { key: "find", label: t("findGroupTab"), icon: Search },
    { key: "rank", label: t("rankGroups"), icon: Trophy },
  ];

  return (
    <div className="rounded-[32px] border border-primary/20 bg-[radial-gradient(circle_at_top_right,rgba(255,214,102,0.18),transparent_35%),linear-gradient(140deg,rgba(15,24,42,0.96),rgba(22,36,48,0.9))] p-4 shadow-2xl">
      <div className="grid grid-cols-2 gap-2">
        {topButtons.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={view === key ? "default" : "outline"}
            className={`h-14 rounded-2xl border-primary/25 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
            onClick={() => onNavigate(key)}
          >
            <Icon className="h-4 w-4" />
            <span className="line-clamp-1 text-xs sm:text-sm">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

export function GroupsChatSection({
  currentGroup,
  currentMessages,
  userId,
  dir,
  t,
  chatText,
  setChatText,
  onOpenGroupInfo,
  onSendMessage,
  onGoToFind,
  onGoToCreate,
  renderFlag,
  cupImg,
}: {
  currentGroup: GroupEntry | null;
  currentMessages: Array<{ id: string; senderId: string; text: string }>;
  userId?: string;
  dir: string;
  t: (key: string) => string;
  chatText: string;
  setChatText: (value: string) => void;
  onOpenGroupInfo: (groupId: string) => void;
  onSendMessage: () => void;
  onGoToFind: () => void;
  onGoToCreate: () => void;
  renderFlag: (flagId?: string, alt?: string) => ReactNode;
  cupImg: string;
}) {
  if (!currentGroup) {
    return (
      <div className="rounded-[32px] border border-primary/20 bg-card/70 p-4 shadow-xl backdrop-blur">
        <div className={`flex min-h-[220px] flex-col items-center justify-center space-y-4 rounded-[28px] border border-dashed border-primary/25 bg-background/35 p-6 ${dir === "rtl" ? "text-right" : "text-center"}`}>
          <h2 className="font-cinzel text-2xl text-primary">{t("groupsTitle")}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{t("noGroupJoined")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={onGoToCreate}>{t("createGroupTab")}</Button>
            <Button variant="outline" onClick={onGoToFind}>{t("findGroupTab")}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[32px] border border-primary/20 bg-card/70 p-4 shadow-xl backdrop-blur">
      <button
        type="button"
        onClick={() => onOpenGroupInfo(currentGroup.id)}
        className={`flex w-full items-center justify-between gap-3 rounded-[28px] border border-primary/20 bg-background/40 px-4 py-4 ${dir === "rtl" ? "flex-row-reverse text-right" : "text-left"}`}
      >
        <div className={`flex items-center gap-3 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            {renderFlag(currentGroup.flag, currentGroup.name)}
          </div>
          <div>
            <h2 className="font-cinzel text-xl text-primary">{currentGroup.name}</h2>
            <div className={`mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground ${dir === "rtl" ? "justify-end" : ""}`}>
              <span>{t("groupCode")}: {currentGroup.code}</span>
              <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {currentGroup.members.length}</span>
              <span className="inline-flex items-center gap-1"><img src={cupImg} alt="cup" className="h-3.5 w-3.5 object-contain" /> {getGroupScore(currentGroup)}</span>
            </div>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{t("groupInfo")}</span>
      </button>

      <div className="h-[360px] space-y-3 overflow-y-auto rounded-[28px] border border-primary/15 bg-background/35 p-4">
        {currentMessages.length === 0 ? (
          <p className={`text-sm text-muted-foreground ${dir === "rtl" ? "text-right" : "text-left"}`}>{t("noMessagesYet")}</p>
        ) : (
          currentMessages.map((entry) => {
            const mine = entry.senderId === userId;
            return (
              <div key={entry.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[92%] items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-9 w-9 border border-primary/20">
                    <AvatarImage src={getUserAvatar(entry.senderId)} alt={getUserDisplayName(entry.senderId)} />
                    <AvatarFallback>{getUserDisplayName(entry.senderId).slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className={`rounded-[24px] px-4 py-3 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-background/70"}`}>
                    <div className={`mb-1 text-xs font-semibold ${mine ? "text-primary-foreground/80" : "text-primary"}`}>
                      {getUserDisplayName(entry.senderId)}
                    </div>
                    <div className={dir === "rtl" ? "text-right" : "text-left"}>{entry.text}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <Input
          dir={dir}
          value={chatText}
          onChange={(event) => setChatText(event.target.value)}
          placeholder={t("typeMessage")}
          className={dir === "rtl" ? "text-right" : ""}
        />
        <Button onClick={onSendMessage}>{t("sendMessage")}</Button>
      </div>
    </div>
  );
}

export function GroupsCreateView({
  dir,
  t,
  groupName,
  setGroupName,
  minScore,
  setMinScore,
  description,
  setDescription,
  visibility,
  setVisibility,
  flag,
  setFlag,
  flagOptions,
  onCreateGroup,
}: {
  dir: string;
  t: (key: string) => string;
  groupName: string;
  setGroupName: (value: string) => void;
  minScore: string;
  setMinScore: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  visibility: "public" | "private" | "closed";
  setVisibility: (value: "public" | "private" | "closed") => void;
  flag: string;
  setFlag: (value: string) => void;
  flagOptions: FlagOption[];
  onCreateGroup: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-primary/20 bg-card/70 p-5 shadow-xl backdrop-blur">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${dir === "rtl" ? "text-right" : ""}`}>{t("groupName")}</label>
          <Input dir={dir} value={groupName} onChange={(event) => setGroupName(event.target.value)} className={dir === "rtl" ? "text-right" : ""} />
        </div>
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${dir === "rtl" ? "text-right" : ""}`}>{t("minimumEntryScore")}</label>
          <Input dir={dir} type="number" value={minScore} onChange={(event) => setMinScore(event.target.value)} className={dir === "rtl" ? "text-right" : ""} />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <label className={`block text-sm font-medium ${dir === "rtl" ? "text-right" : ""}`}>{t("descriptionLabel")}</label>
        <Textarea dir={dir} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className={dir === "rtl" ? "text-right" : ""} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${dir === "rtl" ? "text-right" : ""}`}>{t("groupStatus")}</label>
          <Select value={visibility} onValueChange={(value: "public" | "private" | "closed") => setVisibility(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">{t("publicGroup")}</SelectItem>
              <SelectItem value="private">{t("privateGroup")}</SelectItem>
              <SelectItem value="closed">{t("closedGroup")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${dir === "rtl" ? "text-right" : ""}`}>{t("flagLabel")}</label>
          <div className={`flex flex-wrap gap-2 ${dir === "rtl" ? "justify-end" : ""}`}>
            {flagOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFlag(option.id)}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${flag === option.id ? "border-primary bg-primary/10" : "border-primary/25 bg-background/40"}`}
              >
                <img src={option.src} alt={option.id} className="h-8 w-8 object-contain" />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={`mt-4 rounded-2xl border border-primary/15 bg-background/35 px-4 py-3 text-sm text-muted-foreground ${dir === "rtl" ? "text-right" : ""}`}>
        {t("singleGroupNotice")}
      </div>
      <Button className="mt-5 w-full" onClick={onCreateGroup}>{t("createGroupCost")}</Button>
    </motion.div>
  );
}

export function GroupsFindView({
  dir,
  t,
  search,
  setSearch,
  minPlayers,
  maxPlayers,
  statusFilter,
  setMinPlayers,
  setMaxPlayers,
  setStatusFilter,
  filteredGroups,
  onRequestJoin,
  onOpenGroupInfo,
  renderFlag,
  cupImg,
}: {
  dir: string;
  t: (key: string) => string;
  search: string;
  setSearch: (value: string) => void;
  minPlayers: string;
  maxPlayers: string;
  statusFilter: string;
  setMinPlayers: (value: string) => void;
  setMaxPlayers: (value: string) => void;
  setStatusFilter: (value: string) => void;
  filteredGroups: GroupEntry[];
  onRequestJoin: (group: GroupEntry) => void;
  onOpenGroupInfo: (groupId: string) => void;
  renderFlag: (flagId?: string, alt?: string) => ReactNode;
  cupImg: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-[32px] border border-primary/20 bg-card/70 p-4 shadow-xl">
        <div className="relative">
          <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${dir === "rtl" ? "right-3" : "left-3"}`} />
          <Input
            dir={dir}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchGroups")}
            className={dir === "rtl" ? "pr-9 text-right" : "pl-9"}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_180px]">
          <div className={`rounded-2xl border border-primary/15 bg-background/35 px-4 py-3 ${dir === "rtl" ? "text-right" : ""}`}>
            <div className={`mb-3 flex items-center justify-between text-sm text-muted-foreground ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
              <span>{t("minPlayersLabel")}: {minPlayers}</span>
              <span>{t("maxPlayersLabel")}: {maxPlayers}</span>
            </div>
            <Slider
              min={1}
              max={50}
              step={1}
              value={[Number(minPlayers), Number(maxPlayers)]}
              onValueChange={([min, max]) => {
                setMinPlayers(String(min));
                setMaxPlayers(String(Math.max(min, max)));
              }}
              className="py-2"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="public">{t("publicGroup")}</SelectItem>
              <SelectItem value="private">{t("privateGroup")}</SelectItem>
              <SelectItem value="closed">{t("closedGroup")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredGroups.length === 0 && <p className="text-sm text-muted-foreground">{t("noGroupsFound")}</p>}
        {filteredGroups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-[32px] border border-primary/20 bg-card/70 p-4 shadow-xl backdrop-blur"
          >
            <div className={`flex flex-col gap-4 ${dir === "rtl" ? "text-right" : ""}`}>
              <div className={`flex items-start justify-between gap-3 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                <div className={`flex items-center gap-3 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">{renderFlag(group.flag, group.name)}</div>
                  <div>
                    <div className={`flex items-center gap-2 ${dir === "rtl" ? "flex-row-reverse justify-end" : ""}`}>
                      <h3 className="text-lg font-semibold">{group.name}</h3>
                      {group.visibility !== "public" && <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{t("groupCode")}: {group.code}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{group.description || t("noDescription")}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(group.code)}
                  className="rounded-full border border-primary/20 p-2 text-primary"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className={`flex flex-wrap gap-3 text-xs text-muted-foreground ${dir === "rtl" ? "justify-end" : ""}`}>
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {group.members.length}</span>
                <span className="inline-flex items-center gap-1"><img src={cupImg} alt="cup" className="h-3.5 w-3.5 object-contain" /> {t("minimumEntryScore")}: {group.minScore}</span>
                <span className="inline-flex items-center gap-1"><img src={cupImg} alt="cup" className="h-3.5 w-3.5 object-contain" /> {t("scoresLabel")}: {getGroupScore(group)}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button disabled={group.visibility === "closed"} onClick={() => onRequestJoin(group)}>
                  {getActionLabel(group, t)}
                </Button>
                <Button variant="outline" onClick={() => onOpenGroupInfo(group.id)}>{t("groupInfo")}</Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function GroupsRankView({
  rankedGroups,
  rankedPlayers,
  rankViewMode,
  dir,
  t,
  renderFlag,
  cupImg,
  onChangeRankViewMode,
  onOpenGroupInfo,
  onOpenPlayerInfo,
}: {
  rankedGroups: GroupEntry[];
  rankedPlayers: RankedPlayerInfo[];
  rankViewMode: RankViewMode;
  dir: string;
  t: (key: string) => string;
  renderFlag: (flagId?: string, alt?: string) => ReactNode;
  cupImg: string;
  onChangeRankViewMode: (mode: RankViewMode) => void;
  onOpenGroupInfo: (groupId: string) => void;
  onOpenPlayerInfo: (playerId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[32px] border border-primary/20 bg-[radial-gradient(circle_at_top_right,rgba(255,214,102,0.18),transparent_35%),linear-gradient(140deg,rgba(15,24,42,0.96),rgba(22,36,48,0.9))] p-4 shadow-2xl">
        <div className="grid grid-cols-2 gap-2">
          <Button variant={rankViewMode === "groups" ? "default" : "outline"} onClick={() => onChangeRankViewMode("groups")}>
            {t("rankGroups")}
          </Button>
          <Button variant={rankViewMode === "players" ? "default" : "outline"} onClick={() => onChangeRankViewMode("players")}>
            {t("rankPlayers")}
          </Button>
        </div>
      </div>

      {rankViewMode === "groups" ? (
        <div className="space-y-4 rounded-[32px] border border-primary/20 bg-card/70 p-4 shadow-xl">
          <div className={`flex items-center gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="font-cinzel text-xl text-primary">{t("topGroups")}</h2>
          </div>
          {rankedGroups.map((group, index) => (
            <button
              key={group.id}
              type="button"
              onClick={() => onOpenGroupInfo(group.id)}
              className={`w-full rounded-[28px] border border-primary/20 bg-background/35 p-4 shadow-sm ${dir === "rtl" ? "text-right" : "text-left"}`}
            >
              <div className={`flex items-center justify-between gap-3 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                <div className={`flex items-center gap-3 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">#{index + 1}</div>
                  <div>
                    <h3 className={`flex items-center gap-2 text-lg font-semibold ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                      {renderFlag(group.flag, group.name)}
                      <span>{group.name}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">{t("groupCode")}: {group.code}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 text-sm text-muted-foreground ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                  <img src={cupImg} alt="cup" className="h-5 w-5 object-contain" />
                  <span>{getGroupScore(group)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4 rounded-[32px] border border-primary/20 bg-card/70 p-4 shadow-xl">
          <div className={`flex items-center gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
            <UserRound className="h-5 w-5 text-primary" />
            <h2 className="font-cinzel text-xl text-primary">{t("topPlayers")}</h2>
          </div>
          {rankedPlayers.map((player, index) => (
            <button
              key={player.id}
              type="button"
              onClick={() => onOpenPlayerInfo(player.id)}
              className={`flex w-full items-center justify-between rounded-[28px] border border-primary/20 bg-background/35 px-4 py-3 ${dir === "rtl" ? "flex-row-reverse text-right" : "text-left"}`}
            >
              <span className={`flex items-center gap-3 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 font-semibold text-primary">#{index + 1}</span>
                <Avatar className="h-11 w-11 border border-primary/20">
                  <AvatarImage src={getUserAvatar(player.id)} alt={player.username} />
                  <AvatarFallback>{player.username.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span>
                  <span className="block font-medium">{player.username}</span>
                  <span className="text-xs text-muted-foreground">{player.userCode}</span>
                </span>
              </span>
              <span className={`inline-flex items-center gap-2 text-sm text-muted-foreground ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                <img src={cupImg} alt="cup" className="h-4 w-4 object-contain" />
                {player.score}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PlayerInfoDetails({
  playerInfo,
  dir,
  t,
}: {
  playerInfo: { id: string; username: string; email?: string; createdAt?: string };
  dir: string;
  t: (key: string) => string;
}) {
  return (
    <div className={`space-y-4 ${dir === "rtl" ? "text-right" : ""}`}>
      <div className={`flex items-center gap-4 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
        <Avatar className="h-20 w-20 border border-primary/20">
          <AvatarImage src={getUserAvatar(playerInfo.id)} alt={playerInfo.username} />
          <AvatarFallback>{playerInfo.username.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{t("scoresLabel")}: {readProgress(playerInfo.id).points}</p>
          <p>{t("coinsLabel")}: {readProgress(playerInfo.id).coins}</p>
          <p>{t("gemsLabel")}: {readPlayerExtras(playerInfo.id).gems}</p>
          <p>{t("level")}: {getLevelFromXp(readProgress(playerInfo.id).xp)}</p>
          <p>{t("userCode")}: {getUserCode(playerInfo.id)}</p>
          <p>{t("emailLabel")}: {playerInfo.email || t("noEmailSaved")}</p>
          <p>{t("memberSince")}: {playerInfo.createdAt ? new Date(playerInfo.createdAt).toLocaleDateString() : "-"}</p>
        </div>
      </div>
    </div>
  );
}

export function GroupInfoCard({
  infoGroup,
  currentGroupId,
  currentUserId,
  dir,
  t,
  cupImg,
  renderFlag,
  getVisibilityLabel,
  onClose,
  onOpenPlayerInfo,
  onLeaveGroup,
  onEditGroup,
}: {
  infoGroup: GroupEntry;
  currentGroupId?: string;
  currentUserId?: string;
  dir: string;
  t: (key: string) => string;
  cupImg: string;
  renderFlag: (flagId?: string, alt?: string) => ReactNode;
  getVisibilityLabel: (visibility: GroupEntry["visibility"]) => string;
  onClose: () => void;
  onOpenPlayerInfo: (playerId: string) => void;
  onLeaveGroup: () => void;
  onEditGroup: () => void;
}) {
  const isCreator = currentUserId === infoGroup.creatorId;

  return (
    <div className="rounded-[32px] border border-primary/20 bg-card/80 p-5 shadow-2xl backdrop-blur">
      <div className={`flex items-start justify-between gap-3 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
        <div className={dir === "rtl" ? "text-right" : ""}>
          <h3 className="flex items-center gap-2 font-cinzel text-xl text-primary">{renderFlag(infoGroup.flag, infoGroup.name)} <span>{infoGroup.name}</span></h3>
          <div className={`mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground ${dir === "rtl" ? "justify-end" : ""}`}>
            <span>{t("groupCode")}: {infoGroup.code}</span>
            <span>{t("groupStatus")}: {getVisibilityLabel(infoGroup.visibility)}</span>
            <span>{t("minimumEntryScore")}: {infoGroup.minScore}</span>
            <span>{t("scoresLabel")}: {getGroupScore(infoGroup)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {isCreator && (
            <Button variant="outline" onClick={onEditGroup}>
              <Pencil className="h-4 w-4" />
              {t("groupSettings")}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>{t("closeLabel")}</Button>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {getGroupMembersInfo(infoGroup.id).map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => onOpenPlayerInfo(member.id)}
            className={`flex w-full items-center justify-between rounded-2xl border border-primary/15 bg-background/35 px-4 py-3 ${dir === "rtl" ? "flex-row-reverse text-right" : "text-left"}`}
          >
            <span className={`flex items-center gap-3 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
              <Avatar className="h-11 w-11 border border-primary/20">
                <AvatarImage src={getUserAvatar(member.id)} alt={member.username} />
                <AvatarFallback>{member.username.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span>
                <span className="block">{member.username}</span>
                {member.id === infoGroup.creatorId && <span className="text-xs text-muted-foreground">{t("creatorLabel")}</span>}
              </span>
            </span>
            <span className={`inline-flex items-center gap-2 text-sm text-muted-foreground ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
              <img src={cupImg} alt="cup" className="h-4 w-4 object-contain" />
              {member.score}
            </span>
          </button>
        ))}
      </div>
      {currentGroupId === infoGroup.id && (
        <Button className="mt-4 w-full" variant="outline" onClick={onLeaveGroup}>
          {t("leaveGroup")}
        </Button>
      )}
    </div>
  );
}
