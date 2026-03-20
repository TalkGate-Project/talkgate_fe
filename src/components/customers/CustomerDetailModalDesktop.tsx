"use client";

import { useState, useRef, useLayoutEffect, useCallback } from "react";
import BaseModal from "@/components/common/BaseModal";
import { useCustomerDetail } from "./detail/useCustomerDetail";
import BasicTab from "./detail/BasicTab";
import DataTab from "./detail/DataTab";
import SalesTab from "./detail/SalesTab";
import AssignmentTab from "./detail/AssignmentTab";
import ConsultationPanel from "./detail/ConsultationPanel";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { useMyMember } from "@/hooks/useMyMember";
import { useCurrentProjectDetail } from "@/hooks/useCurrentProjectDetail";
import { CustomersService } from "@/services/customers";
import { getSelectedProjectId } from "@/lib/project";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal as showErrorModalEvent } from "@/lib/errorModalEvents";

export type CustomerDetailModalProps = {
  open: boolean;
  onClose: () => void;
  customerId: number | null;
  onCustomerUpdated?: () => void;
  onCustomerDeleted?: (deletedCustomerId: number) => void;
  /** @deprecated use onCustomerUpdated */
  onRefetch?: () => void;
  /** 상세 모달에서 직원배정 클릭 시 (고객 1명 배정용) */
  onAssignClick?: () => void;
};

export default function CustomerDetailModalDesktop({
  open,
  onClose,
  customerId,
  onCustomerUpdated,
  onCustomerDeleted,
  onRefetch,
  onAssignClick,
}: CustomerDetailModalProps) {
  const [tab, setTab] = useState<"basic" | "data" | "sales" | "assignment">("basic");
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [leftHeight, setLeftHeight] = useState<number | null>(null);
  const hasPendingListRefreshRef = useRef(false);

  // 왼쪽 패널 높이 측정
  useLayoutEffect(() => {
    if (!leftPanelRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setLeftHeight(entry.contentRect.height);
      }
    });

    observer.observe(leftPanelRef.current);
    return () => observer.disconnect();
  }, []);

  const markListRefreshPending = useCallback(() => {
    hasPendingListRefreshRef.current = true;
  }, []);

  const {
    loading,
    detail,
    categories,
    messengersLocal,
    form,
    setForm,
    hasChanges,
    validation,
    actions,
  } = useCustomerDetail(customerId, open, {
    onFetchErrorClose: onClose,
  });

  // 현재 사용자의 멤버 정보 가져오기 (admin/subAdmin/leader만 직원배정 버튼 표시)
  const projectId = getSelectedProjectId();
  const { member: myMember, role, isAdminOrSubAdmin } = useMyMember(projectId);
  const myMemberId = myMember?.id;
  const canAssignCustomer =
    role === "admin" || role === "subAdmin" || role === "leader";
  const showAssignButton = Boolean(onAssignClick) && canAssignCustomer;
  const { project } = useCurrentProjectDetail();
  const isDataProviderProject = project?.isDataProvider === true;

  const handleClose = () => {
    if (loading) return;
    if (hasPendingListRefreshRef.current) {
      hasPendingListRefreshRef.current = false;
      if (onCustomerUpdated) {
        onCustomerUpdated();
      } else {
        onRefetch?.();
      }
    }
    onClose();
  };

  const handleAddPayment = useCallback(async (date: string, amount: string, method: string, desc: string) => {
    await actions.addPayment(date, amount, method, desc);
    markListRefreshPending();
  }, [actions, markListRefreshPending]);

  const handleRemovePayment = useCallback(async (id: number) => {
    await actions.removePayment(id);
    markListRefreshPending();
  }, [actions, markListRefreshPending]);

  const handleAddSchedule = useCallback(async (dateIso: string, desc: string, colorCode: string) => {
    await actions.addSchedule(dateIso, desc, colorCode);
    markListRefreshPending();
  }, [actions, markListRefreshPending]);

  const handleRemoveSchedule = useCallback(async (id: number) => {
    await actions.removeSchedule(id);
    markListRefreshPending();
  }, [actions, markListRefreshPending]);

  const handleAddNote = useCallback(async (categoryId: number | null, note: string) => {
    await actions.addNote(categoryId, note);
    markListRefreshPending();
  }, [actions, markListRefreshPending]);

  const handleRemoveNote = useCallback(async (id: number) => {
    await actions.removeNote(id);
    markListRefreshPending();
  }, [actions, markListRefreshPending]);

  const handleUnlinkConversation = useCallback(async () => {
    await actions.unlinkConversation();
    markListRefreshPending();
  }, [actions, markListRefreshPending]);

  const canSave = hasChanges && validation.isValid;
  const showValidation = hasChanges;

  // 고객 확인 핸들러
  const handleConfirmCustomer = () => {
    if (!detail || !projectId) return;

    showConfirmModal({
      message: "해당 고객을 확인됨으로 변경하시겠습니까?",
      confirmText: "확인",
      cancelText: "취소",
      onConfirm: async () => {
        try {
          await CustomersService.confirm(String(detail.id), projectId);
          // 모달 데이터 새로고침
          await actions.refetch();
          markListRefreshPending();
        } catch (error: any) {
          const errorCode = error?.data?.code;
          const errorStatus = error?.status;

          if (errorStatus === 403 && errorCode === "FORBIDDEN") {
            showErrorModalEvent({
              headline: "확인할 수 있는 권한이 없습니다.",
              description: "배정된 멤버만 고객을 확인할 수 있습니다.",
              hideCancel: true,
              confirmText: "확인",
            });
          } else {
            showErrorModalEvent({
              headline: "고객 확인에 실패했습니다.",
              description: "잠시 후 다시 시도해주세요.",
              hideCancel: true,
              confirmText: "확인",
            });
          }
        }
      },
    });
  };

  if (!open) return null;

  return (
    <BaseModal
      onClose={handleClose}
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      positionerClassName="min-h-full flex items-center justify-center p-2"
      containerClassName="relative w-[calc(100%-16px)] max-w-[904px] min-w-[600px] rounded-[14px] bg-card dark:bg-neutral-10 px-7 pt-6 pb-4 flex flex-col h-[630px] md:!h-[600px] lg:!h-[720px] md:!w-[calc(100%-16px)] md:!max-w-[904px] md:!min-w-[600px] lg:!w-[calc(100%-32px)] lg:!max-w-[1284px] overflow-hidden"
      ariaLabel="고객정보"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-none">
        <div className="flex items-center gap-2">
          <h2 className="text-[18px] font-semibold text-neutral-90 dark:text-neutral-90">고객정보</h2>
          {(() => {
            // 확인 완료된 경우: 녹색 체크
            if (detail?.status === "confirmed") {
              return (
                <div className="flex items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12.0004 21.5999C17.3023 21.5999 21.6004 17.3018 21.6004 11.9999C21.6004 6.69797 17.3023 2.3999 12.0004 2.3999C6.69846 2.3999 2.40039 6.69797 2.40039 11.9999C2.40039 17.3018 6.69846 21.5999 12.0004 21.5999ZM16.4489 10.4484C16.9175 9.9798 16.9175 9.22 16.4489 8.75137C15.9803 8.28275 15.2205 8.28275 14.7519 8.75137L10.8004 12.7028L9.24892 11.1514C8.78029 10.6827 8.02049 10.6827 7.55186 11.1514C7.08323 11.62 7.08323 12.3798 7.55186 12.8484L9.95186 15.2484C10.4205 15.7171 11.1803 15.7171 11.6489 15.2484L16.4489 10.4484Z"
                      fill="#00E272"
                    />
                  </svg>
                </div>
              );
            }
            // 확인 안됨 + 내가 체크 가능한 경우: 회색 체크 (클릭 가능)
            if (
              detail?.status !== "confirmed" &&
              detail?.assignedMember?.id === myMemberId
            ) {
              return (
                <button
                  onClick={handleConfirmCustomer}
                  className="flex items-center justify-center cursor-pointer"
                  aria-label="고객 확인"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12.0004 21.5999C17.3023 21.5999 21.6004 17.3018 21.6004 11.9999C21.6004 6.69797 17.3023 2.3999 12.0004 2.3999C6.69846 2.3999 2.40039 6.69797 2.40039 11.9999C2.40039 17.3018 6.69846 21.5999 12.0004 21.5999ZM16.4489 10.4484C16.9175 9.9798 16.9175 9.22 16.4489 8.75137C15.9803 8.28275 15.2205 8.28275 14.7519 8.75137L10.8004 12.7028L9.24892 11.1514C8.78029 10.6827 8.02049 10.6827 7.55186 11.1514C7.08323 11.62 7.08323 12.3798 7.55186 12.8484L9.95186 15.2484C10.4205 15.7171 11.1803 15.7171 11.6489 15.2484L16.4489 10.4484Z"
                      fill="#B0B0B0"
                    />
                  </svg>
                </button>
              );
            }
            // 그 외: 아무것도 표시 안함
            return (
              <button
                className="flex items-center justify-center"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12.0004 21.5999C17.3023 21.5999 21.6004 17.3018 21.6004 11.9999C21.6004 6.69797 17.3023 2.3999 12.0004 2.3999C6.69846 2.3999 2.40039 6.69797 2.40039 11.9999C2.40039 17.3018 6.69846 21.5999 12.0004 21.5999ZM16.4489 10.4484C16.9175 9.9798 16.9175 9.22 16.4489 8.75137C15.9803 8.28275 15.2205 8.28275 14.7519 8.75137L10.8004 12.7028L9.24892 11.1514C8.78029 10.6827 8.02049 10.6827 7.55186 11.1514C7.08323 11.62 7.08323 12.3798 7.55186 12.8484L9.95186 15.2484C10.4205 15.7171 11.1803 15.7171 11.6489 15.2484L16.4489 10.4484Z"
                    fill="#B0B0B0"
                  />
                </svg>
              </button>
            );
          })()}
          {showAssignButton && (
            <button
              type="button"
              className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-90 text-neutral-20 dark:text-neutral-25 text-[14px] font-semibold tracking-[-0.02em] inline-flex items-center justify-center gap-2 hover:opacity-90 dark:hover:opacity-90 transition-opacity"
              onClick={onAssignClick}
              aria-label="직원배정"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
                <path d="M8.03017 11.1363C7.73727 10.8434 7.2624 10.8434 6.96951 11.1363C6.67661 11.4292 6.67661 11.9041 6.96951 12.197L7.49984 11.6667L8.03017 11.1363ZM9.1665 13.3333L8.63617 13.8637C8.92907 14.1566 9.40394 14.1566 9.69683 13.8637L9.1665 13.3333ZM13.0302 10.5303C13.3231 10.2374 13.3231 9.76256 13.0302 9.46967C12.7373 9.17678 12.2624 9.17678 11.9695 9.46967L12.4998 10L13.0302 10.5303ZM15.8332 5.83333H15.0832V15.8333H15.8332H16.5832V5.83333H15.8332ZM14.1665 17.5V16.75H5.83317V17.5V18.25H14.1665V17.5ZM4.1665 15.8333H4.9165V5.83333H4.1665H3.4165V15.8333H4.1665ZM5.83317 4.16667V4.91667H7.49984V4.16667V3.41667H5.83317V4.16667ZM12.4998 4.16667V4.91667H14.1665V4.16667V3.41667H12.4998V4.16667ZM5.83317 17.5V16.75C5.32691 16.75 4.9165 16.3396 4.9165 15.8333H4.1665H3.4165C3.4165 17.168 4.49848 18.25 5.83317 18.25V17.5ZM15.8332 15.8333H15.0832C15.0832 16.3396 14.6728 16.75 14.1665 16.75V17.5V18.25C15.5012 18.25 16.5832 17.168 16.5832 15.8333H15.8332ZM15.8332 5.83333H16.5832C16.5832 4.49865 15.5012 3.41667 14.1665 3.41667V4.16667V4.91667C14.6728 4.91667 15.0832 5.32707 15.0832 5.83333H15.8332ZM4.1665 5.83333H4.9165C4.9165 5.32707 5.32691 4.91667 5.83317 4.91667V4.16667V3.41667C4.49848 3.41667 3.4165 4.49865 3.4165 5.83333H4.1665ZM7.49984 11.6667L6.96951 12.197L8.63617 13.8637L9.1665 13.3333L9.69683 12.803L8.03017 11.1363L7.49984 11.6667ZM9.1665 13.3333L9.69683 13.8637L13.0302 10.5303L12.4998 10L11.9695 9.46967L8.63617 12.803L9.1665 13.3333ZM9.1665 2.5V3.25H10.8332V2.5V1.75H9.1665V2.5ZM10.8332 5.83333V5.08333H9.1665V5.83333V6.58333H10.8332V5.83333ZM9.1665 5.83333V5.08333C8.66024 5.08333 8.24984 4.67293 8.24984 4.16667H7.49984H6.74984C6.74984 5.50135 7.83182 6.58333 9.1665 6.58333V5.83333ZM12.4998 4.16667H11.7498C11.7498 4.67293 11.3394 5.08333 10.8332 5.08333V5.83333V6.58333C12.1679 6.58333 13.2498 5.50135 13.2498 4.16667H12.4998ZM10.8332 2.5V3.25C11.3394 3.25 11.7498 3.66041 11.7498 4.16667H12.4998H13.2498C13.2498 2.83198 12.1679 1.75 10.8332 1.75V2.5ZM9.1665 2.5V1.75C7.83182 1.75 6.74984 2.83198 6.74984 4.16667H7.49984H8.24984C8.24984 3.66041 8.66024 3.25 9.1665 3.25V2.5Z" fill="currentColor" />
              </svg>
              <span>직원배정</span>
            </button>
          )}
        </div>
        <button
          aria-label="close"
          className="cursor-pointer w-6 h-6 grid place-items-center"
          onClick={handleClose}
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
              stroke="currentColor"
              className="text-neutral-60 dark:text-neutral-50"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Content Area - 스크롤 가능 */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-2 pl-2 pr-4 custom-scrollbar">
        {loading && (
          <div className="py-16 text-center text-neutral-60 dark:text-neutral-60 min-w-0">불러오는 중...</div>
        )}

        {!loading && detail && (
          <div className="mt-[30px] grid grid-cols-12 md:grid-cols-[minmax(0,1fr)_330px] lg:grid-cols-[minmax(0,1fr)_384px] gap-6 pb-2">
            {/* Left: form and tabs */}
            <div
              ref={leftPanelRef}
              className="col-span-12 md:col-span-1 w-full min-w-0 lg:max-w-[792px]"
            >
              {/* Tabs */}
              <div className="flex gap-6 border-b border-neutral-30 dark:border-neutral-30">
                <button
                  className={`cursor-pointer pb-3 text-[16px] ${tab === "basic"
                      ? "font-semibold text-neutral-90 dark:text-neutral-90 border-b-2 border-neutral-90 dark:border-neutral-90"
                      : "text-neutral-60 dark:text-neutral-60"
                    }`}
                  onClick={() => setTab("basic")}
                >
                  기본 정보
                </button>
                <button
                  className={`cursor-pointer pb-3 text-[16px] ${tab === "data"
                      ? "font-semibold text-neutral-90 dark:text-neutral-90 border-b-2 border-neutral-90 dark:border-neutral-90"
                      : "text-neutral-60 dark:text-neutral-60"
                    }`}
                  onClick={() => setTab("data")}
                >
                  데이터 정보
                </button>
                <button
                  className={`cursor-pointer pb-3 text-[16px] ${tab === "sales"
                      ? "font-semibold text-neutral-90 dark:text-neutral-90 border-b-2 border-neutral-90 dark:border-neutral-90"
                      : "text-neutral-60 dark:text-neutral-60"
                    }`}
                  onClick={() => setTab("sales")}
                >
                  영업정보
                </button>
                {isDataProviderProject && (
                  <button
                    className={`cursor-pointer pb-3 text-[16px] ${tab === "assignment"
                        ? "font-semibold text-neutral-90 dark:text-neutral-90 border-b-2 border-neutral-90 dark:border-neutral-90"
                        : "text-neutral-60 dark:text-neutral-60"
                      }`}
                    onClick={() => setTab("assignment")}
                  >
                    배정 정보
                  </button>
                )}
              </div>

              {tab === "basic" && (
                <BasicTab
                  form={form}
                  setForm={setForm}
                  messengers={messengersLocal}
                  onAddMessenger={actions.addMessenger}
                  onRemoveMessenger={actions.removeMessenger}
                  validation={validation}
                  showValidation={showValidation}
                />
              )}

              {tab === "data" && (
                <DataTab
                  form={form}
                  setForm={setForm}
                  isDataProvider={isDataProviderProject}
                />
              )}

              {tab === "sales" && (
                <SalesTab
                  form={form}
                  setForm={setForm}
                  paymentHistories={detail.paymentHistories}
                  schedules={detail.schedules}
                  onAddPayment={handleAddPayment}
                  onRemovePayment={handleRemovePayment}
                  onAddSchedule={handleAddSchedule}
                  onRemoveSchedule={handleRemoveSchedule}
                />
              )}

              {tab === "assignment" && (
                <AssignmentTab
                  assignedPartners={detail.assignedPartners ?? []}
                  onCloseModal={onClose}
                />
              )}
            </div>

            {/* Right: 대화 요약 + 상담 내용 기록 */}
            <ConsultationPanel
              customerId={detail.id}
              customerName={detail.name || ""}
              conversation={detail.conversation}
              notes={detail.notes}
              categories={categories}
              onAddNote={handleAddNote}
              onRemoveNote={handleRemoveNote}
              onUnlinkConversation={handleUnlinkConversation}
              maxHeight={leftHeight}
            />
          </div>
        )}
      </div>

      {/* Footer - 모달 하단에 고정 */}
      <div
        className={`flex-none flex items-center gap-2 -mx-7 px-7 pt-2 border-t border-neutral-30 dark:border-neutral-30 ${
          isAdminOrSubAdmin ? "justify-between" : "justify-end"
        }`}
      >
        {loading || !detail ? (
          <div className="h-[34px]" />
        ) : (
          <>
            {/* 좌측: 삭제 버튼 (admin/subAdmin만 노출) */}
            {isAdminOrSubAdmin && (
              <button
                className="h-[34px] w-[34px] flex items-center justify-center rounded-[5px] cursor-pointer hover:bg-neutral-20 dark:hover:bg-neutral-20 transition-colors"
                onClick={() => {
                  showConfirmModal({
                    title: "고객 삭제",
                    headline: "해당 고객을 삭제하시겠습니까?",
                    message: "삭제된 고객 정보는 복구할 수 없습니다.",
                    type: "warning",
                    confirmText: "삭제",
                    cancelText: "취소",
                    onConfirm: async () => {
                      try {
                        const pid = getSelectedProjectId();
                        if (!pid || !customerId) return;
                        await CustomersService.bulkDelete({
                          projectId: pid,
                          deleteType: "ids",
                          customerIds: [customerId],
                        });
                        if (customerId) {
                          onCustomerDeleted?.(customerId);
                        } else {
                          markListRefreshPending();
                        }
                        handleClose();
                      } catch {
                        showErrorModalEvent({
                          title: "오류 발생",
                          headline: "고객 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.",
                          confirmText: "확인",
                        });
                      }
                    },
                  });
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}

            {/* 우측: 초기화 + 적용완료 */}
            <div className="flex items-center gap-2">
              <button
                className={`h-[34px] px-4 rounded-[5px] border border-neutral-30 dark:border-neutral-30 text-body-3 text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 ${hasChanges ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  }`}
                onClick={actions.resetForm}
                disabled={!hasChanges}
              >
                초기화
              </button>
              <button
                className={`h-[34px] px-4 rounded-[5px] text-body-3 ${canSave
                    ? "cursor-pointer bg-neutral-90 dark:bg-neutral-80 text-neutral-0 dark:text-neutral-0"
                    : "cursor-not-allowed bg-neutral-40 dark:bg-neutral-40 text-neutral-60 dark:text-neutral-60"
                  }`}
                onClick={() => {
                  actions.saveForm().then(() => {
                    markListRefreshPending();
                    handleClose();
                  }).catch((_e: any) => {
                    showErrorModal({
                      title: "오류 발생",
                      headline: "저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
                      confirmText: "확인",
                      cancelText: null,
                      hideCancel: true,
                    });
                  });
                }}
                disabled={!canSave}
              >
                적용완료
              </button>
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
}

