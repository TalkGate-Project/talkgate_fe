import { useState, useCallback } from "react";
import { ProjectsService } from "@/services/projects";
import { AssetsService } from "@/services/assets";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * 브랜드 아이콘 업로드 관련 로직을 관리하는 훅
 */
export function useBrandIconUpload(
  projectId: string | null,
  brandIcon: string | null,
  originalBrandIcon: string | null,
  setBrandIcon: (icon: string | null) => void,
  setOriginalBrandIcon: (icon: string | null) => void,
  setIsSaving: (saving: boolean) => void
) {
  const [brandIconFile, setBrandIconFile] = useState<File | null>(null);

  // 브랜드 아이콘 S3 업로드 및 프로젝트 업데이트
  const uploadBrandIcon = useCallback(async (file: File) => {
    if (!projectId) return;
    
    setIsSaving(true);
    try {
      // 1. Presigned URL 발급
      const presignResponse = await AssetsService.presignProjectLogo({
        fileName: file.name,
        fileType: file.type,
      });
      
      const { uploadUrl, fileUrl } = presignResponse.data.data;
      
      // 2. S3에 업로드
      await AssetsService.uploadToS3(uploadUrl, file, file.type);
      
      // 3. 프로젝트 업데이트 (logoUrl 저장)
      await ProjectsService.update(
        { logoUrl: fileUrl },
        { "x-project-id": projectId }
      );
      
      setOriginalBrandIcon(fileUrl);
      showErrorModal({
        type: "success",
        headline: "브랜드 아이콘이 업로드되었습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } catch (error: any) {
      console.error("Failed to upload brand icon:", error);
      showErrorModal({
        type: "error",
        headline: "브랜드 아이콘 업로드 실패.",
        hideCancel: true,
        confirmText: "확인",
      });
      // 실패 시 이전 상태로 복원
      setBrandIcon(originalBrandIcon);
      setBrandIconFile(null);
    } finally {
      setIsSaving(false);
    }
  }, [projectId, setBrandIcon, setOriginalBrandIcon, originalBrandIcon, setIsSaving]);

  // 브랜드 아이콘 업로드
  const handleBrandIconUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크
    if (file.size > MAX_FILE_SIZE) {
      showErrorModal({
        type: "error",
        headline: "파일 크기 초과",
        description: "파일 크기는 5MB를 초과할 수 없습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
      return;
    }
    
    // 파일 타입 체크
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      showErrorModal({
        type: "error",
        headline: "지원하지 않는 파일 형식",
        hideCancel: true,
        confirmText: "확인",
      });
      return;
    }
    
    setBrandIconFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setBrandIcon(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // 자동으로 업로드
    uploadBrandIcon(file);
  }, [setBrandIcon, uploadBrandIcon]);

  const handleRemoveBrandIcon = useCallback(async () => {
    if (!projectId) return;
    
    setIsSaving(true);
    try {
      await ProjectsService.update(
        { logoUrl: "" },
        { "x-project-id": projectId }
      );
      
      setBrandIcon(null);
      setOriginalBrandIcon(null);
      setBrandIconFile(null);
      showErrorModal({
        type: "success",
        headline: "브랜드 아이콘이 삭제되었습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } catch (error: any) {
      console.error("Failed to remove brand icon:", error);
      showErrorModal({
        type: "error",
        headline: "브랜드 아이콘 삭제 실패.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setIsSaving(false);
    }
  }, [projectId, setBrandIcon, setOriginalBrandIcon, setIsSaving]);

  return {
    brandIconFile,
    handleBrandIconUpload,
    handleRemoveBrandIcon,
  };
}
