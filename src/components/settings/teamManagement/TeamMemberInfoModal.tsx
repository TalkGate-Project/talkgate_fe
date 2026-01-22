"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemberDetail } from "@/hooks/useMemberDetail";
import { useMyMember } from "@/hooks/useMyMember";
import { useCreateTeamMutation, useDeleteTeamMutation, useUpdateTeamMutation } from "@/hooks/useMembersTree";
import { HRService } from "@/services/hr";
import type { HrNote } from "@/types/members";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import RoleBadge from "./RoleBadge";
import OrganizationContent from "./OrganizationContent";
import ManagerContent from "./ManagerContent";
import { initialFromName, getRoleLabel, transformOrgTree } from "./memberInfoUtils";

type Props = {
  open: boolean;
  memberId: number;
  onClose: () => void;
  projectId: string | number | null;
  onMemberClick?: (memberId: number) => void;
};

type TabKey = "organization" | "manager";

export default function TeamMemberInfoModal({
  open,
  memberId,
  onClose,
  projectId,
  onMemberClick,
}: Props) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>("organization");
  const [localNotes, setLocalNotes] = useState<HrNote[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [teamCreateMode, setTeamCreateMode] = useState(false);
  const [teamNameDraft, setTeamNameDraft] = useState("");
  const [teamEditMode, setTeamEditMode] = useState(false);
  const [teamEditDraft, setTeamEditDraft] = useState("");
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [hrFormData, setHrFormData] = useState({
    realName: "",
    birthDate: null as Date | null,
    address: "",
  });
  const createTeam = useCreateTeamMutation(projectId);
  const deleteTeam = useDeleteTeamMutation(projectId);
  const updateTeam = useUpdateTeamMutation(projectId);
  const projectIdString = projectId !== null ? String(projectId) : null;
  const { isAdminOrSubAdmin } = useMyMember(projectIdString);

  const { member, isLoading, isError } = useMemberDetail(
    open ? memberId : null
  );

  // 모달이 처음 열리거나 memberId가 변경될 때만 초기화
  useEffect(() => {
    if (!open) return;
    setTab("organization");
    setTeamCreateMode(false);
    setTeamNameDraft("");
    setTeamEditMode(false);
    setTeamEditDraft("");
    setProfileEditMode(false);
  }, [open, memberId]);

  // member 데이터가 로드되면 로컬 상태 업데이트 (탭은 유지)
  useEffect(() => {
    if (!open || !member) return;
    setLocalNotes(member.hrNotes ?? []);
    setNoteInput("");
    setHrFormData({
      realName: member.hrData?.realName ?? "",
      birthDate: member.hrData?.birth ? new Date(member.hrData.birth) : null,
      address: member.hrData?.address ?? "",
    });
  }, [member, open]);

  useEffect(() => {
    if (tab === "manager" && !isAdminOrSubAdmin) {
      setTab("organization");
    }
  }, [tab, isAdminOrSubAdmin]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const handleAddNote = async () => {
    const trimmed = noteInput.trim();
    if (!trimmed) return;
    if (isSubmittingNote) return;

    try {
      setIsSubmittingNote(true);
      const response = await HRService.addMemberNote(memberId, {
        note: trimmed,
      });
      await queryClient.invalidateQueries({ queryKey: ["members", "detail", memberId] });
      if (response.data?.data) {
        setLocalNotes((prev) => [response.data.data, ...prev]);
      }
      setNoteInput("");
    } catch (e: any) {
      console.error(e);
      showErrorModal({
        type: "error",
        headline: "특이사항 추가 실패. 잠시 후 다시 시도해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleRemoveNote = (noteId: number) => {
    if (isSubmittingNote) return;

    showErrorModal({
      type: "error",
      headline: "특이사항을 삭제하시겠습니까?",
      onConfirm: async () => {
        try {
          setIsSubmittingNote(true);
          await HRService.removeMemberNote(memberId, noteId);
          await queryClient.invalidateQueries({ queryKey: ["members", "detail", memberId] });
          setLocalNotes((prev) => prev.filter((note) => note.id !== noteId));
        } catch (e: any) {
          console.error(e);
          showErrorModal({
            type: "error",
            headline: "특이사항 삭제 실패. 잠시 후 다시 시도해주세요.",
            hideCancel: true,
            confirmText: "확인",
          });
        } finally {
          setIsSubmittingNote(false);
        }
      },
    });
  };

  const handleSaveProfile = async () => {
    if (isSubmittingProfile) return;

    try {
      setIsSubmittingProfile(true);
      await HRService.updateMemberData(memberId, {
        realName: hrFormData.realName,
        birth: hrFormData.birthDate ? format(hrFormData.birthDate, "yyyy-MM-dd") : "",
        address: hrFormData.address,
      });
      await queryClient.invalidateQueries({ queryKey: ["members", "detail", memberId] });
      showErrorModal({
        type: "success",
        headline: "프로필 정보가 저장되었습니다.",
        hideCancel: true,
        confirmText: "확인",
        onConfirm: () => {
          setProfileEditMode(false);
        },
      });
    } catch (e: any) {
      console.error(e);
      showErrorModal({
        type: "error",
        headline: "저장 실패. 잠시 후 다시 시도해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleCancelProfileEdit = () => {
    if (member) {
      setHrFormData({
        realName: member.hrData?.realName ?? "",
        birthDate: member.hrData?.birth ? new Date(member.hrData.birth) : null,
        address: member.hrData?.address ?? "",
      });
    }
    setProfileEditMode(false);
  };

  const handleReset = () => {
    setLocalNotes(member?.hrNotes ?? []);
    setNoteInput("");
    setTab("organization");
    setProfileEditMode(false);
    if (member) {
      setHrFormData({
        realName: member.hrData?.realName ?? "",
        birthDate: member.hrData?.birth ? new Date(member.hrData.birth) : null,
        address: member.hrData?.address ?? "",
      });
    }
  };

  const handleCreateTeam = async () => {
    const trimmed = teamNameDraft.trim();
    if (!trimmed || createTeam.isPending) return;
    try {
      await createTeam.mutateAsync({
        memberId: memberId,
        teamName: trimmed,
      });
      // 멤버 상세 정보 쿼리 무효화하여 최신 데이터 반영
      await queryClient.invalidateQueries({ queryKey: ["members", "detail", memberId] });
      setTeamCreateMode(false);
      setTeamNameDraft("");
    } catch (err: any) {
      console.error(err);
      showErrorModal({
        type: "error",
        headline: "팀 생성 실패. 잠시 후 다시 시도해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
    }
  };

  const handleDeleteTeam = () => {
    if (deleteTeam.isPending) return;

    showErrorModal({
      type: "error",
      headline: "이 팀을 제거하시겠습니까?",
      onConfirm: async () => {
        try {
          await deleteTeam.mutateAsync({ memberId: memberId });
          await queryClient.invalidateQueries({ queryKey: ["members", "detail", memberId] });
          showErrorModal({
            type: "success",
            headline: "팀이 제거되었습니다.",
            hideCancel: true,
            confirmText: "확인",
          });
        } catch (err: any) {
          console.error(err);
          showErrorModal({
            type: "error",
            headline: "팀 제거 실패. 잠시 후 다시 시도해주세요.",
            hideCancel: true,
            confirmText: "확인",
          });
        }
      },
    });
  };

  const handleUpdateTeam = async () => {
    const trimmed = teamEditDraft.trim();
    if (!trimmed || updateTeam.isPending) return;
    if (trimmed === member?.teamInfo?.name) {
      setTeamEditMode(false);
      return;
    }
    try {
      await updateTeam.mutateAsync({
        memberId: memberId,
        teamName: trimmed,
      });
      // 멤버 상세 정보 쿼리 무효화하여 최신 데이터 반영
      await queryClient.invalidateQueries({ queryKey: ["members", "detail", memberId] });
      setTeamEditMode(false);
      showErrorModal({
        type: "success",
        headline: "팀 이름이 변경되었습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } catch (err: any) {
      console.error(err);
      showErrorModal({
        type: "error",
        headline: "팀 이름 변경 실패. 잠시 후 다시 시도해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
    }
  };

  // 팀 생성 권한: subAdmin 이상만 가능 (팀장이 아닌 경우에만)
  const isTargetLeader =
    member?.role === "leader" ||
    member?.role === "admin" ||
    member?.role === "subAdmin";
  const canCreateTeam = isAdminOrSubAdmin && !isTargetLeader;

  // 멤버가 팀장인지 확인
  const isLeader = member?.role === "leader";

  // 팀 제거 권한: subAdmin 이상이고, 대상이 팀장이고, 팀이 있는 경우
  const canDeleteTeam = isAdminOrSubAdmin && isLeader && member?.teamInfo?.name;

  // 조직도 노드 계산 (계층 구조 유지)
  const orgTreeRoot = transformOrgTree(member?.organizationTree);

  // 로딩 상태
  if (isLoading) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 dark:bg-[#000000CC]" onClick={onClose} />
        <div className="relative w-full h-full md:w-[904px] md:h-[400px] md:min-w-[600px] bg-white dark:bg-neutral-0 md:rounded-[14px] overflow-hidden flex flex-col items-center justify-center">
          <LoadingSpinner size="2xl" />
          <p className="mt-4 text-[14px] text-neutral-60">
            직원 정보를 불러오는 중...
          </p>
        </div>
      </div>,
      document.body
    );
  }

  // 에러 상태
  if (isError || !member) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 dark:bg-[#000000CC]" onClick={onClose} />
        <div className="relative w-full h-full md:w-[904px] md:h-[400px] md:min-w-[600px] bg-white dark:bg-neutral-0 md:rounded-[14px] overflow-hidden flex flex-col items-center justify-center">
          <p className="text-[14px] text-neutral-60">
            직원 정보를 불러오는 중 오류가 발생했습니다.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 h-[34px] px-4 rounded-[5px] bg-neutral-90 text-[14px] font-semibold text-neutral-0"
          >
            닫기
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 dark:bg-[#000000CC]" onClick={onClose} />
      <div className="relative w-full h-full md:w-[904px] md:min-w-[600px] md:max-h-[90vh] bg-white dark:bg-neutral-0 md:rounded-[14px] overflow-hidden flex flex-col">
        <header className="h-[64px] md:h-auto px-4 md:px-6 pt-4 md:pt-4 pb-[10px] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* 모바일 뒤로가기 버튼 */}
            <button
              type="button"
              onClick={onClose}
              className="md:hidden cursor-pointer w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
              aria-label="뒤로가기"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 19L8 12L15 5"
                  stroke="currentColor"
                  className="text-neutral-90 dark:text-neutral-80"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h1 className="text-[18px] font-semibold leading-[1] text-foreground">
              직원정보
            </h1>
          </div>
          {/* 데스크탑 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="hidden md:flex cursor-pointer w-6 h-6 grid place-items-center rounded hover:bg-neutral-10"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 18L18 6M6 6L18 18"
                stroke="#B0B0B0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5">
          <section className="mb-6 md:mb-8">
            <h2 className="text-[14px] md:text-[16px] font-semibold leading-[1] text-foreground mb-3">
              기본 정보
            </h2>
            <div className="h-[1px] bg-border opacity-50 mb-4" />
            <div className="bg-neutral-10 dark:bg-neutral-25 rounded-[12px] p-4 h-full min-h-[72px]">
              <div className="flex items-start gap-3 md:gap-4 h-full">
                <div className={`h-full ${member.teamInfo && member.teamInfo.name ? "min-h-[84px]" : "min-h-[72px]"} flex items-center justify-center flex-shrink-0`}>
                  <div className="w-12 h-12 rounded-full bg-primary-80 text-neutral-0 flex items-center justify-center text-[18px] font-semibold">
                    {initialFromName(member.name)}
                  </div>
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <span className="text-[16px] md:text-[18px] font-semibold text-foreground">
                      {member.name}
                    </span>
                    <RoleBadge
                      label={getRoleLabel(member.role)}
                      variant={isLeader ? "primary" : "neutral"}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 md:gap-6 text-[13px] md:text-[14px] text-neutral-60">
                    <div className="flex items-center gap-2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                          stroke="#B0B0B0"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M22 6L12 13L2 6"
                          stroke="#B0B0B0"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="truncate">{member.email || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2.5 4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5H6.89937C7.25806 2.5 7.57651 2.72953 7.68994 3.06981L8.93811 6.81434C9.06926 7.20777 8.89115 7.63776 8.52022 7.82322L6.63917 8.76375C7.55771 10.801 9.19898 12.4423 11.2363 13.3608L12.1768 11.4798C12.3622 11.1088 12.7922 10.9307 13.1857 11.0619L16.9302 12.3101C17.2705 12.4235 17.5 12.7419 17.5 13.1006V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H15C8.09644 17.5 2.5 11.9036 2.5 5V4.16667Z"
                          stroke="#B0B0B0"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{member.phone || "-"}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.teamInfo && (
                      <RoleBadge label={member.teamInfo.name} variant="secondary" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex gap-4 md:gap-6 mb-4 md:mb-6">
              <button
                type="button"
                onClick={() => setTab("organization")}
                className={`cursor-pointer relative pb-2 text-[14px] md:text-[16px] font-semibold transition-colors ${
                  tab === "organization" ? "text-foreground" : "text-neutral-60"
                }`}
              >
                조직정보
                <span
                  className={`absolute left-0 right-0 bottom-0 h-[2px] transition-opacity ${
                    tab === "organization"
                      ? "opacity-100 bg-foreground"
                      : "opacity-0"
                  }`}
                />
              </button>
              {isAdminOrSubAdmin && (
                <button
                  type="button"
                  onClick={() => setTab("manager")}
                  className={`cursor-pointer relative flex items-center gap-1.5 md:gap-2 pb-2 text-[14px] md:text-[16px] font-semibold transition-colors ${
                    tab === "manager" ? "text-foreground" : "text-neutral-60"
                  }`}
                >
                  관리자 정보
                  <svg
                    width="14"
                    height="14"
                    className="md:w-4 md:h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17 8H7C5.89543 8 5 8.89543 5 10V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V10C19 8.89543 18.1046 8 17 8Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 8V6C8 4.34315 9.34315 3 11 3H13C14.6569 3 16 4.34315 16 6V8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    className={`absolute left-0 right-0 bottom-0 h-[2px] transition-opacity ${
                      tab === "manager" ? "opacity-100 bg-foreground" : "opacity-0"
                    }`}
                  />
                </button>
              )}
            </div>
            {tab === "organization" ? (
              <OrganizationContent
                memberId={memberId}
                orgTreeRoot={orgTreeRoot}
                canCreateTeam={canCreateTeam}
                canDeleteTeam={Boolean(canDeleteTeam)}
                teamName={member?.teamInfo?.name}
                teamCreateMode={teamCreateMode}
                setTeamCreateMode={setTeamCreateMode}
                teamNameDraft={teamNameDraft}
                setTeamNameDraft={setTeamNameDraft}
                onCreateTeam={handleCreateTeam}
                onDeleteTeam={handleDeleteTeam}
                isCreatingTeam={createTeam.isPending}
                isDeletingTeam={deleteTeam.isPending}
                teamEditMode={teamEditMode}
                setTeamEditMode={setTeamEditMode}
                teamEditDraft={teamEditDraft}
                setTeamEditDraft={setTeamEditDraft}
                onUpdateTeam={handleUpdateTeam}
                isUpdatingTeam={updateTeam.isPending}
                onMemberClick={onMemberClick}
              />
            ) : isAdminOrSubAdmin ? (
              <ManagerContent
                member={member}
                localNotes={localNotes}
                noteInput={noteInput}
                setNoteInput={setNoteInput}
                onAddNote={handleAddNote}
                onRemoveNote={handleRemoveNote}
                isSubmittingNote={isSubmittingNote}
                profileEditMode={profileEditMode}
                setProfileEditMode={setProfileEditMode}
                hrFormData={hrFormData}
                setHrFormData={setHrFormData}
                onSaveProfile={handleSaveProfile}
                onCancelProfileEdit={handleCancelProfileEdit}
                isSubmittingProfile={isSubmittingProfile}
              />
            ) : (
              <OrganizationContent
                memberId={memberId}
                orgTreeRoot={orgTreeRoot}
                canCreateTeam={canCreateTeam}
                canDeleteTeam={Boolean(canDeleteTeam)}
                teamName={member?.teamInfo?.name}
                teamCreateMode={teamCreateMode}
                setTeamCreateMode={setTeamCreateMode}
                teamNameDraft={teamNameDraft}
                setTeamNameDraft={setTeamNameDraft}
                onCreateTeam={handleCreateTeam}
                onDeleteTeam={handleDeleteTeam}
                isCreatingTeam={createTeam.isPending}
                isDeletingTeam={deleteTeam.isPending}
                teamEditMode={teamEditMode}
                setTeamEditMode={setTeamEditMode}
                teamEditDraft={teamEditDraft}
                setTeamEditDraft={setTeamEditDraft}
                onUpdateTeam={handleUpdateTeam}
                isUpdatingTeam={updateTeam.isPending}
                onMemberClick={onMemberClick}
              />
            )}
          </section>
        </div>

        <footer className="px-4 md:px-6 py-4 border-t border-border flex justify-end gap-2 md:gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="h-[34px] px-3 md:px-4 rounded-[5px] border border-border text-[13px] md:text-[14px] font-semibold text-foreground bg-card dark:bg-neutral-10"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-[34px] px-3 md:px-4 rounded-[5px] bg-neutral-90 text-[13px] md:text-[14px] font-semibold text-neutral-0"
          >
            적용완료
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
