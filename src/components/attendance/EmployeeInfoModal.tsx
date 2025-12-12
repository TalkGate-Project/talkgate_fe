"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AttendanceRecord } from "@/types/attendance";
import DatePicker from "@/components/common/DatePicker";
import MailIcon from "@/components/common/icons/MailIcon";
import PhoneIcon from "@/components/common/icons/PhoneIcon";
import LockClosedDangerIcon from "@/components/common/icons/LockClosedDangerIcon";
import CalendarInlineIcon from "@/components/common/icons/CalendarInlineIcon";
import TrashIcon from "@/components/common/icons/TrashIcon";
import TeamNameBadge from "@/components/common/TeamNameBadge";
import { useMemberDetail } from "@/hooks/useMemberDetail";
import { HRService } from "@/services/hr";

type Props = {
  open: boolean;
  onClose: () => void;
  employee: AttendanceRecord | null;
};

export default function EmployeeInfoModal({ open, onClose, employee }: Props) {
  const queryClient = useQueryClient();
  const memberId = employee?.id ?? null;
  const { member, isLoading } = useMemberDetail(memberId);

  const [formData, setFormData] = useState({
    realName: "",
    birthDate: null as Date | null,
    address: "",
    specialNote: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (member) {
      setFormData({
        realName: member.hrData?.realName ?? "",
        birthDate: member.hrData?.birth ? new Date(member.hrData.birth) : null,
        address: member.hrData?.address ?? "",
        specialNote: "",
      });
    }
  }, [member]);

  const handleSaveHrData = async () => {
    if (!memberId) return;
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await HRService.updateMemberData(memberId, {
        realName: formData.realName,
        birth: formData.birthDate ? format(formData.birthDate, "yyyy-MM-dd") : "",
        address: formData.address,
      });
      await queryClient.invalidateQueries({ queryKey: ["members", "detail", memberId] });
      alert("관리자 정보가 저장되었습니다.");
      onClose();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!memberId) return;
    if (!formData.specialNote.trim()) {
      alert("특이사항 내용을 입력해주세요.");
      return;
    }
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await HRService.addMemberNote(memberId, {
        note: formData.specialNote,
      });
      await queryClient.invalidateQueries({ queryKey: ["members", "detail", memberId] });
      setFormData((prev) => ({ ...prev, specialNote: "" }));
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "특이사항 추가에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveNote = async (noteId: number) => {
    if (!memberId) return;
    if (!confirm("이 특이사항을 삭제하시겠습니까?")) return;
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await HRService.removeMemberNote(memberId, noteId);
      await queryClient.invalidateQueries({ queryKey: ["members", "detail", memberId] });
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "특이사항 삭제에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open || !employee || typeof document === "undefined") return null;

  const displayData = member
    ? {
        name: member.name,
        position: member.organizationTree?.role === "leader" ? "팀장" : "팀원", // Simple mapping, adjust as needed
        email: member.email,
        phone: member.phone,
        teamName: member.organizationTree?.teamName,
        profileImageUrl: member.profileImageUrl,
      }
    : {
        name: employee.name,
        position: employee.position,
        email: "",
        phone: "",
        teamName: employee.team,
        profileImageUrl: null,
      };

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/30 dark:bg-[#000000CC]" onClick={onClose} />
      <div
        className="absolute left-1/2 top-1/2 bg-card dark:bg-neutral-10 rounded-[14px] overflow-hidden flex flex-col"
        style={{
          width: 904,
          height: 546,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* 헤더 */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="text-[18px] font-semibold text-foreground">
            직원정보
          </div>
          <button
            onClick={onClose}
            aria-label="close"
            className="cursor-pointer w-6 h-6 grid place-items-center rounded hover:bg-neutral-10"
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
                stroke="var(--neutral-50)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* 스크롤 가능한 콘텐츠 */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-60" />
            </div>
          ) : (
            <div className="px-6 py-4 space-y-[30px]">
              {/* 기본 정보 */}
              <div>
                <div className="text-[16px] font-semibold text-foreground border-b border-border pb-3 mb-5">
                  기본 정보
                </div>
                <div className="bg-neutral-10 dark:bg-neutral-25 rounded-[12px] p-4">
                  <div className="flex items-start gap-4">
                    {/* 아바타 */}
                    <div className="w-12 h-12 bg-neutral-60 rounded-full flex items-center justify-center overflow-hidden">
                      {displayData.profileImageUrl ? (
                        <img
                          src={displayData.profileImageUrl}
                          alt={displayData.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-neutral-0 text-[18px] font-semibold">
                          {displayData.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* 직원 상세 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[16px] font-semibold text-foreground">
                          {displayData.name}
                        </span>
                        <div
                          className="w-px h-4 bg-neutral-60/50"
                          aria-hidden
                        />
                        <span className="px-3 py-1 bg-neutral-20 rounded-[30px] text-[12px] font-medium text-neutral-70">
                          {displayData.position}
                        </span>
                      </div>

                      {/* 연락처 정보 - 한 줄로 표시 */}
                      <div className="flex items-center gap-6 mb-3">
                        {displayData.email && (
                          <div className="flex items-center gap-2">
                            <MailIcon />
                            <span className="text-[14px] text-neutral-60">
                              {displayData.email}
                            </span>
                          </div>
                        )}

                        {displayData.phone && (
                          <div className="flex items-center gap-2">
                            <PhoneIcon />
                            <span className="text-[14px] text-neutral-60">
                              {displayData.phone}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 지점 태그 (팀명 표시) */}
                      {displayData.teamName && (
                        <div className="flex gap-2">
                          <TeamNameBadge label={displayData.teamName} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <LockClosedDangerIcon />
                <span className="text-[16px] font-semibold text-danger-40">
                  관리자 정보
                </span>
              </div>

              {/* 관리자 정보, 팀 변경 이력, 특이사항을 감싸는 래퍼 */}
              <div className="border border-border rounded-[12px] p-4 space-y-6 dark:bg-neutral-25">
                {/* 관리자 정보 */}
                <div>
                  <div className="space-y-4">
                    {/* 실명과 생년월일 - 한 줄에 2개 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[14px] text-neutral-60 mb-2">
                          실명
                        </label>
                        <input
                          type="text"
                          value={formData.realName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              realName: e.target.value,
                            }))
                          }
                          className="w-full h-[34px] px-3 border border-border rounded-[5px] text-[14px] text-foreground bg-card"
                        />
                      </div>

                      <div>
                        <label className="block text-[14px] text-neutral-60 mb-2">
                          생년월일
                        </label>
                        <div className="relative cursor-pointer">
                          <DatePicker
                            value={formData.birthDate}
                            onChange={(d) =>
                              setFormData((prev) => ({ ...prev, birthDate: d }))
                            }
                            minDate={new Date(1950, 0, 1)}
                            className="cursor-pointer pr-10"
                          />
                          <CalendarInlineIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* 주소 */}
                    <div>
                      <label className="block text-[14px] text-neutral-60 mb-2">
                        주소
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                          className="flex-1 h-[34px] px-3 border border-border rounded-[5px] text-[14px] text-foreground bg-card"
                        />
                        <button
                          className="cursor-pointer h-[34px] px-3 bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold"
                          onClick={handleSaveHrData}
                          disabled={isSubmitting}
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 팀 변경 이력 */}
                <div>
                  <div className="text-[16px] font-semibold text-foreground leading-[1]">
                    팀 변경 이력
                  </div>

                  {/* 구분선 */}
                  <div className="border-t border-border my-3" />

                  <div className="space-y-3">
                    {member?.teamChangeLogs &&
                    member.teamChangeLogs.length > 0 ? (
                      member.teamChangeLogs.map((log) => (
                        <div
                          key={log.id}
                          className="bg-neutral-10 dark:bg-neutral-25 rounded-[12px] p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-[14px] text-neutral-60">
                                {new Date(log.createdAt).toLocaleDateString()}
                              </span>
                              <span className="px-3 py-1 bg-primary-10 rounded-[30px] text-[12px] font-medium text-primary-80">
                                {log.newTeamName}
                              </span>
                              <span className="text-[14px] text-foreground">
                                {log.newTeamLeaderName} (팀장)
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[14px] text-neutral-60 text-center py-4">
                        팀 변경 이력이 없습니다.
                      </div>
                    )}
                  </div>
                </div>

                {/* 특이사항 */}
                <div>
                  <div className="text-[16px] font-semibold text-foreground mb-4 leading-[1]">
                    특이사항
                  </div>

                  {/* 구분선 */}
                  <div className="border-t border-border my-3" />

                  {/* 기존 특이사항 */}
                  {member?.hrNotes && member.hrNotes.length > 0 ? (
                    member.hrNotes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-neutral-10 dark:bg-neutral-25 rounded-[12px] p-4 mb-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] text-foreground">
                              {/* 작성자 이름이 API에 없으면 하드코딩하거나 생략 */}
                              관리자
                            </span>
                            <span className="text-[14px] text-neutral-60">
                              {new Date(note.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <button 
                            className="w-5 h-5 cursor-pointer"
                            onClick={() => handleRemoveNote(note.id)}
                            disabled={isSubmitting}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                        <p className="text-[14px] text-foreground">
                          {note.note}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-[14px] text-neutral-60 text-center py-4 mb-4">
                      등록된 특이사항이 없습니다.
                    </div>
                  )}

                  {/* 새 특이사항 입력 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="특이사항을 입력하세요"
                      value={formData.specialNote}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          specialNote: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                          handleAddNote();
                        }
                      }}
                      className="flex-1 h-[34px] px-3 border border-border rounded-[5px] text-[14px] text-foreground placeholder:text-neutral-60 bg-card"
                    />
                    <button 
                      className="cursor-pointer h-[34px] px-3 bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold"
                      onClick={handleAddNote}
                      disabled={isSubmitting}
                    >
                      저장
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3 flex justify-end gap-3 border-t border-border flex-shrink-0">
          <button
            className="cursor-pointer h-[34px] px-4 rounded-[5px] border border-border text-foreground bg-card text-[14px]"
            onClick={() => {
              if (member) {
                setFormData({
                  realName: member.hrData?.realName ?? "",
                  birthDate: member.hrData?.birth
                    ? new Date(member.hrData.birth)
                    : null,
                  address: member.hrData?.address ?? "",
                  specialNote: "",
                });
              }
            }}
          >
            초기화
          </button>
          <button
            className="cursor-pointer h-[34px] px-4 rounded-[5px] bg-neutral-90 text-neutral-0 text-[14px]"
            onClick={onClose}
          >
            적용완료
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
