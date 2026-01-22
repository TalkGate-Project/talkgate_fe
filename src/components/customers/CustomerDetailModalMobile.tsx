"use client";

import { useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import { useCustomerDetail } from "./detail/useCustomerDetail";
import BasicTab from "./detail/BasicTab";
import DataTab from "./detail/DataTab";
import SalesTab from "./detail/SalesTab";
import ConsultationTab from "./detail/ConsultationTab";
import ConversationCard from "./detail/ConversationCard";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { useMyMember } from "@/hooks/useMyMember";
import { CustomersService } from "@/services/customers";
import { getSelectedProjectId } from "@/lib/project";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal as showErrorModalEvent } from "@/lib/errorModalEvents";

export type CustomerDetailModalProps = {
  open: boolean;
  onClose: () => void;
  customerId: number | null;
  onRefetch?: () => void;
};

export default function CustomerDetailModalMobile({
  open,
  onClose,
  customerId,
  onRefetch,
}: CustomerDetailModalProps) {
  const [tab, setTab] = useState<"basic" | "data" | "sales" | "consultation">("basic");

  const {
    loading,
    detail,
    categories,
    messengersLocal,
    form,
    setForm,
    hasChanges,
    actions,
  } = useCustomerDetail(customerId, open);

  // 현재 사용자의 멤버 정보 가져오기
  const projectId = getSelectedProjectId();
  const { member: myMember } = useMyMember(projectId);
  const myMemberId = myMember?.id;

  const handleClose = () => {
    if (!loading) onClose();
  };

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
          onRefetch?.();
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
      containerClassName="relative w-full h-full rounded-0 bg-card dark:bg-neutral-10 flex flex-col overflow-hidden"
      ariaLabel="고객정보"
      fullScreenOnMobile={true}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-none px-4 py-3 border-b border-neutral-30 dark:border-neutral-30">
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
            return null;
          })()}
        </div>
        <button
          aria-label="close"
          className="cursor-pointer w-6 h-6 grid place-items-center"
          onClick={onClose}
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

      {/* Conversation Card - 최상단에 항상 표시 */}
      {!loading && detail && (
        <div className="flex-none px-4 pt-4">
          <ConversationCard
            customerId={detail.id}
            customerName={detail.name || ""}
            conversation={detail.conversation}
            onUnlinkConversation={actions.unlinkConversation}
          />
        </div>
      )}

      {/* Tabs */}
      {!loading && detail && (
        <div className="flex-none flex gap-4 border-b border-neutral-30 dark:border-neutral-30 px-4 mt-4 overflow-x-auto">
          <button
            className={`cursor-pointer pb-3 text-[14px] flex-shrink-0 whitespace-nowrap ${
              tab === "basic"
                ? "font-semibold text-neutral-90 dark:text-neutral-90 border-b-2 border-neutral-90 dark:border-neutral-90"
                : "text-neutral-60 dark:text-neutral-60"
            }`}
            onClick={() => setTab("basic")}
          >
            기본 정보
          </button>
          <button
            className={`cursor-pointer pb-3 text-[14px] flex-shrink-0 whitespace-nowrap ${
              tab === "data"
                ? "font-semibold text-neutral-90 dark:text-neutral-90 border-b-2 border-neutral-90 dark:border-neutral-90"
                : "text-neutral-60 dark:text-neutral-60"
            }`}
            onClick={() => setTab("data")}
          >
            데이터 정보
          </button>
          <button
            className={`cursor-pointer pb-3 text-[14px] flex-shrink-0 whitespace-nowrap ${
              tab === "sales"
                ? "font-semibold text-neutral-90 dark:text-neutral-90 border-b-2 border-neutral-90 dark:border-neutral-90"
                : "text-neutral-60 dark:text-neutral-60"
            }`}
            onClick={() => setTab("sales")}
          >
            영업정보
          </button>
          <button
            className={`cursor-pointer pb-3 text-[14px] flex-shrink-0 whitespace-nowrap ${
              tab === "consultation"
                ? "font-semibold text-neutral-90 dark:text-neutral-90 border-b-2 border-neutral-90 dark:border-neutral-90"
                : "text-neutral-60 dark:text-neutral-60"
            }`}
            onClick={() => setTab("consultation")}
          >
            상담 내용 기록
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4">
        {loading && (
          <div className="py-16 text-center text-neutral-60 dark:text-neutral-60">불러오는 중...</div>
        )}

        {!loading && detail && (
          <>
            {tab === "basic" && (
              <BasicTab
                form={form}
                setForm={setForm}
                messengers={messengersLocal}
                onAddMessenger={actions.addMessenger}
                onRemoveMessenger={actions.removeMessenger}
              />
            )}

            {tab === "data" && <DataTab form={form} setForm={setForm} />}

            {tab === "sales" && (
              <SalesTab
                form={form}
                setForm={setForm}
                paymentHistories={detail.paymentHistories}
                schedules={detail.schedules}
                onAddPayment={actions.addPayment}
                onRemovePayment={actions.removePayment}
                onAddSchedule={actions.addSchedule}
                onRemoveSchedule={actions.removeSchedule}
              />
            )}

            {tab === "consultation" && (
              <ConsultationTab
                customerName={detail.name || ""}
                notes={detail.notes}
                categories={categories}
                onAddNote={actions.addNote}
                onRemoveNote={actions.removeNote}
              />
            )}
          </>
        )}
      </div>

      {/* Footer - 모달 하단에 고정 */}
      <div className="flex-none flex justify-end items-center gap-2 px-4 py-3 border-t border-neutral-30 dark:border-neutral-30 bg-card dark:bg-neutral-10">
        {loading || !detail ? (
          <div className="h-[44px]" />
        ) : (
          <>
            <button
              className={`flex-1 h-[44px] px-4 rounded-[5px] border border-neutral-30 dark:border-neutral-30 text-body-3 text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 ${
                hasChanges ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              }`}
              onClick={actions.resetForm}
              disabled={!hasChanges}
            >
              취소
            </button>
            <button
              className={`flex-1 h-[44px] px-4 rounded-[5px] text-body-3 ${
                hasChanges
                  ? "cursor-pointer bg-neutral-90 dark:bg-neutral-80 text-neutral-0 dark:text-neutral-0"
                  : "cursor-not-allowed bg-neutral-40 dark:bg-neutral-40 text-neutral-60 dark:text-neutral-60"
              }`}
              onClick={() => {
                actions.saveForm().then(() => {
                  onRefetch?.();
                  onClose();
                }).catch((e: any) => {
                  showErrorModal({
                    title: "오류 발생",
                    headline: "저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
                    confirmText: "확인",
                    cancelText: null,
                    hideCancel: true,
                  });
                });
              }}
              disabled={!hasChanges}
            >
              적용완료
            </button>
          </>
        )}
      </div>
    </BaseModal>
  );
}

