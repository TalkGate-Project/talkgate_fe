import { useState, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CustomerNoteCategoriesService } from "@/services/customerNoteCategories";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import type { CustomerNoteCategory } from "@/types/customerNoteCategories";
import { customerNoteCategoriesQueryKey } from "@/hooks/useCustomerNoteCategories";
import {
  DEFAULT_STATUS_COLOR,
  normalizeHexColor,
} from "@/utils/statusColors";

/**
 * 카테고리 관리 로직을 담당하는 훅
 */
export function useStatusManagement(
  projectId: string | null,
  setStatuses: Dispatch<SetStateAction<CustomerNoteCategory[]>>
) {
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState(DEFAULT_STATUS_COLOR);
  const queryClient = useQueryClient();

  // 카테고리 추가
  const handleAddStatus = useCallback(async () => {
    if (!newStatusName.trim() || !projectId) return false;
    
    const trimmedName = newStatusName.trim();
    const trimmedColor = normalizeHexColor(newStatusColor) ?? DEFAULT_STATUS_COLOR;
    setNewStatusName("");
    setNewStatusColor(DEFAULT_STATUS_COLOR);
    
    try {
      const response = await CustomerNoteCategoriesService.create(
        { name: trimmedName, colorCode: trimmedColor },
        { "x-project-id": projectId }
      );
      
      if (response.data?.data) {
        setStatuses((prev) => [...prev, response.data.data]);
      }

      await queryClient.invalidateQueries({
        queryKey: [...customerNoteCategoriesQueryKey, projectId],
      });
      return true;
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
      setNewStatusColor(trimmedColor);
      return false;
    }
  }, [newStatusColor, newStatusName, projectId, queryClient, setStatuses]);

  // 카테고리 수정
  const handleModifyStatus = useCallback(async (
    id: number,
    {
      name,
      colorCode,
    }: {
      name: string;
      colorCode?: string | null;
    }
  ) => {
    if (!projectId) return false;
    const trimmedName = name.trim();
    const trimmedColor = normalizeHexColor(colorCode) ?? DEFAULT_STATUS_COLOR;
    if (!trimmedName) return false;
    
    try {
      const response = await CustomerNoteCategoriesService.update(
        String(id),
        { name: trimmedName, colorCode: trimmedColor },
        { "x-project-id": projectId }
      );
      
      if (response.data?.data) {
        setStatuses((prev) => prev.map(status => 
          status.id === id ? response.data.data : status
        ));
      }

      await queryClient.invalidateQueries({
        queryKey: [...customerNoteCategoriesQueryKey, projectId],
      });
      return true;
    } catch (error: any) {
      console.error("Failed to update status:", error);
      showErrorModal({
        headline: "카테고리 수정 실패",
        description: "카테고리 수정에 실패했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
      return false;
    }
  }, [projectId, queryClient, setStatuses]);

  // 카테고리 삭제
  const handleDeleteStatus = useCallback(async (id: number) => {
    if (!projectId) return;
    
    showErrorModal({
      headline: "카테고리 삭제",
      description: "정말 삭제하시겠습니까?",
      onConfirm: async () => {
        try {
          await CustomerNoteCategoriesService.remove(
            String(id),
            { "x-project-id": projectId }
          );
          setStatuses((prev) => prev.filter(status => status.id !== id));
          await queryClient.invalidateQueries({
            queryKey: [...customerNoteCategoriesQueryKey, projectId],
          });
        } catch (error: any) {
          console.error("Failed to delete status:", error);
          showErrorModal({
            headline: "카테고리 삭제 실패",
            description: "카테고리 삭제에 실패했습니다.",
            hideCancel: true,
            confirmText: "확인",
          });
        }
      },
    });
  }, [projectId, queryClient, setStatuses]);

  return {
    newStatusName,
    setNewStatusName,
    newStatusColor,
    setNewStatusColor,
    handleAddStatus,
    handleModifyStatus,
    handleDeleteStatus,
  };
}
