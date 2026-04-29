import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AppPageShell from "@/components/game/AppPageShell";
import GroupsDialogs from "@/components/groups/GroupsDialogs";
import {
  GroupsChatSection,
  GroupsCreateView,
  GroupsFindView,
  GroupsRankView,
  GroupsTopNav,
  type RankViewMode,
  type GroupsView,
} from "@/components/groups/GroupsViews";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { readPlayerExtras, updatePlayerExtras } from "@/lib/playerExtras";
import { shellBackgrounds } from "@/lib/pageBackgrounds";
import {
  createGroupRemote,
  getCurrentGroupForUser,
  getGroupMessages,
  getGroupsRemote,
  getRankedGroups,
  getRankedPlayers,
  getRegisteredUsers,
  leaveCurrentGroupRemote,
  requestJoinGroupRemote,
  sendGroupMessage,
  syncSocialStateRemote,
  updateGroupRemote,
  type GroupEntry,
} from "@/lib/social";
import cupImg from "@/assets/cup.png";
import flag1Img from "@/assets/flag1.png";
import flag2Img from "@/assets/flag2.png";
import flag3Img from "@/assets/flag3.png";
import flag4Img from "@/assets/flag4.png";
import flag5Img from "@/assets/flag5.png";
import flag6Img from "@/assets/flag6.png";
import flag7Img from "@/assets/flag7.png";
import flag8Img from "@/assets/flag8.png";
import flag9Img from "@/assets/flag9.png";
import flag10Img from "@/assets/flag10.png";

const FLAG_OPTIONS = [
  { id: "flag1", src: flag1Img },
  { id: "flag2", src: flag2Img },
  { id: "flag3", src: flag3Img },
  { id: "flag4", src: flag4Img },
  { id: "flag5", src: flag5Img },
  { id: "flag6", src: flag6Img },
  { id: "flag7", src: flag7Img },
  { id: "flag8", src: flag8Img },
  { id: "flag9", src: flag9Img },
  { id: "flag10", src: flag10Img },
];

const FLAG_MAP = Object.fromEntries(FLAG_OPTIONS.map((flag) => [flag.id, flag.src]));

const DEFAULT_SETTINGS_DRAFT = {
  name: "",
  description: "",
  minScore: "0",
  visibility: "public" as const,
  flag: FLAG_OPTIONS[0].id,
};

export default function Groups() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const [groups, setGroups] = useState<GroupEntry[]>([]);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [minScore, setMinScore] = useState("0");
  const [visibility, setVisibility] = useState<"public" | "private" | "closed">("public");
  const [flag, setFlag] = useState(FLAG_OPTIONS[0].id);
  const [search, setSearch] = useState("");
  const [minPlayers, setMinPlayers] = useState("1");
  const [maxPlayers, setMaxPlayers] = useState("50");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [groupInfoId, setGroupInfoId] = useState<string | null>(null);
  const [playerInfoId, setPlayerInfoId] = useState<string | null>(null);
  const [chatText, setChatText] = useState("");
  const [joinRequestDialogOpen, setJoinRequestDialogOpen] = useState(false);
  const [groupWarningOpen, setGroupWarningOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(DEFAULT_SETTINGS_DRAFT);
  const [rankViewMode, setRankViewMode] = useState<RankViewMode>("groups");

  const view = useMemo<GroupsView>(() => {
    if (location.pathname === "/groups") return "chat";
    if (location.pathname === "/groups/create") return "create";
    if (location.pathname === "/groups/find") return "find";
    if (location.pathname === "/groups/rank") return "rank";
    return "chat";
  }, [location.pathname]);

  const refreshGroups = async () => {
    await syncSocialStateRemote();
    const next = await getGroupsRemote();
    setGroups(next);
  };

  useEffect(() => {
    refreshGroups();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      refreshGroups();
    }, 1500);
    const sync = () => {
      refreshGroups();
    };
    window.addEventListener("splendor-social-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("splendor-social-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (view === "rank") {
      setRankViewMode("groups");
    }
  }, [view]);

  const currentGroup = useMemo(() => getCurrentGroupForUser(user?.id), [user?.id, groups]);
  const currentMessages = useMemo(() => (currentGroup ? getGroupMessages(currentGroup.id) : []), [currentGroup, groups]);
  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const normalizedSearch = search.trim().toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        group.name.toLowerCase().includes(normalizedSearch) ||
        group.code.toLowerCase().includes(normalizedSearch);
      const min = Math.max(1, Number(minPlayers) || 1);
      const max = Math.min(50, Math.max(min, Number(maxPlayers) || 50));
      const matchesMembers = group.members.length >= min && group.members.length <= max;
      const matchesStatus = statusFilter === "all" || group.visibility === statusFilter;
      return matchesSearch && matchesMembers && matchesStatus;
    });
  }, [groups, maxPlayers, minPlayers, search, statusFilter]);
  const rankedGroups = useMemo(() => getRankedGroups(groups), [groups]);
  const rankedPlayers = useMemo(() => getRankedPlayers(), [groups]);
  const infoGroup = useMemo(() => groups.find((group) => group.id === groupInfoId) || null, [groupInfoId, groups]);
  const playerInfo = useMemo(() => {
    if (!playerInfoId) return null;
    return getRegisteredUsers().find((entry: any) => entry.id === playerInfoId) || null;
  }, [playerInfoId, groups]);

  const renderFlag = (flagId?: string, alt = "flag") => {
    const src = FLAG_MAP[flagId || "flag1"];
    if (src) {
      return <img src={src} alt={alt} className="h-10 w-10 object-contain" />;
    }
    return <div className="text-3xl">🏳️</div>;
  };

  const getVisibilityLabel = (groupVisibility: GroupEntry["visibility"]) => {
    if (groupVisibility === "private") return t("privateGroup");
    if (groupVisibility === "closed") return t("closedGroup");
    return t("publicGroup");
  };

  const handleLeaveCurrentGroup = async () => {
    if (!user) return;
    await leaveCurrentGroupRemote(user.id);
    setGroupInfoId(null);
    navigate("/groups");
    refreshGroups();
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim()) return;
    const extras = readPlayerExtras(user.id);
    if (extras.gems < 100) {
      setFeedbackMessage(t("notEnoughGems"));
      return;
    }

    if (getCurrentGroupForUser(user.id)) {
      setGroupWarningOpen(true);
      return;
    }

    const created = await createGroupRemote({
      creatorId: user.id,
      name: groupName.trim(),
      description: description.trim(),
      flag,
      minScore: Number(minScore) || 0,
      visibility,
    });

    if (!created) {
      setFeedbackMessage(t("groupSyncError"));
      return;
    }

    updatePlayerExtras(user.id, (prev) => ({ ...prev, gems: prev.gems - 100 }));
    setGroupName("");
    setDescription("");
    setMinScore("0");
    setVisibility("public");
    setFlag(FLAG_OPTIONS[0].id);
    setFeedbackMessage(t("groupCreatedSuccess"));
    navigate("/groups");
    await refreshGroups();
    setGroupInfoId(created.id);
  };

  const requestJoin = async (group: GroupEntry) => {
    if (!user) return;
    const previousGroup = getCurrentGroupForUser(user.id);
    if (previousGroup && previousGroup.id !== group.id) {
      setGroupWarningOpen(true);
      return;
    }

    const result = await requestJoinGroupRemote(group.id, user.id);
    if (result === "joined") {
      setFeedbackMessage(t("groupJoinedSuccess"));
      await refreshGroups();
      return;
    }
    if (result === "requested") {
      setJoinRequestDialogOpen(true);
      await refreshGroups();
      return;
    }
    if (result === "group-closed") {
      setFeedbackMessage(t("groupClosedMessage"));
      return;
    }
    if (result === "already-member") {
      setFeedbackMessage(t("joinRequestAlreadySent"));
      return;
    }
    setFeedbackMessage(t("groupSyncError"));
  };

  const openEditGroup = () => {
    if (!infoGroup || !user || infoGroup.creatorId !== user.id) return;
    setSettingsDraft({
      name: infoGroup.name,
      description: infoGroup.description,
      minScore: String(infoGroup.minScore),
      visibility: infoGroup.visibility,
      flag: infoGroup.flag || FLAG_OPTIONS[0].id,
    });
    setEditGroupOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!user || !infoGroup) return;
    const updated = await updateGroupRemote(infoGroup.id, user.id, {
      name: settingsDraft.name,
      description: settingsDraft.description,
      minScore: Number(settingsDraft.minScore) || 0,
      visibility: settingsDraft.visibility,
      flag: settingsDraft.flag,
    });

    if (!updated) {
      setFeedbackMessage(t("groupSyncError"));
      return;
    }

    setEditGroupOpen(false);
    setFeedbackMessage(t("groupUpdatedSuccess"));
    await refreshGroups();
    setGroupInfoId(updated.id);
  };

  return (
    <AppPageShell currentPath="/groups" title={t("groupsTitle")} showHeader={false} backgroundImage={shellBackgrounds.groups}>
      <div className="space-y-5" dir={dir}>
        <GroupsTopNav
          view={view}
          dir={dir}
          t={t}
          onNavigate={(nextView) => navigate(nextView === "chat" ? "/groups" : `/groups/${nextView}`)}
        />

        {view === "chat" && (
          <GroupsChatSection
            currentGroup={currentGroup}
            currentMessages={currentMessages}
            userId={user?.id}
            dir={dir}
            t={t}
            chatText={chatText}
            setChatText={setChatText}
            onOpenGroupInfo={setGroupInfoId}
            onSendMessage={() => {
              if (!user || !currentGroup || !chatText.trim()) return;
              sendGroupMessage(currentGroup.id, user.id, chatText.trim());
              setChatText("");
              refreshGroups();
            }}
            onGoToFind={() => navigate("/groups/find")}
            onGoToCreate={() => navigate("/groups/create")}
            renderFlag={renderFlag}
            cupImg={cupImg}
          />
        )}

        {view === "create" && (
          <GroupsCreateView
            dir={dir}
            t={t}
            groupName={groupName}
            setGroupName={setGroupName}
            minScore={minScore}
            setMinScore={setMinScore}
            description={description}
            setDescription={setDescription}
            visibility={visibility}
            setVisibility={setVisibility}
            flag={flag}
            setFlag={setFlag}
            flagOptions={FLAG_OPTIONS}
            onCreateGroup={handleCreateGroup}
          />
        )}

        {view === "find" && (
          <GroupsFindView
            dir={dir}
            t={t}
            search={search}
            setSearch={setSearch}
            minPlayers={minPlayers}
            maxPlayers={maxPlayers}
            statusFilter={statusFilter}
            setMinPlayers={setMinPlayers}
            setMaxPlayers={setMaxPlayers}
            setStatusFilter={setStatusFilter}
            filteredGroups={filteredGroups}
            onRequestJoin={requestJoin}
            onOpenGroupInfo={setGroupInfoId}
            renderFlag={renderFlag}
            cupImg={cupImg}
          />
        )}

        {view === "rank" && (
          <GroupsRankView
            rankedGroups={rankedGroups}
            rankedPlayers={rankedPlayers}
            rankViewMode={rankViewMode}
            dir={dir}
            t={t}
            renderFlag={renderFlag}
            cupImg={cupImg}
            onChangeRankViewMode={setRankViewMode}
            onOpenGroupInfo={setGroupInfoId}
            onOpenPlayerInfo={setPlayerInfoId}
          />
        )}

        <GroupsDialogs
          dir={dir}
          t={t}
          infoGroup={infoGroup}
          currentGroupId={currentGroup?.id}
          currentUserId={user?.id}
          playerInfo={playerInfo}
          feedbackMessage={feedbackMessage}
          joinRequestDialogOpen={joinRequestDialogOpen}
          groupWarningOpen={groupWarningOpen}
          leaveConfirmOpen={leaveConfirmOpen}
          editGroupOpen={editGroupOpen}
          settingsDraft={settingsDraft}
          cupImg={cupImg}
          renderFlag={renderFlag}
          getVisibilityLabel={getVisibilityLabel}
          setGroupInfoId={setGroupInfoId}
          setPlayerInfoId={setPlayerInfoId}
          setJoinRequestDialogOpen={setJoinRequestDialogOpen}
          setGroupWarningOpen={setGroupWarningOpen}
          setLeaveConfirmOpen={setLeaveConfirmOpen}
          setEditGroupOpen={setEditGroupOpen}
          setSettingsDraft={setSettingsDraft}
          onOpenPlayerInfo={setPlayerInfoId}
          onLeaveCurrentGroup={handleLeaveCurrentGroup}
          onEditGroup={openEditGroup}
          onSaveGroup={handleSaveGroup}
          onCloseFeedback={() => setFeedbackMessage(null)}
        />
      </div>
    </AppPageShell>
  );
}
