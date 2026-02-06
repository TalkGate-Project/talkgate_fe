"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import Pagination from "@/components/common/Pagination";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import PartnerRegisterModal from "./PartnerRegisterModal";
import { ProjectPartnersService } from "@/services/projectPartners";
import { CouponsService } from "@/services/coupons";
import type { ProjectPartner, ProjectPartnerStatus } from "@/types/projectPartners";
import type { CouponInfo } from "@/types/coupons";

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

/** 복사 아이콘 (Outline duplicate – 두 겹친 사각형), 24x24, stroke #B0B0B0 */
function CopyIcon({ className = "" }: { className?: string }) {
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
      <rect
        x="8"
        y="8"
        width="12"
        height="12"
        rx="1"
        stroke="#B0B0B0"
        strokeWidth="2"
      />
      <path
        d="M6 16V5C6 4.44772 6.44772 4 7 4H16"
        stroke="#B0B0B0"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
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

  // 설명 수정 (API 미연동: 주석 + console.log로 진행 추적)
  const [editingPartnerId, setEditingPartnerId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState("");
  const [savingPartnerId, setSavingPartnerId] = useState<number | null>(null);

  // 쿠폰 정보 (GET /v1/coupons)
  const [coupon, setCoupon] = useState<CouponInfo | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponNotFound, setCouponNotFound] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const fetchCoupon = useCallback(async () => {
    if (!projectId) {
      setCoupon(null);
      setCouponNotFound(false);
      return;
    }
    setCouponLoading(true);
    setCouponNotFound(false);
    try {
      const res = await CouponsService.getProjectCoupon(projectId);
      if (res.ok && res.data?.result === true && res.data?.data) {
        setCoupon(res.data.data);
      } else if (res.status === 404) {
        setCoupon(null);
        setCouponNotFound(true);
      } else {
        setCoupon(null);
      }
    } catch {
      setCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchCoupon();
  }, [fetchCoupon]);

  const handleCopyCouponCode = useCallback(async () => {
    if (!coupon?.code) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      showErrorModal({
        type: "error",
        headline: "복사에 실패했습니다.",
        hideCancel: true,
      });
    }
  }, [coupon?.code]);

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

  // 설명 수정 저장
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
            onConfirm: () => {
              // 성공 모달 닫힐 때 목록 갱신
              fetchPartners();
            }
          });
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
          등록하기
        </button>
      </div>

      <PartnerRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        projectId={projectId ?? ""}
        onSuccess={handlePartnerRegisterSuccess}
      />

      <div className="w-full h-[1px] bg-neutral-30 opacity-70" />

      {/* 쿠폰 정보 영역 - 테이블과 동일한 가로 패딩으로 전체 너비 사용 */}
      <div className="flex flex-col items-stretch gap-[6px] w-full px-4 md:px-7 mt-4 md:mt-[30px] md:mb-[14px]">
        <h2 className="w-full font-semibold text-[16px] leading-[19px] tracking-[0.2px] text-foreground">
          쿠폰 정보
        </h2>
        <p className="hidden md:block w-full font-medium text-[14px] leading-[17px] tracking-[0.2px] text-[#808080]">
          쿠폰 코드를 제공하여 파트너가 프로젝트를 무료로 활성화 하도록 지원할 수 있어요.
        </p>
        <div className="w-full min-w-0 h-10 flex flex-row items-center gap-4 px-6 py-2 bg-[#F8F8F8] dark:bg-neutral-20 rounded-[5px]">
          {couponLoading ? (
            <span className="font-medium text-[14px] leading-[17px] tracking-[-0.02em] text-foreground">
              불러오는 중...
            </span>
          ) : couponNotFound || !coupon ? (
            <span className="font-medium text-[14px] leading-[17px] tracking-[-0.02em] text-neutral-60">
              쿠폰이 없습니다.
            </span>
          ) : (
            <>
              <span className="flex-1 min-w-0 font-medium text-[14px] leading-[17px] tracking-[-0.02em] text-foreground truncate">
                {coupon.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCouponCode}
                className="flex-shrink-0 min-w-6 h-6 flex items-center justify-center rounded-[5px] hover:bg-neutral-20 dark:hover:bg-neutral-30 transition-colors cursor-pointer px-1"
                aria-label={copyState === "copied" ? "복사됨" : "쿠폰 코드 복사"}
              >
                {copyState === "copied" ? (
                  <span className="text-[12px] font-medium text-primary-60 whitespace-nowrap">복사됨</span>
                ) : (
                  <CopyIcon />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 데스크탑 헤더 (md 이상에서만 보임) */}
      <div className="hidden md:flex mx-4 md:mx-7 bg-neutral-20 dark:bg-neutral-20 rounded-[8px] mt-4 h-[40px] items-center pl-4 md:pl-10 pr-4 gap-3">
        <div className="w-[160px] md:w-[240px] flex-shrink-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px]">
          프로젝트명
        </div>
        <div className="flex-1 min-w-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px]">
          설명
        </div>
        <div className="w-[80px] flex-shrink-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px] text-center">
          상태
        </div>
        <div className="w-[88px] md:w-[100px] lg:w-[116px] xl:w-[132px] flex-shrink-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px]" />
      </div>

      {/* 모바일 헤더 (md 미만에서만 보임, 간소화) */}
      <div className="flex md:hidden mx-4 bg-neutral-20 dark:bg-neutral-20 rounded-[8px] mt-4 h-[40px] items-center px-4 gap-3">
        <div className="flex-1 min-w-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px]">
          프로젝트 정보
        </div>
        <div className="w-[80px] flex-shrink-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px] text-center">
          상태
        </div>
        <div className="w-[80px] flex-shrink-0" />
      </div>

      {/* 목록 */}
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
          <div className="flex flex-col">
            {partners.map((item) => (
              <div key={item.id}>
                {/* 모바일 뷰 (md 미만): 이름 밑에 설명 */}
                <div className="flex md:hidden items-center px-4 py-4 gap-3 border-b border-neutral-30/50 last:border-b-0 hover:bg-neutral-5 dark:hover:bg-neutral-15 transition-colors">
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="text-[16px] font-bold text-foreground truncate">
                      {item.partnerProjectName}
                    </div>
                    {editingPartnerId === item.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveDescription();
                            if (e.key === "Escape") handleCancelEditDescription();
                          }}
                          className="flex-1 min-w-0 max-w-[300px] h-[30px] text-[13px] text-foreground bg-white dark:bg-neutral-20 border border-neutral-30 dark:border-neutral-60 rounded-[4px] px-2 outline-none focus:border-primary-50"
                          placeholder="설명 입력"
                          autoFocus
                          disabled={savingPartnerId === item.id}
                        />
                        <button
                          type="button"
                          onClick={handleSaveDescription}
                          disabled={savingPartnerId === item.id}
                          className="h-[30px] px-3 rounded-[4px] bg-neutral-90 text-white text-[12px] font-medium whitespace-nowrap"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditDescription}
                          disabled={savingPartnerId === item.id}
                          className="h-[30px] px-3 rounded-[4px] bg-neutral-20 text-neutral-80 text-[12px] font-medium whitespace-nowrap"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="text-[13px] truncate min-h-[19px]">
                        {item.description || "설명이 없습니다."}
                      </div>
                    )}
                  </div>

                  <div className="w-[80px] flex-shrink-0 flex justify-center">
                    <PartnerStatusBadge status={item.status} />
                  </div>

                  <div className="w-[80px] flex-shrink-0 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartEditDescription(item)}
                      className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-30 transition-colors text-neutral-50"
                      aria-label="설명 수정"
                      disabled={editingPartnerId === item.id}
                    >
                      <EditIcon />
                    </button>
                    <DeleteButton
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id || editingPartnerId === item.id}
                    />
                  </div>
                </div>

                {/* 데스크탑 뷰 (md 이상): 테이블 형태 */}
                <div className="hidden md:flex items-center pl-4 md:pl-10 pr-4 gap-3 py-3 md:py-4 border-b border-neutral-30/50 last:border-b-0 hover:bg-neutral-5 dark:hover:bg-neutral-15 transition-colors">
                  <div className="w-[160px] md:w-[240px] flex-shrink-0 text-[14px] font-medium text-foreground truncate">
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
                  <div className="w-[80px] flex-shrink-0 flex items-center justify-center">
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
              </div>
            ))}
          </div>
        )}

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
