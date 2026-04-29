import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GroupInfoCard, PlayerInfoDetails } from "@/components/groups/GroupsViews";
import type { GroupEntry } from "@/lib/social";

export default function GroupsDialogs({
  dir,
  t,
  infoGroup,
  currentGroupId,
  currentUserId,
  playerInfo,
  feedbackMessage,
  joinRequestDialogOpen,
  groupWarningOpen,
  leaveConfirmOpen,
  editGroupOpen,
  settingsDraft,
  cupImg,
  renderFlag,
  getVisibilityLabel,
  setGroupInfoId,
  setPlayerInfoId,
  setJoinRequestDialogOpen,
  setGroupWarningOpen,
  setLeaveConfirmOpen,
  setEditGroupOpen,
  setSettingsDraft,
  onOpenPlayerInfo,
  onLeaveCurrentGroup,
  onEditGroup,
  onSaveGroup,
  onCloseFeedback,
}: {
  dir: string;
  t: (key: string) => string;
  infoGroup: GroupEntry | null;
  currentGroupId?: string;
  currentUserId?: string;
  playerInfo: { id: string; username: string; email?: string; createdAt?: string } | null;
  feedbackMessage: string | null;
  joinRequestDialogOpen: boolean;
  groupWarningOpen: boolean;
  leaveConfirmOpen: boolean;
  editGroupOpen: boolean;
  settingsDraft: { name: string; description: string; minScore: string; visibility: "public" | "private" | "closed"; flag: string };
  cupImg: string;
  renderFlag: (flagId?: string, alt?: string) => ReactNode;
  getVisibilityLabel: (visibility: GroupEntry["visibility"]) => string;
  setGroupInfoId: (value: string | null) => void;
  setPlayerInfoId: (value: string | null) => void;
  setJoinRequestDialogOpen: (value: boolean) => void;
  setGroupWarningOpen: (value: boolean) => void;
  setLeaveConfirmOpen: (value: boolean) => void;
  setEditGroupOpen: (value: boolean) => void;
  setSettingsDraft: (value: { name: string; description: string; minScore: string; visibility: "public" | "private" | "closed"; flag: string }) => void;
  onOpenPlayerInfo: (playerId: string) => void;
  onLeaveCurrentGroup: () => void;
  onEditGroup: () => void;
  onSaveGroup: () => void;
  onCloseFeedback: () => void;
}) {
  return (
    <>
      <Dialog open={Boolean(feedbackMessage)} onOpenChange={(open) => !open && onCloseFeedback()}>
        <DialogContent className="max-w-sm rounded-[28px]" dir={dir}>
          <DialogHeader className={dir === "rtl" ? "text-right" : ""}>
            <DialogTitle>{t("groupsTitle")}</DialogTitle>
          </DialogHeader>
          <p className={dir === "rtl" ? "text-right" : ""}>{feedbackMessage}</p>
          <Button onClick={onCloseFeedback}>{t("continueLabel")}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(infoGroup)} onOpenChange={(open) => !open && setGroupInfoId(null)}>
        <DialogContent className="max-w-lg rounded-[28px]" dir={dir}>
          {infoGroup && (
            <>
              <DialogHeader className={dir === "rtl" ? "text-right" : ""}>
                <DialogTitle>{t("groupInfo")}</DialogTitle>
              </DialogHeader>
              <GroupInfoCard
                infoGroup={infoGroup}
                currentGroupId={currentGroupId}
                currentUserId={currentUserId}
                dir={dir}
                t={t}
                cupImg={cupImg}
                renderFlag={renderFlag}
                getVisibilityLabel={getVisibilityLabel}
                onClose={() => setGroupInfoId(null)}
                onOpenPlayerInfo={onOpenPlayerInfo}
                onLeaveGroup={() => setLeaveConfirmOpen(true)}
                onEditGroup={onEditGroup}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editGroupOpen} onOpenChange={setEditGroupOpen}>
        <DialogContent className="max-w-lg rounded-[28px]" dir={dir}>
          <DialogHeader className={dir === "rtl" ? "text-right" : ""}>
            <DialogTitle>{t("editGroupSettings")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${dir === "rtl" ? "text-right" : ""}`}>{t("groupName")}</label>
              <Input
                dir={dir}
                value={settingsDraft.name}
                onChange={(event) => setSettingsDraft({ ...settingsDraft, name: event.target.value })}
                className={dir === "rtl" ? "text-right" : ""}
              />
            </div>
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${dir === "rtl" ? "text-right" : ""}`}>{t("descriptionLabel")}</label>
              <Textarea
                dir={dir}
                value={settingsDraft.description}
                onChange={(event) => setSettingsDraft({ ...settingsDraft, description: event.target.value })}
                className={dir === "rtl" ? "text-right" : ""}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${dir === "rtl" ? "text-right" : ""}`}>{t("minimumEntryScore")}</label>
                <Input
                  dir={dir}
                  type="number"
                  value={settingsDraft.minScore}
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, minScore: event.target.value })}
                  className={dir === "rtl" ? "text-right" : ""}
                />
              </div>
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${dir === "rtl" ? "text-right" : ""}`}>{t("groupStatus")}</label>
                <Select
                  value={settingsDraft.visibility}
                  onValueChange={(value: "public" | "private" | "closed") => setSettingsDraft({ ...settingsDraft, visibility: value })}
                >
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
            </div>
            <Button onClick={onSaveGroup}>{t("saveGroupSettings")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(playerInfo)} onOpenChange={(open) => !open && setPlayerInfoId(null)}>
        <DialogContent className="max-w-sm rounded-[28px]" dir={dir}>
          {playerInfo && (
            <>
              <DialogHeader className={dir === "rtl" ? "text-right" : ""}>
                <DialogTitle>{playerInfo.username}</DialogTitle>
              </DialogHeader>
              <PlayerInfoDetails playerInfo={playerInfo} dir={dir} t={t} />
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={joinRequestDialogOpen} onOpenChange={setJoinRequestDialogOpen}>
        <DialogContent className="max-w-sm rounded-[28px]" dir={dir}>
          <DialogHeader className={dir === "rtl" ? "text-right" : ""}>
            <DialogTitle>{t("joinRequestSent")}</DialogTitle>
          </DialogHeader>
          <p className={dir === "rtl" ? "text-right" : ""}>{t("joinRequestSentMessage")}</p>
          <Button onClick={() => setJoinRequestDialogOpen(false)}>{t("continueLabel")}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={groupWarningOpen} onOpenChange={setGroupWarningOpen}>
        <DialogContent className="max-w-sm rounded-[28px]" dir={dir}>
          <DialogHeader className={dir === "rtl" ? "text-right" : ""}>
            <DialogTitle>{t("groupActionBlockedTitle")}</DialogTitle>
          </DialogHeader>
          <p className={dir === "rtl" ? "text-right" : ""}>{t("groupActionBlockedMessage")}</p>
          <Button onClick={() => setGroupWarningOpen(false)}>{t("closeLabel")}</Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader className={dir === "rtl" ? "text-right" : ""}>
            <AlertDialogTitle>{t("leaveGroupConfirmTitle")}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onLeaveCurrentGroup();
                setLeaveConfirmOpen(false);
              }}
            >
              {t("leaveGroup")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
