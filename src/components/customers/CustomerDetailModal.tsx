"use client";

import { useState, useRef, useLayoutEffect } from "react";
import BaseModal from "@/components/common/BaseModal";
import { useCustomerDetail } from "./detail/useCustomerDetail";
import BasicTab from "./detail/BasicTab";
import DataTab from "./detail/DataTab";
import SalesTab from "./detail/SalesTab";
import ConsultationPanel from "./detail/ConsultationPanel";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

export type CustomerDetailModalProps = {
  open: boolean;
  onClose: () => void;
  customerId: number | null;
};

export default function CustomerDetailModal({
  open,
  onClose,
  customerId,
}: CustomerDetailModalProps) {
  const [tab, setTab] = useState<"basic" | "data" | "sales">("basic");
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [leftHeight, setLeftHeight] = useState<number | null>(null);

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
      containerClassName="relative w-[92vw] max-w-[1284px] rounded-[14px] bg-card dark:bg-neutral-10 px-7 pt-6 pb-4 flex flex-col h-[85vh] md:h-[90vh] lg:h-[546px] xl:h-[546px]"
      ariaLabel="고객정보"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-none">
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

      <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2 custom-scrollbar">
        {loading && (
          <div className="py-16 text-center text-neutral-60 dark:text-neutral-60">불러오는 중...</div>
        )}

        {!loading && detail && (
          <div className="mt-[30px] grid grid-cols-12 gap-6 pb-2">
            {/* Left: form and tabs */}
          <div ref={leftPanelRef} className="col-span-12 lg:col-span-8 max-w-[792px]">
            {/* Tabs */}
            <div className="flex gap-6 border-b border-neutral-30 dark:border-neutral-30">
              <button
                className={`cursor-pointer pb-3 text-[16px] ${
                  tab === "basic"
                    ? "font-semibold text-neutral-90 dark:text-neutral-90 border-b-2 border-neutral-90 dark:border-neutral-90"
                    : "text-neutral-60 dark:text-neutral-60"
                }`}
                onClick={() => setTab("basic")}
              >
                기본 정보
              </button>
              <button
                className={`cursor-pointer pb-3 text-[16px] ${
                  tab === "data"
                    ? "font-semibold text-neutral-90 dark:text-neutral-90 border-b-2 border-neutral-90 dark:border-neutral-90"
                    : "text-neutral-60 dark:text-neutral-60"
                }`}
                onClick={() => setTab("data")}
              >
                데이터 정보
              </button>
              <button
                className={`cursor-pointer pb-3 text-[16px] ${
                  tab === "sales"
                    ? "font-semibold text-neutral-90 dark:text-neutral-90 border-b-2 border-neutral-90 dark:border-neutral-90"
                    : "text-neutral-60 dark:text-neutral-60"
                }`}
                onClick={() => setTab("sales")}
              >
                영업정보
              </button>
            </div>

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
          </div>

          {/* Right: 대화 요약 + 상담 내용 기록 */}
          <ConsultationPanel
            customerId={detail.id}
            customerName={detail.name || ""}
            conversation={detail.conversation}
            notes={detail.notes}
            categories={categories}
            onAddNote={actions.addNote}
            onRemoveNote={actions.removeNote}
            onUnlinkConversation={actions.unlinkConversation}
            maxHeight={leftHeight}
          />

          {/* Footer */}
          <div className="col-span-12 flex justify-end gap-2 pt-2 border-t border-neutral-30 dark:border-neutral-30">
            <button
              className={`h-[34px] px-4 rounded-[5px] border border-neutral-30 dark:border-neutral-30 text-body-3 text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 ${
                hasChanges ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              }`}
              onClick={actions.resetForm}
              disabled={!hasChanges}
            >
              초기화
            </button>
            <button
              className={`h-[34px] px-4 rounded-[5px] text-body-3 ${
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
          </div>
        </div>
      )}
      </div>
    </BaseModal>
  );
}
