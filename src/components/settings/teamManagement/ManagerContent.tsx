"use client";

import DatePicker from "@/components/common/DatePicker";
import CalendarInlineIcon from "@/components/common/icons/CalendarInlineIcon";
import AsyncButton from "@/components/common/AsyncButton";
import RoleBadge from "./RoleBadge";
import { formatDateKR, formatDateTimeKR } from "@/utils/datetime";
import { getRoleLabel } from "./memberInfoUtils";
import type { MemberDetail, HrNote, TeamChangeLog } from "@/types/members";

type HrFormData = {
  realName: string;
  birthDate: Date | null;
  address: string;
};

type Props = {
  member: MemberDetail;
  localNotes: HrNote[];
  noteInput: string;
  setNoteInput: (value: string) => void;
  onAddNote: () => Promise<void>;
  onRemoveNote: (noteId: number) => void;
  isSubmittingNote: boolean;
  profileEditMode: boolean;
  setProfileEditMode: (mode: boolean) => void;
  hrFormData: HrFormData;
  setHrFormData: React.Dispatch<React.SetStateAction<HrFormData>>;
  onSaveProfile: () => Promise<void>;
  onCancelProfileEdit: () => void;
  isSubmittingProfile: boolean;
};

export default function ManagerContent({
  member,
  localNotes,
  noteInput,
  setNoteInput,
  onAddNote,
  onRemoveNote,
  isSubmittingNote,
  profileEditMode,
  setProfileEditMode,
  hrFormData,
  setHrFormData,
  onSaveProfile,
  onCancelProfileEdit,
  isSubmittingProfile,
}: Props) {
  return (
    <div className="border border-border rounded-[12px] p-4 md:p-7 dark:bg-neutral-10">
      {/* 프로필 정보 Section */}
      <section className="pb-4 md:pb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] md:text-[16px] font-semibold text-foreground">
            프로필 정보
          </span>
          {profileEditMode ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancelProfileEdit}
                disabled={isSubmittingProfile}
                className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-border text-[13px] md:text-[14px] font-semibold text-foreground bg-card disabled:opacity-60"
              >
                취소
              </button>
              <AsyncButton
                variant="secondary"
                size="sm"
                onClick={onSaveProfile}
                loading={isSubmittingProfile}
                className="bg-neutral-90 dark:bg-neutral-80 text-white dark:text-neutral-0 hover:bg-neutral-80 dark:hover:bg-neutral-70 text-[13px] md:text-[14px]"
              >
                저장
              </AsyncButton>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setProfileEditMode(true)}
              className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-border text-[13px] md:text-[14px] font-semibold text-foreground bg-card"
            >
              수정
            </button>
          )}
        </div>
        <div className="h-[1px] bg-border opacity-50 mb-4" />
        <div className="bg-neutral-10 dark:bg-neutral-25 rounded-[12px] p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 md:gap-x-4 md:gap-y-2">
            {/* 실명 */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-0">
              <span className="text-[13px] md:text-[14px] text-neutral-60 leading-[17px] md:leading-6 md:w-[100px]">
                실명
              </span>
              {profileEditMode ? (
                <input
                  type="text"
                  value={hrFormData.realName}
                  onChange={(e) =>
                    setHrFormData((prev) => ({
                      ...prev,
                      realName: e.target.value,
                    }))
                  }
                  className="flex-1 h-[34px] px-3 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[13px] md:text-[14px] text-foreground dark:bg-neutral-20"
                />
              ) : (
                <span className="text-[13px] md:text-[14px] font-medium text-foreground leading-[17px] md:leading-6">
                  {member?.hrData?.realName || member?.name || "-"}
                </span>
              )}
            </div>
            {/* 직책 (데스크탑만) */}
            <div className="hidden md:flex items-center">
              <span className="w-[100px] text-[14px] text-neutral-60 leading-6">
                직책
              </span>
              <span className="text-[14px] font-medium text-foreground leading-6">
                {getRoleLabel(member?.role ?? "")}
              </span>
            </div>
            {/* 생년월일 */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-0">
              <span className="text-[13px] md:text-[14px] text-neutral-60 leading-[17px] md:leading-6 md:w-[100px]">
                생년월일
              </span>
              {profileEditMode ? (
                <div className="relative flex-1">
                  <DatePicker
                    value={hrFormData.birthDate}
                    onChange={(d) =>
                      setHrFormData((prev) => ({ ...prev, birthDate: d }))
                    }
                    minDate={new Date(1950, 0, 1)}
                    className="cursor-pointer pr-10 h-[34px] text-[13px] md:text-[14px]"
                  />
                  <CalendarInlineIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" />
                </div>
              ) : (
                <span className="text-[13px] md:text-[14px] font-medium text-foreground leading-[17px] md:leading-6">
                  {member?.hrData?.birth || "-"}
                </span>
              )}
            </div>
            {/* 입사일 (데스크탑만) */}
            <div className="hidden md:flex items-center">
              <span className="w-[100px] text-[14px] text-neutral-60 leading-6">
                입사일
              </span>
              <span className="text-[14px] font-medium text-foreground leading-6">
                {member?.createdAt ? formatDateKR(member.createdAt) : "-"}
              </span>
            </div>
            {/* 주소 */}
            <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row md:items-center gap-2 md:gap-0">
              <span className="text-[13px] md:text-[14px] text-neutral-60 leading-[17px] md:leading-6 md:w-[100px]">
                주소
              </span>
              {profileEditMode ? (
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    value={hrFormData.address}
                    onChange={(e) =>
                      setHrFormData((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className="flex-1 h-[34px] px-3 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[13px] md:text-[14px] text-foreground dark:bg-neutral-20"
                  />
                  <button
                    type="button"
                    onClick={onSaveProfile}
                    disabled={isSubmittingProfile}
                    className="h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-white dark:text-neutral-0 text-[13px] md:text-[14px] font-semibold leading-[17px] disabled:opacity-60 whitespace-nowrap"
                  >
                    저장
                  </button>
                </div>
              ) : (
                <span className="flex-1 text-[13px] md:text-[14px] font-medium text-foreground leading-[17px] md:leading-6">
                  {member?.hrData?.address || "-"}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 팀 변경 이력 Section */}
      <section className="pb-4 md:pb-6">
        <div className="mb-3">
          <span className="text-[14px] md:text-[16px] font-semibold text-foreground">
            팀 변경 이력
          </span>
        </div>
        <div className="h-[1px] bg-border opacity-50 mb-4" />
        <div className="space-y-3">
          {(member?.teamChangeLogs ?? []).length > 0 ? (
            member?.teamChangeLogs.map((history) => (
              <div
                key={history.id}
                className="bg-neutral-10 dark:bg-neutral-25 rounded-[8px] md:rounded-[12px] p-3 md:p-4"
              >
                {/* 모바일 레이아웃 */}
                <div className="md:hidden flex flex-col gap-3">
                  {/* 날짜 */}
                  <div className="text-[13px] text-neutral-60">
                    {formatDateKR(history.createdAt)}
                  </div>
                  {/* 팀 정보 영역 */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1.5">
                      <RoleBadge
                        label={history.previousTeamName || "미배정"}
                        variant="neutral"
                      />
                    </div>
                    {history.newTeamName && (
                      <>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="flex-shrink-0"
                        >
                          <path
                            d="M9 18L15 12L9 6"
                            stroke="#B0B0B0"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex flex-col gap-1.5">
                          <RoleBadge label={history.newTeamName} variant="primary" />
                        </div>
                      </>
                    )}
                  </div>
                  {/* 변경 타입 */}
                  <div className="text-[13px] text-neutral-60">
                    {history.type === "teamMove" ? "팀이동" : history.type === "teamDelete" ? "팀삭제" : history.type === "teamUpdate" ? "팀명변경" : history.type}
                  </div>
                </div>
                {/* 데스크탑 레이아웃 */}
                <div className="hidden md:flex items-center gap-4">
                  <span className="text-[14px] text-neutral-60 whitespace-nowrap">
                    {formatDateKR(history.createdAt)}
                  </span>
                  <RoleBadge
                    label={history.previousTeamName || "미배정"}
                    variant="neutral"
                  />
                  {history.newTeamName && (
                    <>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex-shrink-0"
                      >
                        <path
                          d="M9 18L15 12L9 6"
                          stroke="#B0B0B0"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <RoleBadge label={history.newTeamName} variant="primary" />
                    </>
                  )}
                  <span className="ml-auto text-[14px] text-neutral-60 whitespace-nowrap">
                    {history.type === "teamMove" ? "팀이동" : history.type === "teamDelete" ? "팀삭제" : history.type === "teamUpdate" ? "팀명변경" : history.type}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 bg-neutral-10 dark:bg-neutral-25 rounded-[12px] text-[13px] md:text-[14px] text-neutral-60">
              팀 변경 이력이 없습니다.
            </div>
          )}
        </div>
      </section>

      {/* 특이사항 Section */}
      <section>
        <div className="mb-3">
          <span className="text-[14px] md:text-[16px] font-semibold text-foreground">
            특이사항
          </span>
        </div>
        <div className="h-[1px] bg-border opacity-50 mb-4" />
        {localNotes.length > 0 ? (
          <div className="space-y-3 mb-4">
            {localNotes.map((note) => (
              <div
                key={note.id}
                className="bg-neutral-10 dark:bg-neutral-25 rounded-[8px] md:rounded-[12px] p-3 md:p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[13px] md:text-[14px] text-foreground">
                    <span className="text-neutral-60">
                      {formatDateTimeKR(note.createdAt)}
                    </span>
                  </div>
                  <button
                    className="cursor-pointer w-5 h-5 text-neutral-50 hover:text-neutral-60 flex-shrink-0"
                    onClick={() => onRemoveNote(note.id)}
                    disabled={isSubmittingNote}
                    aria-label="특이사항 삭제"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15.832 5.83333L15.1093 15.9521C15.047 16.8243 14.3212 17.5 13.4468 17.5H6.55056C5.67616 17.5 4.95043 16.8243 4.88813 15.9521L4.16536 5.83333M8.33203 9.16667V14.1667M11.6654 9.16667V14.1667M12.4987 5.83333V3.33333C12.4987 2.8731 12.1256 2.5 11.6654 2.5H8.33203C7.87179 2.5 7.4987 2.8731 7.4987 3.33333V5.83333M3.33203 5.83333H16.6654"
                        stroke="#B0B0B0"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-[13px] md:text-[14px] text-foreground">{note.note}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-3 bg-neutral-10 rounded-[12px] text-[13px] md:text-[14px] text-neutral-60 mb-4">
            등록된 특이사항이 없습니다.
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="특이사항을 입력하세요"
            className="flex-1 h-[34px] px-3 border border-border rounded-[5px] text-[13px] md:text-[14px] text-foreground placeholder:text-neutral-60 dark:bg-neutral-10"
          />
          <AsyncButton
            variant="secondary"
            size="sm"
            onClick={onAddNote}
            loading={isSubmittingNote}
            className="bg-neutral-90 dark:bg-neutral-80 text-white dark:text-neutral-0 hover:bg-neutral-80 dark:hover:bg-neutral-70 text-[13px] md:text-[14px] h-[34px] px-3"
          >
            저장
          </AsyncButton>
        </div>
      </section>
    </div>
  );
}

