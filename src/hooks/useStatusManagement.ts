import { useState, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { CustomerNoteCategoriesService } from "@/services/customerNoteCategories";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import type { CustomerNoteCategory } from "@/types/customerNoteCategories";

/**
 * 처리상태 관리 로직을 담당하는 훅
 */
export function useStatusManagement(
  projectId: string | null,
  statuses: CustomerNoteCategory[],
  setStatuses: Dispatch<SetStateAction<CustomerNoteCategory[]>>
) {
  const [newStatusName, setNewStatusName] = useState("");

  // 처리상태 추가
  const handleAddStatus = useCallback(async () => {
    if (!newStatusName.trim() || !projectId) return;
    
    const trimmedName = newStatusName.trim();
    setNewStatusName("");
    
    try {
      const response = await CustomerNoteCategoriesService.create(
        { name: trimmedName },
        { "x-project-id": projectId }
      );
      
      if (response.data?.data) {
        setStatuses((prev) => [...prev, response.data.data]);
      }
    } catch (error: any) {
      console.error("Failed to create status:", error);
      showErrorModal({
        type: "error",
        headline: "잠시 후 다시 시도해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
      // 실패 시 입력값 복원
      setNewStatusName(trimmedName);
    }
  }, [newStatusName, projectId, setStatuses]);

  // 처리상태 수정
  const handleModifyStatus = useCallback(async (id: number, currentName: string) => {
    if (!projectId) return;
    
    const newName = prompt("새로운 상태 이름을 입력하세요:", currentName);
    if (!newName || !newName.trim() || newName === currentName) return;
    
    try {
      const response = await CustomerNoteCategoriesService.update(
        String(id),
        { name: newName.trim() },
        { "x-project-id": projectId }
      );
      
      if (response.data?.data) {
        setStatuses((prev) => prev.map(status => 
          status.id === id ? response.data.data : status
        ));
      }
    } catch (error: any) {
      console.error("Failed to update status:", error);
      showErrorModal({
        headline: "처리상태 수정 실패",
        description: "처리상태 수정에 실패했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    }
  }, [projectId, setStatuses]);

  // 처리상태 삭제
  const handleDeleteStatus = useCallback(async (id: number) => {
    if (!projectId) return;
    
    showErrorModal({
      headline: "처리상태 삭제",
      description: "정말 삭제하시겠습니까?",
      onConfirm: async () => {
        try {
          await CustomerNoteCategoriesService.remove(
            String(id),
            { "x-project-id": projectId }
          );
          setStatuses((prev) => prev.filter(status => status.id !== id));
        } catch (error: any) {
          console.error("Failed to delete status:", error);
          showErrorModal({
            headline: "처리상태 삭제 실패",
            description: "처리상태 삭제에 실패했습니다.",
            hideCancel: true,
            confirmText: "확인",
          });
        }
      },
    });
  }, [projectId, setStatuses]);

  return {
    newStatusName,
    setNewStatusName,
    handleAddStatus,
    handleModifyStatus,
    handleDeleteStatus,
  };
}
