"use client";

import { useState, useCallback } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useGeneralSettings } from "@/hooks/useGeneralSettings";
import { useBrandIconUpload } from "@/hooks/useBrandIconUpload";
import { useStatusManagement } from "@/hooks/useStatusManagement";
import { ProjectsService } from "@/services/projects";
import { setUseAttendanceMenu } from "@/lib/project";
import { getProjectSubdomainUrl, canUseSubdomain } from "@/lib/subdomain";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import ServiceDeleteModal from "@/components/common/ServiceDeleteModal";
import ProjectNameSection from "./ProjectNameSection";
import BrandIconAndDomainSection from "./BrandIconAndDomainSection";
import StatusManagementSection from "./StatusManagementSection";
import ProjectFeaturesSection from "./ProjectFeaturesSection";
import ProjectDeleteSection from "./ProjectDeleteSection";

export default function GeneralSettings() {
  const [projectId] = useSelectedProjectId();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 초기 데이터 로드 및 상태 관리
  const {
    serviceName,
    setServiceName,
    originalServiceName,
    setOriginalServiceName,
    subdomain,
    setSubdomain,
    originalSubdomain,
    setOriginalSubdomain,
    brandIcon,
    setBrandIcon,
    originalBrandIcon,
    setOriginalBrandIcon,
    statuses,
    setStatuses,
    isAttendanceEnabled,
    setIsAttendanceEnabled,
    originalIsAttendanceEnabled,
    setOriginalIsAttendanceEnabled,
    isLoading,
    isSaving,
    setIsSaving,
    mounted,
  } = useGeneralSettings(projectId);

  // 브랜드 아이콘 업로드 관련 로직
  const {
    handleBrandIconUpload,
    handleRemoveBrandIcon,
  } = useBrandIconUpload(
    projectId,
    brandIcon,
    originalBrandIcon,
    setBrandIcon,
    setOriginalBrandIcon,
    setIsSaving
  );

  // 처리상태 관리 로직
  const {
    newStatusName,
    setNewStatusName,
    handleAddStatus,
    handleModifyStatus,
    handleDeleteStatus,
  } = useStatusManagement(projectId, statuses, setStatuses);

  // 프로젝트 이름 변경
  const handleUpdateProjectName = useCallback(async () => {
    if (!projectId || serviceName === originalServiceName) return;
    
    setIsSaving(true);
    try {
      await ProjectsService.update(
        { name: serviceName },
        { "x-project-id": projectId }
      );
      setOriginalServiceName(serviceName);
      showErrorModal({
        type: "success",
        headline: "프로젝트 이름이 변경되었습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } catch (error: any) {
      console.error("Failed to update project name:", error);
      showErrorModal({
        type: "error",
        headline: "프로젝트 이름 변경 실패.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setIsSaving(false);
    }
  }, [projectId, serviceName, originalServiceName, setIsSaving, setOriginalServiceName]);

  // 서브도메인 변경
  const handleUpdateSubdomain = useCallback(async () => {
    if (!projectId || subdomain === originalSubdomain) return;
    
    setIsSaving(true);
    try {
      await ProjectsService.update(
        { subDomain: subdomain },
        { "x-project-id": projectId }
      );
      setOriginalSubdomain(subdomain);
      
      // 서브도메인을 사용할 수 있는 환경이고 변경에 성공한 경우
      // 현재 경로를 유지하면서 새 서브도메인 URL로 리디렉션
      if (canUseSubdomain() && subdomain) {
        const currentPath = window.location.pathname + window.location.search;
        const newSubdomainUrl = getProjectSubdomainUrl(subdomain, currentPath);
        
        if (newSubdomainUrl) {
          // 성공 메시지 표시 후 리디렉션
          // persistent 모달: 닫기 버튼 숨김, overlay 클릭 시에도 리디렉션
          showErrorModal({
            type: "success",
            headline: "서브도메인 변경에 성공했습니다.",
            description: "페이지를 새로고침합니다.",
            hideCancel: true,
            confirmText: "확인",
            persistent: true, // overlay 클릭 시 모달이 닫히지 않음 (shake 액션만)
            hideCloseButton: true, // 닫기 버튼 숨김
            onConfirm: () => {
              window.location.href = newSubdomainUrl;
            },
          });
          return;
        }
      }
      
      // 서브도메인을 사용할 수 없는 환경이거나 리디렉션이 불가능한 경우
      showErrorModal({
        type: "success",
        headline: "서브도메인이 변경되었습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } catch (error: any) {
      console.error("Failed to update subdomain:", error);
      showErrorModal({
        type: "error",
        headline: "서브도메인 변경 실패.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setIsSaving(false);
    }
  }, [projectId, subdomain, originalSubdomain, setIsSaving, setOriginalSubdomain]);


  // 근태 메뉴 토글
  const handleToggleAttendance = useCallback(async () => {
    if (!projectId) return;
    
    const newValue = !isAttendanceEnabled;
    setIsAttendanceEnabled(newValue);
    
    try {
      await ProjectsService.update(
        { useAttendanceMenu: newValue },
        { "x-project-id": projectId }
      );
      setOriginalIsAttendanceEnabled(newValue);
      
      // localStorage에 저장하고 이벤트 발생
      setUseAttendanceMenu(newValue);
      
      showErrorModal({
        type: "success",
        headline: "근태 메뉴 설정이 변경되었습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } catch (error: any) {
      console.error("Failed to update attendance menu:", error);
      showErrorModal({
        type: "error",
        headline: "근태 메뉴 설정 변경 실패",
        description: "근태 메뉴 설정 변경에 실패했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
      // 실패 시 이전 상태로 복원
      setIsAttendanceEnabled(!newValue);
    }
  }, [projectId, isAttendanceEnabled, setIsAttendanceEnabled, setOriginalIsAttendanceEnabled]);

  // 프로젝트 삭제
  const handleDeleteService = useCallback(async () => {
    if (!projectId) return;
    
    try {
      await ProjectsService.remove({ "x-project-id": projectId });
      showErrorModal({
        type: "success",
        headline: "프로젝트가 삭제되었습니다.",
        hideCancel: true,
        confirmText: "확인",
        onConfirm: () => {
          // 프로젝트 목록 페이지로 리다이렉트
          window.location.href = "/projects";
        },
      });
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      showErrorModal({
        type: "error",
        headline: "프로젝트 삭제 실패",
        description: "프로젝트 삭제에 실패했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    }
  }, [projectId]);

  // Hydration 에러 방지를 위해 클라이언트에서만 렌더링
  if (!mounted || isLoading) {
    return (
      <div className="space-y-6">
        <div className="md:bg-card md:rounded-[14px] md:shadow-sm p-6 md:p-7 animate-pulse">
          <div className="h-6 bg-neutral-20 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-neutral-20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="md:space-y-8">
      <ProjectNameSection
        serviceName={serviceName}
        setServiceName={setServiceName}
        originalServiceName={originalServiceName}
        isSaving={isSaving}
        onUpdate={handleUpdateProjectName}
      />

      <BrandIconAndDomainSection
        subdomain={subdomain}
        setSubdomain={setSubdomain}
        originalSubdomain={originalSubdomain}
        brandIcon={brandIcon}
        isSaving={isSaving}
        onUpdateSubdomain={handleUpdateSubdomain}
        onBrandIconUpload={handleBrandIconUpload}
        onRemoveBrandIcon={handleRemoveBrandIcon}
      />

      <StatusManagementSection
        newStatusName={newStatusName}
        setNewStatusName={setNewStatusName}
        statuses={statuses}
        onAddStatus={handleAddStatus}
        onModifyStatus={handleModifyStatus}
        onDeleteStatus={handleDeleteStatus}
      />

      <ProjectFeaturesSection
        isAttendanceEnabled={isAttendanceEnabled}
        isSaving={isSaving}
        onToggle={handleToggleAttendance}
      />

      <ProjectDeleteSection
        serviceName={serviceName}
        onDelete={() => setIsDeleteModalOpen(true)}
      />

      {/* Service Delete Modal */}
      <ServiceDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteService}
        serviceName={serviceName}
      />
    </div>
  );
}