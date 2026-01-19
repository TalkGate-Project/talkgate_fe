import { useState, useEffect } from "react";
import { ProjectsService } from "@/services/projects";
import { CustomerNoteCategoriesService } from "@/services/customerNoteCategories";
import { setUseAttendanceMenu } from "@/lib/project";
import type { CustomerNoteCategory } from "@/types/customerNoteCategories";

/**
 * 일반 설정 초기 데이터 로드 및 상태 관리를 담당하는 훅
 */
export function useGeneralSettings(projectId: string | null) {
  // 프로젝트 정보
  const [serviceName, setServiceName] = useState("");
  const [originalServiceName, setOriginalServiceName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [originalSubdomain, setOriginalSubdomain] = useState("");
  const [brandIcon, setBrandIcon] = useState<string | null>(null);
  const [originalBrandIcon, setOriginalBrandIcon] = useState<string | null>(null);
  
  // 처리상태
  const [statuses, setStatuses] = useState<CustomerNoteCategory[]>([]);
  
  // 프로젝트 기능
  const [isAttendanceEnabled, setIsAttendanceEnabled] = useState(true);
  const [originalIsAttendanceEnabled, setOriginalIsAttendanceEnabled] = useState(true);
  
  // UI 상태
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 클라이언트 마운트 감지
  useEffect(() => {
    setMounted(true);
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      
      setIsLoading(true);
      try {
        // 프로젝트 정보 조회
        const projectResponse = await ProjectsService.detailById({
          "x-project-id": projectId,
        });
        
        if (projectResponse.data?.data) {
          const project = projectResponse.data.data;
          setServiceName(project.name);
          setOriginalServiceName(project.name);
          setSubdomain(project.subDomain);
          setOriginalSubdomain(project.subDomain);
          setBrandIcon(project.logoUrl || null);
          setOriginalBrandIcon(project.logoUrl || null);
          setIsAttendanceEnabled(project.useAttendanceMenu);
          setOriginalIsAttendanceEnabled(project.useAttendanceMenu);
          
          // localStorage에도 동기화
          setUseAttendanceMenu(project.useAttendanceMenu);
        }
        
        // 고객 처리상태 조회
        const categoriesResponse = await CustomerNoteCategoriesService.list({
          "x-project-id": projectId,
        });
        if (categoriesResponse.data?.data) {
          setStatuses(categoriesResponse.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch settings data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [projectId]);

  return {
    // 프로젝트 정보
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
    // 처리상태
    statuses,
    setStatuses,
    // 프로젝트 기능
    isAttendanceEnabled,
    setIsAttendanceEnabled,
    originalIsAttendanceEnabled,
    setOriginalIsAttendanceEnabled,
    // UI 상태
    isLoading,
    isSaving,
    setIsSaving,
    mounted,
  };
}
