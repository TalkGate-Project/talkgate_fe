"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import Pagination from "@/components/common/Pagination";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import PartnerRegisterModal from "./PartnerRegisterModal";
import { ProjectPartnersService } from "@/services/projectPartners";
import type { ProjectPartner, ProjectPartnerStatus } from "@/types/projectPartners";

/** 상태 칩: 수락(Primary-10/80), 대기(Warning-10/60), 거절(Error-10/40) */
function PartnerStatusBadge({ status }: { status: ProjectPartnerStatus }) {
  const config: Record<
    ProjectPartnerStatus,
    { label: string; bg: string; text: string }
  > = {
    approved: { label: "수락", bg: "#D6FAE8", text: "#00B55B" },
    pending: { label: "대기", bg: "#FFF5D5", text: "#976400" },
    rejected: { label: "거절", bg: "#FFEBEB", text: "#D83232" },
  };
  const { label, bg, text } = config[status] ?? {
    label: status,
    bg: "#F5F5F5",
    text: "#595959",
  };
  return (
    <span
      className="inline-flex items-center justify-center rounded-[30px] py-1 px-3 text-[12px] font-medium leading-[14px] whitespace-nowrap"
      style={{ background: bg }}
      aria-label={label}
    >
      <span style={{ color: text, opacity: 0.8 }}>{label}</span>
    </span>
  );
}

/** 수정 버튼 아이콘 (stroke #B0B0B0) */
function EditIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M11 5H6C4.89543 5 4 5.89543 4 7V18C4 19.1046 4.89543 20 6 20H17C18.1046 20 19 19.1046 19 18V13M17.5858 3.58579C18.3668 2.80474 19.6332 2.80474 20.4142 3.58579C21.1953 4.36683 21.1953 5.63316 20.4142 6.41421L11.8284 15H9L9 12.1716L17.5858 3.58579Z"
        stroke="#B0B0B0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 모바일 전용: 설명 터치 시 툴팁용 정보 아이콘 (anchorRef는 열린 행의 버튼을 가리키도록 부모에서 설정) */
function DescriptionInfoIcon({
  description,
  isOpen,
  onToggle,
  anchorRef,
  setAnchorEl,
}: {
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  setAnchorEl: (el: HTMLButtonElement | null) => void;
}) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (!isOpen || !anchorRef.current) {
      setStyle({});
      return;
    }
    const rect = anchorRef.current.getBoundingClientRect();
    const w = Math.min(280, window.innerWidth - 24);
    setStyle({
      position: "fixed",
      left: Math.max(12, Math.min(rect.left, window.innerWidth - w - 12)),
      top: rect.bottom + 8,
      zIndex: 9999,
      width: `${w}px`,
    });
  }, [isOpen, anchorRef]);

  return (
    <>
      <button
        ref={setAnchorEl}
        type="button"
        onClick={onToggle}
        className="cursor-pointer w-8 h-8 min-w-8 min-h-8 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-30 transition-colors text-neutral-60 dark:text-neutral-50 touch-manipulation"
        aria-label="설명 보기"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 6.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="12.5" r="1" fill="currentColor" />
        </svg>
      </button>
      {typeof window !== "undefined" &&
        isOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              aria-hidden
              onClick={onToggle}
            />
            <div
              role="tooltip"
              className="z-[9999] px-3 py-2.5 bg-neutral-90 dark:bg-neutral-10 text-white dark:text-neutral-90 text-[13px] rounded-lg shadow-xl whitespace-normal break-words"
              style={style}
            >
              {description || "설명 없음"}
            </div>
          </>,
          document.body
        )}
    </>
  );
}

/** 삭제 버튼 – 발신번호 등록 페이지와 동일한 32px 버튼 + 24px 아이콘 */
function DeleteButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer w-8 h-8 min-w-8 min-h-8 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="삭제"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
          stroke="currentColor"
          className="text-neutral-60 dark:text-neutral-50"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

const PAGE_SIZE = 10;

export default function PartnerRegistrationSettings() {
  const [projectId] = useSelectedProjectId();
  const [page, setPage] = useState(1);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [partners, setPartners] = useState<ProjectPartner[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openDescriptionId, setOpenDescriptionId] = useState<number | null>(null);
  const descriptionAnchorRef = useRef<HTMLButtonElement | null>(null);

  // 설명 수정 (API 미연동: 주석 + console.log로 진행 추적)
  const [editingPartnerId, setEditingPartnerId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState("");
  const [savingPartnerId, setSavingPartnerId] = useState<number | null>(null);

  const fetchPartners = useCallback(async () => {
    if (!projectId) {
      setPartners([]);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await ProjectPartnersService.list(
        { page, limit: PAGE_SIZE },
        { "x-project-id": projectId }
      );
      const data = res.data?.data;
      if (data) {
        setPartners(data.list ?? []);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
      } else {
        setPartners([]);
        setTotalPages(1);
      }
    } catch {
      setPartners([]);
      setTotalPages(1);
      showErrorModal({
        type: "error",
        headline: "파트너 목록을 불러오는데 실패했습니다.",
        hideCancel: true,
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, page]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // 설명 수정 시작
  const handleStartEditDescription = (item: ProjectPartner) => {
    setEditingPartnerId(item.id);
    setEditingDescription(item.description ?? "");
  };

  // 설명 수정 취소
  const handleCancelEditDescription = () => {
    setEditingPartnerId(null);
    setEditingDescription("");
  };

  // 설명 수정 저장 (실제 요청은 API 미제공으로 주석 처리, console.log로 진행 추적)
  const handleSaveDescription = async () => {
    if (!projectId || editingPartnerId == null) return;

    const description = editingDescription.trim();
    setSavingPartnerId(editingPartnerId);

    try {
      console.log("[파트너 설명 수정] 요청 예정", {
        projectId,
        partnerId: editingPartnerId,
        description,
      });

      // TODO: API 제공 후 연동
      // const headers = { "x-project-id": projectId };
      // await ProjectPartnersService.update(editingPartnerId, { description }, headers);

      setPartners((prev) =>
        prev.map((p) =>
          p.id === editingPartnerId ? { ...p, description } : p
        )
      );
      setEditingPartnerId(null);
      setEditingDescription("");
      console.log("[파트너 설명 수정] 로컬 반영 완료", { partnerId: editingPartnerId });
      showErrorModal({
        type: "success",
        headline: "설명이 수정되었습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } catch (err) {
      console.error("[파트너 설명 수정] 실패", err);
      showErrorModal({
        type: "error",
        headline: "설명 수정에 실패했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setSavingPartnerId(null);
    }
  };

  const handleDelete = (item: ProjectPartner) => {
    showConfirmModal({
      title: "파트너 삭제",
      message: `"${item.partnerProjectName}"을(를) 삭제하시겠습니까?`,
      confirmText: "삭제",
      onConfirm: async () => {
        if (!projectId) return;
        setDeletingId(item.id);
        try {
          await ProjectPartnersService.remove(item.id, { "x-project-id": projectId });
          showErrorModal({
            type: "success",
            headline: "삭제되었습니다.",
            hideCancel: true,
            confirmText: "확인",
          });
          await fetchPartners();
        } catch {
          showErrorModal({
            type: "error",
            headline: "삭제에 실패했습니다.",
            hideCancel: true,
          });
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleRegisterCompany = () => {
    setIsRegisterModalOpen(true);
  };

  const handlePartnerRegisterSuccess = () => {
    fetchPartners();
  };

  return (
    <div className="bg-card rounded-[14px] lg:rounded-[14px] rounded-t-none lg:rounded-t-[14px] pb-4 md:pb-7 flex flex-col">
      {/* 헤더: 제목 + 업체등록 버튼 */}
      <div className="flex items-center justify-between px-4 md:px-7 h-[64px] md:h-[76px]">
        <h1 className="text-[20px] md:text-[24px] font-bold text-foreground leading-[1]">
          파트너등록
        </h1>
        <button
          type="button"
          onClick={handleRegisterCompany}
          className="cursor-pointer h-[34px] px-3 md:px-4 rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-[13px] md:text-[14px] font-semibold text-neutral-0 hover:opacity-90 flex-shrink-0 whitespace-nowrap"
        >
          업체등록
        </button>
      </div>

      <PartnerRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        projectId={projectId ?? ""}
        onSuccess={handlePartnerRegisterSuccess}
      />

      <div className="w-full h-[1px] bg-neutral-30 opacity-70" />

      {/* 테이블 헤더 (데스크탑) – 프로젝트명, 비고, 상태, 액션. 열 너비·갭·패딩을 본문과 동일하게 */}
      <div className="hidden md:flex mx-4 md:mx-7 bg-neutral-20 dark:bg-neutral-20 rounded-[8px] mt-4 h-[40px] items-center pl-4 md:pl-10 pr-4 gap-3">
        <div className="w-[120px] md:w-[140px] flex-shrink-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px]">
          프로젝트명
        </div>
        <div className="flex-1 min-w-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px]">
          설명
        </div>
        <div className="w-[72px] flex-shrink-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px]">
          상태
        </div>
        <div className="w-[88px] md:w-[100px] lg:w-[116px] xl:w-[132px] flex-shrink-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px]" />
      </div>

      {/* 목록 – 헤더와 동일한 열 너비·갭·패딩으로 정렬 */}
      <div className="px-4 md:px-7 pt-2 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[14px] text-neutral-60">
            불러오는 중...
          </div>
        ) : partners.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-[14px] text-neutral-60">
            등록된 파트너가 없습니다.
          </div>
        ) : (
          <>
            {/* 모바일: 카드형 목록 – 보기 1줄 / 수정 시 설명 입력 + 취소·저장 */}
            <div className="md:hidden space-y-2">
              {partners.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-[8px] border border-neutral-30 dark:border-neutral-30 bg-card dark:bg-neutral-10 px-4 ${
                    editingPartnerId === item.id ? "py-3 flex flex-col gap-3" : "py-2.5 flex items-center gap-2 min-h-[44px]"
                  }`}
                >
                  {editingPartnerId === item.id ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[14px] font-semibold text-foreground truncate flex-1 min-w-0">
                          {item.partnerProjectName}
                        </span>
                        <PartnerStatusBadge status={item.status} />
                      </div>
                      <label className="block">
                        <span className="text-[13px] font-medium text-neutral-60 dark:text-neutral-50 mb-1 block">설명</span>
                        <textarea
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") handleCancelEditDescription();
                          }}
                          placeholder="설명을 입력하세요"
                          rows={3}
                          disabled={savingPartnerId === item.id}
                          className="w-full min-h-[72px] px-3 py-2 text-[14px] text-foreground bg-neutral-10 dark:bg-neutral-20 border border-neutral-30 dark:border-neutral-60 rounded-[5px] outline-none focus:border-primary-50 resize-y disabled:opacity-50"
                        />
                      </label>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEditDescription}
                          disabled={savingPartnerId === item.id}
                          className="cursor-pointer min-w-[56px] h-[34px] flex items-center justify-center rounded-[5px] bg-white dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 text-[14px] font-semibold text-ink dark:text-neutral-80 hover:bg-neutral-10 transition-colors disabled:opacity-50"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDescription}
                          disabled={savingPartnerId === item.id}
                          className="cursor-pointer min-w-[56px] h-[34px] flex items-center justify-center rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-[14px] font-semibold text-neutral-0 hover:opacity-90 disabled:opacity-50"
                        >
                          저장
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-[14px] font-semibold text-foreground truncate flex-1 min-w-0">
                        {item.partnerProjectName}
                      </span>
                      <span className="flex-shrink-0">
                        <PartnerStatusBadge status={item.status} />
                      </span>
                      <span className="flex-shrink-0">
                        <DescriptionInfoIcon
                          description={item.description ?? ""}
                          isOpen={openDescriptionId === item.id}
                          onToggle={() =>
                            setOpenDescriptionId((prev) => (prev === item.id ? null : item.id))
                          }
                          anchorRef={descriptionAnchorRef}
                          setAnchorEl={(el) => {
                            if (openDescriptionId === item.id) descriptionAnchorRef.current = el;
                          }}
                        />
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartEditDescription(item)}
                        className="cursor-pointer w-8 h-8 min-w-8 min-h-8 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-30 transition-colors flex-shrink-0"
                        aria-label="설명 수정"
                      >
                        <EditIcon />
                      </button>
                      <DeleteButton
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* 데스크톱: 테이블형 목록 – 설명 셀 인라인 수정 (customer-api 패턴) */}
            <div className="hidden md:block space-y-0">
              {partners.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center pl-4 md:pl-10 pr-4 gap-3 py-3 md:py-4 border-b border-neutral-30/50 last:border-b-0"
                >
                  <div className="w-[120px] md:w-[140px] flex-shrink-0 text-[14px] font-medium text-foreground truncate">
                    {item.partnerProjectName}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-2 md:gap-3">
                    {editingPartnerId === item.id ? (
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap w-full">
                        <input
                          type="text"
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveDescription();
                            if (e.key === "Escape") handleCancelEditDescription();
                          }}
                          className="flex-1 min-w-0 max-w-[280px] h-[34px] text-[14px] font-medium text-foreground bg-neutral-10 dark:bg-neutral-20 border border-neutral-30 dark:border-neutral-60 rounded-[5px] px-3 outline-none focus:border-primary-50 disabled:opacity-50"
                          placeholder="설명"
                          autoFocus
                          disabled={savingPartnerId === item.id}
                        />
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={handleCancelEditDescription}
                            disabled={savingPartnerId === item.id}
                            className="cursor-pointer min-w-[48px] h-[34px] flex items-center justify-center rounded-[5px] bg-white dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 text-[14px] font-semibold text-ink dark:text-neutral-80 hover:bg-neutral-10 transition-colors disabled:opacity-50"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveDescription}
                            disabled={savingPartnerId === item.id}
                            className="cursor-pointer min-w-[48px] h-[34px] flex items-center justify-center rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-[14px] font-semibold text-neutral-0 hover:opacity-90 disabled:opacity-50"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[14px] text-neutral-70 truncate block min-w-0">
                        {item.description || "—"}
                      </span>
                    )}
                  </div>
                  <div className="w-[72px] flex-shrink-0 flex items-center">
                    <PartnerStatusBadge status={item.status} />
                  </div>
                  <div className="w-[88px] md:w-[100px] lg:w-[116px] xl:w-[132px] flex-shrink-0 flex items-center justify-end gap-2 md:gap-12">
                    {editingPartnerId !== item.id && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEditDescription(item)}
                          className="cursor-pointer w-8 h-8 min-w-8 min-h-8 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-30 transition-colors"
                          aria-label="설명 수정"
                        >
                          <EditIcon />
                        </button>
                        <DeleteButton
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 페이지네이션 – 데이터 없을 때도 표시, 기본 1페이지 */}
        <div className="flex justify-center mt-6">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
