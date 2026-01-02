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

export type CustomerDetailModalProps = {
  open: boolean;
  onClose: () => void;
  customerId: number | null;
};

export default function CustomerDetailModalMobile({
  open,
  onClose,
  customerId,
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

  const handleClose = () => {
    if (!loading) onClose();
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
        <h2 className="text-[18px] font-semibold text-neutral-90 dark:text-neutral-90">고객정보</h2>
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
      <div className="flex-none flex gap-2 px-4 py-3 border-t border-neutral-30 dark:border-neutral-30 bg-card dark:bg-neutral-10">
        {loading || !detail ? (
          <div className="flex-1 h-[44px]" />
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
                actions.saveForm().then(() => onClose()).catch((e: any) => {
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

