import { useCallback, useRef } from "react";
import { CustomersService } from "@/services/customers";
import { ConversationsService } from "@/services/conversations";
import type { CustomerDetail, UpdateCustomerInput } from "@/types/customers";
import type { MessengerLocal } from "./types";
import { showErrorModal } from "@/lib/errorModalEvents";

// ============================================================================
// Helper: 프로젝트 ID 가져오기
// ============================================================================

function getProjectId(): string {
  return (window as any)?.tgSelectedProjectId || "";
}

// ============================================================================
// Types
// ============================================================================

type UseCustomerActionsParams = {
  detail: CustomerDetail | null;
  setDetail: React.Dispatch<React.SetStateAction<CustomerDetail | null>>;
  messengersLocal: MessengerLocal[];
  setMessengersLocal: React.Dispatch<React.SetStateAction<MessengerLocal[]>>;
  getChangedFields: () => Partial<Omit<UpdateCustomerInput, "projectId">>;
  commitForm: () => void;
};

type CustomerActions = {
  saveForm: () => Promise<void>;
  addMessenger: (type: string, account: string) => Promise<void>;
  removeMessenger: (index: number) => Promise<void>;
  addPayment: (date: string, amount: string, method: string, desc: string) => Promise<void>;
  removePayment: (id: number) => Promise<void>;
  addSchedule: (dateIso: string, desc: string, colorCode: string) => Promise<void>;
  removeSchedule: (id: number) => Promise<void>;
  addNote: (categoryId: number | null, note: string) => Promise<void>;
  removeNote: (id: number) => Promise<void>;
  unlinkConversation: () => Promise<void>;
};

// ============================================================================
// Hook
// ============================================================================

export function useCustomerActions({
  detail,
  setDetail,
  messengersLocal,
  setMessengersLocal,
  getChangedFields,
  commitForm,
}: UseCustomerActionsParams): CustomerActions {
  const isAddingNoteRef = useRef(false);
  // =========================================================================
  // Form Save
  // =========================================================================

  const saveForm = useCallback(async () => {
    if (!detail) return;

    const changedFields = getChangedFields();

    // 변경사항이 없으면 API 호출하지 않음
    if (Object.keys(changedFields).length === 0) {
      return;
    }

    await CustomersService.update(String(detail.id), {
      ...changedFields,
      projectId: getProjectId(),
    });

    // 저장 성공 후 현재 form을 새로운 originalForm으로 설정
    commitForm();
  }, [detail, getChangedFields, commitForm]);

  // =========================================================================
  // Messenger Actions
  // =========================================================================

  const addMessenger = useCallback(
    async (type: string, account: string) => {
      if (!detail) return;

      const toAdd: MessengerLocal = {
        messenger: type,
        account: account,
        createdAt: new Date().toISOString(),
      };

      // Optimistic update
      setMessengersLocal((prev) => [...prev, toAdd]);

      try {
        await CustomersService.addMessenger({
          customerId: detail.id,
          messenger: type,
          account: account,
          projectId: getProjectId(),
        });
      } catch {
        // 원본 코드에서도 롤백하지 않음
      }
    },
    [detail, setMessengersLocal]
  );

  const removeMessenger = useCallback(
    async (index: number) => {
      const target = messengersLocal[index];
      if (!target) return;

      // Optimistic update: UI에서 먼저 제거
      const prevList = messengersLocal;
      const nextList = [...messengersLocal];
      nextList.splice(index, 1);
      setMessengersLocal(nextList);

      // 기존에 저장된 메신저(서버에 id가 있는 경우)만 삭제 API 호출
      if (target.id) {
        try {
          await CustomersService.removeMessenger({
            messengerId: target.id,
            projectId: getProjectId(),
          });
        } catch (e) {
          // 실패 시 롤백
          setMessengersLocal(prevList);
          showErrorModal({
            title: "알림",
            headline: "메신저 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.",
            confirmText: "확인",
            cancelText: null,
            hideCancel: true,
          });
        }
      }
    },
    [messengersLocal, setMessengersLocal]
  );

  // =========================================================================
  // Payment Actions
  // =========================================================================

  const addPayment = useCallback(
    async (date: string, amount: string, method: string, desc: string) => {
      if (!detail) return;

      await CustomersService.addPaymentHistory({
        customerId: detail.id,
        description: desc,
        paymentDate: new Date(date).toISOString(),
        amount: Number(amount),
        paymentMethod: method,
        projectId: getProjectId(),
      });

      // Optimistic update
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              paymentHistories: [
                ...(prev.paymentHistories || []),
                {
                  id: Math.random(), // Temp ID
                  description: desc,
                  paymentDate: date,
                  amount: Number(amount),
                  paymentMethod: method,
                  createdAt: new Date().toISOString(),
                } as any,
              ],
            }
          : prev
      );
    },
    [detail, setDetail]
  );

  const removePayment = useCallback(
    async (id: number) => {
      await CustomersService.removePaymentHistory({
        paymentHistoryId: id,
        projectId: getProjectId(),
      });

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              paymentHistories: prev.paymentHistories.filter((x) => x.id !== id),
            }
          : prev
      );
    },
    [setDetail]
  );

  // =========================================================================
  // Schedule Actions
  // =========================================================================

  const addSchedule = useCallback(
    async (dateIso: string, desc: string, colorCode: string) => {
      if (!detail) return;

      await CustomersService.addSchedule({
        customerId: detail.id,
        scheduleTime: dateIso,
        description: desc,
        colorCode,
        projectId: getProjectId(),
      });

      // Optimistic - 로컬 상태에도 # 포함된 형태로 저장
      const normalizedColorCode = colorCode?.startsWith("#") ? colorCode : `#${colorCode}`;

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              schedules: [
                ...(prev.schedules || []),
                {
                  id: Math.random(),
                  scheduleTime: dateIso,
                  description: desc,
                  colorCode: normalizedColorCode,
                  createdAt: new Date().toISOString(),
                } as any,
              ],
            }
          : prev
      );
    },
    [detail, setDetail]
  );

  const removeSchedule = useCallback(
    async (id: number) => {
      await CustomersService.removeSchedule({
        scheduleId: id,
        projectId: getProjectId(),
      });

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              schedules: prev.schedules.filter((x) => x.id !== id),
            }
          : prev
      );
    },
    [setDetail]
  );

  // =========================================================================
  // Note Actions
  // =========================================================================

  const addNote = useCallback(
    async (categoryId: number | null, note: string) => {
      if (!detail || isAddingNoteRef.current) return;

      isAddingNoteRef.current = true;
      try {
        const res = await CustomersService.addNote({
          customerId: detail.id,
          categoryId,
          note,
          projectId: getProjectId(),
        });

        const newNote = res.data?.data;

        if (newNote) {
          setDetail((prev) =>
            prev
              ? {
                  ...prev,
                  notes: [newNote, ...prev.notes],
                }
              : prev
          );
        }
      } finally {
        isAddingNoteRef.current = false;
      }
    },
    [detail, setDetail]
  );

  const removeNote = useCallback(
    async (id: number) => {
      // Validation: id가 유효한 정수인지 확인
      if (
        typeof id !== "number" ||
        !Number.isInteger(id) ||
        id <= 0 ||
        !Number.isFinite(id)
      ) {
        console.error("Invalid note id for deletion:", id);
        showErrorModal({
          title: "오류 발생",
          headline: "상담 내용 삭제에 실패했습니다.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
        return;
      }

      try {
        await CustomersService.removeNote({
          noteId: id,
          projectId: getProjectId(),
        });

        setDetail((prev) =>
          prev
            ? {
                ...prev,
                notes: prev.notes.filter((x) => x.id !== id),
              }
            : prev
        );
      } catch (error) {
        showErrorModal({
          title: "오류 발생",
          headline: "상담 내용 삭제에 실패했습니다.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
      }
    },
    [setDetail]
  );

  // =========================================================================
  // Conversation Actions
  // =========================================================================

  const unlinkConversation = useCallback(async () => {
    if (!detail?.conversation?.id) return;

    const conversationId = detail.conversation.id;
    const projectId = getProjectId();

    await ConversationsService.unlinkCustomer({
      conversationId,
      projectId,
    });

    // Optimistic update: conversation을 null로 설정
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            conversation: null,
          }
        : prev
    );
  }, [detail, setDetail]);

  return {
    saveForm,
    addMessenger,
    removeMessenger,
    addPayment,
    removePayment,
    addSchedule,
    removeSchedule,
    addNote,
    removeNote,
    unlinkConversation,
  };
}

