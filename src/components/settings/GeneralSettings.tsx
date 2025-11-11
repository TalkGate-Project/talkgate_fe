"use client";

import { useState, useEffect } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { ProjectsService } from "@/services/projects";
import { CustomerNoteCategoriesService } from "@/services/customerNoteCategories";
import { AssetsService } from "@/services/assets";
import { setUseAttendanceMenu } from "@/lib/project";
import type { CustomerNoteCategory } from "@/types/customerNoteCategories";
import ServiceDeleteModal from "@/components/common/ServiceDeleteModal";

export default function GeneralSettings() {
  const [projectId] = useSelectedProjectId();
  
  // 프로젝트 정보
  const [serviceName, setServiceName] = useState("");
  const [originalServiceName, setOriginalServiceName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [originalSubdomain, setOriginalSubdomain] = useState("");
  const [brandIcon, setBrandIcon] = useState<string | null>(null);
  const [originalBrandIcon, setOriginalBrandIcon] = useState<string | null>(null);
  const [brandIconFile, setBrandIconFile] = useState<File | null>(null);
  
  // 처리상태
  const [newStatusName, setNewStatusName] = useState("");
  const [statuses, setStatuses] = useState<CustomerNoteCategory[]>([]);
  
  // 프로젝트 기능
  const [isAttendanceEnabled, setIsAttendanceEnabled] = useState(true);
  const [originalIsAttendanceEnabled, setOriginalIsAttendanceEnabled] = useState(true);
  
  // UI 상태
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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

  // 프로젝트 이름 변경
  const handleUpdateProjectName = async () => {
    if (!projectId || serviceName === originalServiceName) return;
    
    setIsSaving(true);
    try {
      await ProjectsService.update(
        { name: serviceName },
        { "x-project-id": projectId }
      );
      setOriginalServiceName(serviceName);
      alert("프로젝트 이름이 변경되었습니다.");
    } catch (error) {
      console.error("Failed to update project name:", error);
      alert("프로젝트 이름 변경에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 서브도메인 변경
  const handleUpdateSubdomain = async () => {
    if (!projectId || subdomain === originalSubdomain) return;
    
    setIsSaving(true);
    try {
      await ProjectsService.update(
        { subDomain: subdomain },
        { "x-project-id": projectId }
      );
      setOriginalSubdomain(subdomain);
      alert("서브도메인이 변경되었습니다.");
    } catch (error) {
      console.error("Failed to update subdomain:", error);
      alert("서브도메인 변경에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 브랜드 아이콘 업로드
  const handleBrandIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("파일 크기는 5MB를 초과할 수 없습니다.");
        return;
      }
      
      // 파일 타입 체크
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        alert("PNG, JPG, WEBP 파일만 업로드 가능합니다.");
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
    }
  };

  // 브랜드 아이콘 S3 업로드 및 프로젝트 업데이트
  const uploadBrandIcon = async (file: File) => {
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
      alert("브랜드 아이콘이 업로드되었습니다.");
    } catch (error) {
      console.error("Failed to upload brand icon:", error);
      alert("브랜드 아이콘 업로드에 실패했습니다.");
      // 실패 시 이전 상태로 복원
      setBrandIcon(originalBrandIcon);
      setBrandIconFile(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveBrandIcon = async () => {
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
      alert("브랜드 아이콘이 삭제되었습니다.");
    } catch (error) {
      console.error("Failed to remove brand icon:", error);
      alert("브랜드 아이콘 삭제에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 처리상태 추가
  const handleAddStatus = async () => {
    if (!newStatusName.trim() || !projectId) return;
    
    try {
      const response = await CustomerNoteCategoriesService.create(
        { name: newStatusName.trim() },
        { "x-project-id": projectId }
      );
      
      if (response.data?.data) {
        setStatuses([...statuses, response.data.data]);
        setNewStatusName("");
      }
    } catch (error) {
      console.error("Failed to create status:", error);
      alert("처리상태 추가에 실패했습니다.");
    }
  };

  // 처리상태 수정
  const handleModifyStatus = async (id: number, currentName: string) => {
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
        setStatuses(statuses.map(status => 
          status.id === id ? response.data.data : status
        ));
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("처리상태 수정에 실패했습니다.");
    }
  };

  // 처리상태 삭제
  const handleDeleteStatus = async (id: number) => {
    if (!projectId || !confirm("정말 삭제하시겠습니까?")) return;
    
    try {
      await CustomerNoteCategoriesService.remove(
        String(id),
        { "x-project-id": projectId }
      );
      setStatuses(statuses.filter(status => status.id !== id));
    } catch (error) {
      console.error("Failed to delete status:", error);
      alert("처리상태 삭제에 실패했습니다.");
    }
  };

  // 근태 메뉴 토글
  const handleToggleAttendance = async () => {
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
      
      alert("근태 메뉴 설정이 변경되었습니다.");
    } catch (error) {
      console.error("Failed to update attendance menu:", error);
      alert("근태 메뉴 설정 변경에 실패했습니다.");
      // 실패 시 이전 상태로 복원
      setIsAttendanceEnabled(!newValue);
    }
  };

  // 프로젝트 삭제
  const handleDeleteService = async () => {
    if (!projectId) return;
    
    try {
      await ProjectsService.remove({ "x-project-id": projectId });
      alert("프로젝트가 삭제되었습니다.");
      // 프로젝트 목록 페이지로 리다이렉트
      window.location.href = "/projects";
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("프로젝트 삭제에 실패했습니다.");
    }
  };

  // Hydration 에러 방지를 위해 클라이언트에서만 렌더링
  if (!mounted || isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-[14px] shadow-sm p-7 animate-pulse">
          <div className="h-6 bg-neutral-20 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-neutral-20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 일반설정 - 프로젝트 이름 */}
      <div className="bg-card rounded-[14px] shadow-sm p-7">
        <h1 className="text-[24px] font-bold text-neutral-90 mb-8 leading-[20px]">일반설정</h1>
        
        <div className="border-t border-border mb-6"></div>
        
        <h3 className="text-[16px] font-semibold text-foreground mb-4 tracking-[0.2px]">프로젝트 이름</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground"
            placeholder="이름"
            disabled={isSaving}
          />
          <button 
            onClick={handleUpdateProjectName}
            disabled={isSaving || serviceName === originalServiceName}
            className="px-3 py-2 bg-neutral-90 text-neutral-20 text-[14px] font-semibold rounded-[5px] hover:opacity-90 transition-colors tracking-[-0.02em] leading-[17px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "변경중..." : "이름변경"}
          </button>
        </div>
      </div>

      {/* 브랜드 아이콘 및 도메인 */}
      <div className="bg-card rounded-[14px] shadow-sm p-7">
        <h3 className="text-[16px] font-semibold text-foreground mb-1 tracking-[0.2px]">브랜드 아이콘 및 도메인</h3>
        <p className="text-[14px] text-neutral-60 mb-6 tracking-[0.2px]">브랜드 아이콘과 도메인을 설정합니다.</p>
        
        <div className="border-t border-border mb-6"></div>

        {/* 서브 도메인 */}
        <div className="mb-6">
          <label className="text-[14px] text-neutral-60 mb-2 block tracking-[0.2px]">서브 도메인</label>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 flex items-center px-3 py-2 border border-border rounded-[5px] bg-card">
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                className="flex-1 text-[14px] text-neutral-60 bg-transparent focus:outline-none tracking-[-0.02em]"
                placeholder="myservice"
                disabled={isSaving}
              />
              <span className="text-[14px] text-foreground ml-2 tracking-[-0.02em]">.talkgate.im</span>
            </div>
            <button 
              onClick={handleUpdateSubdomain}
              disabled={isSaving || subdomain === originalSubdomain}
              className="px-3 py-2 bg-neutral-90 text-neutral-20 text-[14px] font-semibold rounded-[5px] hover:opacity-90 transition-colors tracking-[-0.02em] leading-[17px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "변경중..." : "이름변경"}
            </button>
          </div>
          <ul className="text-[14px] text-neutral-60 space-y-1 leading-6">
            <li>• 영문 소문자, 숫자, 하이픈(-) 사용 가능 (3-30자)</li>
            <li>• 하이픈(-)으로 시작하거나 끝날 수 없습니다.</li>
          </ul>
        </div>

        {/* 브랜드 아이콘 */}
        <div>
          <label className="text-[14px] text-neutral-60 mb-4 block tracking-[0.2px]">브랜드 아이콘</label>
          <div className="flex items-center justify-center">
            <div className="relative">
              <label 
                htmlFor="brand-icon-upload"
                className={`block w-20 h-20 border border-dashed border-border rounded-xl cursor-pointer overflow-hidden bg-card hover:bg-neutral-10 transition-colors ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {brandIcon ? (
                  <img src={brandIcon} alt="Brand Icon" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-40">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </label>
              <input
                id="brand-icon-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleBrandIconUpload}
                className="hidden"
                disabled={isSaving}
              />
              {brandIcon && !isSaving && (
                <button
                  onClick={handleRemoveBrandIcon}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-foreground border-2 border-border rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3L9 9M9 3L3 9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
          <p className="text-[14px] text-neutral-60 text-center mt-4 leading-6">
            • PNG, JPG, WEBP파일 (최대 5MB)
            • 정사각형 이미지 권장
          </p>
        </div>
      </div>

      {/* 처리상태 관리 */}
      <div className="bg-card rounded-[14px] shadow-sm p-7">
        <h3 className="text-[16px] font-semibold text-foreground mb-1 tracking-[0.2px]">처리상태 관리</h3>
        <p className="text-[14px] text-neutral-60 mb-6 tracking-[0.2px]">고객 상담에서 사용될 처리상태를 관리합니다.</p>
        
        <div className="border-t border-border mb-6"></div>
        
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddStatus()}
            className="flex-1 px-3 py-2 border border-border rounded-[5px] text-[14px] text-neutral-60 bg-card focus:outline-none focus:border-foreground tracking-[-0.02em]"
            placeholder="새 상태 이름을 입력하세요"
          />
          <button 
            onClick={handleAddStatus}
            className="cursor-pointer px-3 py-2 bg-neutral-90 text-neutral-20 text-[14px] font-semibold rounded-[5px] hover:opacity-90 transition-colors tracking-[-0.02em] leading-[17px]"
          >
            추가
          </button>
        </div>

        {/* 상태 목록 */}
        <div className="space-y-2">
          {statuses.map((status) => (
            <div key={status.id} className="flex items-center justify-between py-2 px-6 bg-neutral-10 rounded-[5px] h-[50px]">
              <span className="text-[16px] font-semibold text-foreground leading-[19px]">{status.name}</span>
              <div className="flex gap-3">
                <button
                  onClick={() => handleModifyStatus(status.id, status.name)}
                  className="cursor-pointer px-3 py-1.5 text-[14px] font-semibold text-foreground bg-card border border-border rounded-[5px] hover:bg-neutral-10 transition-colors tracking-[-0.02em] leading-[17px]"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDeleteStatus(status.id)}
                  className="cursor-pointer px-3 py-1.5 text-[14px] font-semibold text-foreground bg-card border border-border rounded-[5px] hover:bg-neutral-10 transition-colors tracking-[-0.02em] leading-[17px]"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 프로젝트 기능 */}
      <div className="bg-card rounded-[14px] shadow-sm p-7">
        <h3 className="text-[16px] font-semibold text-foreground mb-1 tracking-[0.2px]">프로젝트 기능</h3>
        <p className="text-[14px] text-neutral-60 mb-6 tracking-[0.2px]">출퇴근 기능 및 근태메뉴를 활성화 합니다.</p>
        
        <div className="border-t border-border mb-6"></div>
        
        <div className="flex items-center justify-between py-3 px-6 bg-[rgba(214,250,232,0.3)] rounded-[5px] h-[48px]">
          <span className="text-[16px] font-semibold text-foreground leading-[19px]">근태 메뉴 사용</span>
          <button
            onClick={handleToggleAttendance}
            disabled={isSaving}
            className={`cursor-pointer relative w-10 h-6 rounded-full transition-colors flex items-center ${
              isAttendanceEnabled ? "bg-primary-60 justify-end" : "bg-neutral-30 justify-start"
            } px-1 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="w-4 h-4 bg-neutral-0 rounded-full" />
          </button>
        </div>
      </div>

      {/* 프로젝트 삭제 */}
      <div className="bg-card rounded-[14px] shadow-sm p-7">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-[16px] font-semibold text-danger-40 tracking-[0.2px]">프로젝트 삭제</h3>
          <span className="px-3 py-1 bg-danger-10 text-[12px] font-medium text-danger-40 rounded-[30px] h-[22px] leading-[14px] opacity-80">
            주의
          </span>
        </div>
        <p className="text-[14px] text-danger-40 mb-6 tracking-[0.2px]">
          프로젝트를 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
        </p>
        
        <div className="border-t border-border mb-6"></div>
        
        <div className="flex items-center justify-between py-3 px-6 bg-[rgba(255,235,235,0.5)] rounded-[5px] h-[48px]">
          <span className="text-[16px] font-semibold text-danger-40 leading-[19px]">프로젝트 삭제</span>
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="cursor-pointer px-3 py-1.5 bg-danger-40 text-neutral-0 text-[14px] font-semibold rounded-[5px] hover:opacity-90 transition-colors tracking-[-0.02em] leading-[17px] h-[34px]"
          >
            프로젝트 삭제
          </button>
        </div>
      </div>

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