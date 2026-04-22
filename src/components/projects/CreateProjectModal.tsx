"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AssetsService } from "@/services/assets";
import { ProjectsService } from "@/services/projects";
import pleaseDragImg from "@/assets/images/projects/please_drag.webp";
import pleaseDragDarkImg from "@/assets/images/projects/please_drag_dark.webp";
import { showErrorModal } from "@/lib/errorModalEvents";
import type { Project } from "@/types/projects";

type Props = {
  onClose: () => void;
  onCreated: (created?: Project) => void;
};

// 서브도메인 형식 검증 패턴 (영문 소문자, 숫자, 하이픈만 허용)
const SUBDOMAIN_PATTERN = /^[a-z0-9-]+$/;

// 프로젝트 이름 최대 글자수
const PROJECT_NAME_MAX_LENGTH = 20;

export default function CreateProjectModal({ onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  // 1단계: 브랜드 아이콘 + 프로젝트 이름
  const [projectName, setProjectName] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 2단계: 서브도메인
  const [subdomain, setSubdomain] = useState("");
  const [domainChecking, setDomainChecking] = useState(false);
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null); // 상세 에러 메시지
  const [lastCheckedSubdomain, setLastCheckedSubdomain] = useState("");

  const onPickFile = useCallback(() => fileInputRef.current?.click(), []);
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setIconFile(file);
    if (file) setIconPreview(URL.createObjectURL(file));
    else setIconPreview(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // relatedTarget이 현재 요소의 자식이 아닐 때만 드래그 상태 해제
    const currentTarget = e.currentTarget;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!currentTarget.contains(relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0] || null;
    if (file && file.type.startsWith("image/")) {
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  }, []);

  // 서브도메인 형식 검증 (영문 소문자, 숫자, 하이픈만 허용, 3-30자)
  const isValidSubdomainFormat = useMemo(() => {
    if (!subdomain) return false;
    if (subdomain.length < 3 || subdomain.length > 30) return false;
    if (!SUBDOMAIN_PATTERN.test(subdomain)) return false;
    if (subdomain.startsWith("-") || subdomain.endsWith("-")) return false;
    return true;
  }, [subdomain]);

  const validateSubdomain = useCallback(async () => {
    setDomainError(null);
    
    if (!subdomain || subdomain.length < 3) {
      setDomainAvailable(null);
      return;
    }

    // 프론트엔드 형식 검증
    if (!SUBDOMAIN_PATTERN.test(subdomain)) {
      setDomainAvailable(false);
      setDomainError("영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.");
      return;
    }

    if (subdomain.startsWith("-") || subdomain.endsWith("-")) {
      setDomainAvailable(false);
      setDomainError("하이픈(-)으로 시작하거나 끝날 수 없습니다.");
      return;
    }

    if (subdomain.length > 30) {
      setDomainAvailable(false);
      setDomainError("서브도메인은 30자를 초과할 수 없습니다.");
      return;
    }

    setLastCheckedSubdomain(subdomain);
    try {
      setDomainChecking(true);
      const res = await ProjectsService.checkSubDomainDuplicate(subdomain);
      const payload = res.data;
      const duplicateInfo = payload?.data;
      const isDuplicate = Boolean(duplicateInfo?.isDuplicate);
      setDomainAvailable(!isDuplicate);
      if (isDuplicate) {
        setDomainError("이미 사용 중인 도메인입니다. 다른 도메인을 입력해주세요.");
      }
    } catch (err: any) {
      setDomainAvailable(false);
      // API 에러 메시지 파싱
      const message = err?.data?.message || err?.message || "";
      if (message.includes("regular expression") || message.includes("match")) {
        setDomainError("영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.");
      } else if (message) {
        setDomainError(message);
      } else {
        setDomainError("도메인 확인 중 오류가 발생했습니다.");
      }
    } finally {
      setDomainChecking(false);
    }
  }, [subdomain]);

  // 1단계에서는 프로젝트 이름만 필수, 브랜드 아이콘(이미지)은 선택 사항
  const canGoNext =
    step === 1
      ? projectName.trim().length > 0
      : Boolean(subdomain && domainAvailable === true);

  // 파일 타입을 정확히 감지하는 헬퍼 함수
  const getFileType = useCallback((file: File): string => {
    // 파일의 MIME 타입이 있으면 사용
    if (file.type) return file.type;
    
    // 확장자 기반으로 MIME 타입 추론
    const extension = file.name.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      svg: "image/svg+xml",
      gif: "image/gif",
      webp: "image/webp",
    };
    
    return mimeTypes[extension || ""] || "image/jpeg"; // 기본값
  }, []);

  async function handleSubmit(options?: { skipSubdomain?: boolean }) {
    if (submitting) return;
    setSubmitting(true);
    try {
      let logoUrl: string | undefined = undefined;
      if (iconFile) {
        // 1) 파일 타입 감지 (presigned URL 생성과 업로드 시 동일한 타입 사용)
        const fileType = getFileType(iconFile);
        
        // 2) Presigned URL 요청
        const presignedRes = await AssetsService.presignProjectLogo({
          fileName: iconFile.name,
          fileType,
        });
        
        // API 응답 구조: { result: true, data: { uploadUrl, fileUrl, fileName } }
        const presignedData = presignedRes.data?.data;
        if (!presignedData) {
          throw new Error("Failed to get presigned URL response");
        }

        const uploadUrl = presignedData.uploadUrl;
        if (!uploadUrl) {
          throw new Error("Upload URL is missing from response");
        }

        // 3) S3에 직접 업로드 (presigned URL 생성 시 사용한 fileType과 동일한 Content-Type 사용)
        await AssetsService.uploadToS3(uploadUrl, iconFile, fileType);

        // 4) 업로드 완료 후 fileUrl을 프로젝트 생성 API에 전달
        logoUrl = presignedData.fileUrl;
        if (!logoUrl) {
          throw new Error("File URL is missing from response");
        }
      }

      // 건너뛰기 옵션이 true면 서브도메인을 전송하지 않음
      const subDomainValue = options?.skipSubdomain ? undefined : (subdomain || undefined);

      const createRes = await ProjectsService.create({
        name: projectName.trim(),
        subDomain: subDomainValue,
        logoUrl,
        useAttendanceMenu: false,
      });
      const createdProject = createRes.data?.data as Project | undefined;
      await onCreated(createdProject);
    } catch (e) {
      console.error("Project creation failed:", e);
      showErrorModal({
        type: "error",
        headline: "잠시 후 다시 시도해주세요.",
        hideCancel: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const handleSkip = () => {
    // 건너뛰기 시 서브도메인 입력값 초기화 및 서브도메인 없이 생성
    setSubdomain("");
    setDomainAvailable(null);
    setDomainError(null);
    handleSubmit({ skipSubdomain: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:bg-black/50 md:dark:bg-[#000000CC]">
      {/* 모바일: 전체 화면, 데스크톱: 모달 오버레이 */}
      <div className="absolute inset-0 bg-black/50 dark:bg-[#000000CC] md:block hidden" />
      <div className="relative bg-card dark:bg-neutral-10 md:rounded-[14px] md:w-[848px] md:h-[597px] w-full h-full md:max-h-[597px] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center px-4 md:px-7 pt-4 md:pt-0 mb-[18px] md:mb-0">
          {/* 모바일: 뒤로가기 버튼 */}
          <button
            aria-label="back"
            className="cursor-pointer w-6 h-6 grid place-items-center md:hidden mr-2"
            onClick={() => !submitting && onClose()}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="[&_path]:stroke-[var(--neutral-50)]">
              <path d="M15 18L9 12L15 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="text-[18px] font-semibold leading-[1] text-foreground md:mt-[24px] md:mb-[35px] flex-1 md:flex-none">새 프로젝트 생성</div>
          {/* 데스크톱: 닫기 버튼 */}
          <button
            aria-label="close"
            className="cursor-pointer ml-auto w-6 h-6 grid place-items-center hidden md:grid"
            onClick={() => !submitting && onClose()}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="[&_path]:stroke-[var(--neutral-50)]">
              <path d="M6 18L18 6M6 6L18 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* 단계 인디케이터 */}
        <div className="flex justify-center gap-2 mb-4 md:mb-6 px-4 md:px-0">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-9 h-9 rounded-full grid place-items-center ${step >= 1 ? "bg-primary-10" : "bg-neutral-20"}`}>
              <span className={`text-[18px] font-semibold leading-[21px] ${step >= 1 ? "text-primary-80" : "text-neutral-60"}`}>
                1
              </span>
            </div>
            <div className={`text-[14px] font-medium leading-[17px] ${step >= 1 ? "text-primary-80" : "text-neutral-60"}`}>
              기본정보
            </div>
          </div>
          <div className="w-[60px] h-px bg-neutral-30 mt-[18px]" />
          <div className="flex flex-col items-center gap-2">
            <div className={`w-9 h-9 rounded-full grid place-items-center ${step >= 2 ? "bg-primary-10" : "bg-neutral-20"}`}>
              <span className={`text-[18px] font-semibold leading-[21px] ${step >= 2 ? "text-primary-80" : "text-neutral-60"}`}>
                2
              </span>
            </div>
            <div className={`text-[14px] font-medium leading-[17px] ${step >= 2 ? "text-primary-80" : "text-neutral-60"}`}>
              도메인 설정
            </div>
          </div>
        </div>

        <p className="mb-4 md:mb-[30px] text-[14px] md:text-body-3 text-center font-medium px-4 md:px-0">
          {step === 1
            ? "프로젝트의 브랜드 아이콘과 이름을 설정해주세요."
            : "프로젝트에서 사용할 서브도메인을 설정해주세요."}
        </p>

        {/* 본문 */}
        <div className="flex-1 px-4 md:px-6 overflow-y-auto pb-4 md:pb-0">
          {step === 1 ? (
            <div className="space-y-4 md:space-y-5">
              {/* 브랜드 아이콘 영역 */}
              <div
                className={`relative rounded-[5px] bg-neutral-10 dark:bg-neutral-25 px-4 md:px-6 py-3 md:h-[181px] ${isDragging ? "border-2 border-primary-80 border-dashed" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-[14px] font-medium text-foreground mb-2">브랜드 아이콘</div>
                {/* 드롭존 */}
                <div className="mt-2 flex items-center justify-center">
                  <div
                    className={`relative w-[100px] h-[100px] md:w-[100px] md:h-[100px] rounded-[14px] ${iconPreview ? "border border-dashed border-neutral-30" : ""} bg-card overflow-hidden cursor-pointer grid place-items-center`}
                    onClick={onPickFile}
                  >
                    {iconPreview ? (
                      <>
                        <img src={iconPreview} alt="preview" className="w-full h-full object-cover" />
                        {/* 모바일: 삭제 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIconFile(null);
                            setIconPreview(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 3L9 9M9 3L3 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <Image
                          src={pleaseDragImg}
                          alt="클릭하거나 드래그하여 업로드"
                          className="dark:hidden"
                          fill
                          style={{ objectFit: "contain" }}
                        />
                        <Image
                          src={pleaseDragDarkImg}
                          alt="클릭하거나 드래그하여 업로드"
                          className="hidden dark:block"
                          fill
                          style={{ objectFit: "contain" }}
                        />
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-center text-[14px] font-medium text-neutral-60">
                  PNG, JPG, SVG 파일
                  <br className="md:hidden" />
                  (최대 5MB) · 정사각형 이미지 권장
                </div>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={onFileChange} />
                {/* 드래그 중 오버레이 */}
                {isDragging && (
                  <div className="absolute inset-0 bg-primary-80/10 dark:bg-primary-80/20 rounded-[5px] flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-primary-80 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-[16px] font-semibold text-primary-80">여기에 드롭하세요</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 프로젝트 이름 */}
              <div className="rounded-[5px] bg-neutral-10 dark:bg-neutral-25 px-4 md:px-6 py-3 md:h-[90px]">
                <div className="text-[14px] font-medium text-foreground">
                  프로젝트 이름 <span className="text-danger-40">*</span>
                </div>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value.slice(0, PROJECT_NAME_MAX_LENGTH))}
                  placeholder="프로젝트 이름을 입력하세요"
                  maxLength={PROJECT_NAME_MAX_LENGTH}
                  className="mt-2 w-full h-[34px] rounded-[5px] border border-neutral-30 px-3 text-[14px] text-foreground bg-card"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 서브도메인 설정 섹션 */}
              <div className="rounded-[5px] bg-neutral-10 dark:bg-neutral-25 px-4 md:px-6 py-3 min-h-[146px] flex flex-col">
                <div className="text-[14px] font-medium leading-[24px] text-foreground mb-2">서브도메인 설정</div>
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 mb-2">
                  <div className="flex-1 relative">
                    <input
                      value={subdomain}
                      onChange={(e) => {
                        const nextValue = e.target.value.toLowerCase();
                        setSubdomain(nextValue);
                        setDomainAvailable(null);
                        setDomainError(null);
                      }}
                      placeholder="myservice"
                      className="w-full h-[34px] rounded-[5px] border border-neutral-30 px-3 pr-[85px] text-[14px] font-medium leading-[17px] text-foreground bg-card"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-medium leading-[17px] text-foreground">
                      .app.talkgate.im
                    </span>
                  </div>
                  <button
                    className="h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold leading-[17px] whitespace-nowrap disabled:opacity-50 w-full md:w-auto"
                    type="button"
                    onClick={validateSubdomain}
                    disabled={
                      domainChecking ||
                      !subdomain ||
                      subdomain === lastCheckedSubdomain
                    }
                  >
                    {domainChecking ? "확인 중..." : "중복확인"}
                  </button>
                </div>
                {domainAvailable !== null && (
                  <div
                    className={`text-[14px] font-medium leading-[24px] mb-2 ${
                      domainAvailable ? "text-primary-80" : "text-danger-40"
                    }`}
                  >
                    {domainAvailable
                      ? "사용가능한 도메인입니다."
                      : domainError || "도메인을 사용할 수 없습니다."}
                  </div>
                )}
                <div className="text-[14px] font-medium leading-[24px] text-neutral-60">
                  <div>• 영문 소문자, 숫자, 하이픈(-) 사용 가능 (3-30자)</div>
                  <div>• 하이픈(-)으로 시작하거나 끝날 수 없습니다</div>
                </div>
              </div>

              {/* 건너뛰기 섹션 */}
              <div className="rounded-[5px] bg-neutral-10 dark:bg-neutral-25 px-4 md:px-6 py-3 md:h-[104px] flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="text-[14px] font-medium leading-[24px] text-foreground mb-2">도메인을 나중에 설정하시겠습니까?</div>
                  <div className="text-[14px] font-medium leading-[24px] text-neutral-60">
                    이 단계를 건너뛰면 무작위 도메인이 자동으로 생성됩니다.
                    <br className="hidden md:block" />
                    <span className="md:hidden"> </span>
                    언제든지 설정 &gt; 일반에서 변경할 수 있습니다.
                  </div>
                </div>
                <button
                  className="h-[34px] px-3 rounded-[5px] border border-neutral-30 bg-card text-foreground text-[14px] font-semibold leading-[17px] disabled:opacity-50 w-full md:w-auto"
                  type="button"
                  onClick={handleSkip}
                  disabled={submitting}
                >
                  건너뛰기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 영역 */}
        <div className="md:border-t md:border-neutral-30 px-4 md:px-7 pt-4 md:pt-[18px] pb-4 md:pb-3 flex items-center justify-between md:justify-end gap-3">
          <button
            className="cursor-pointer h-[34px] flex-1 md:flex-none md:w-[50px] rounded-[5px] border border-neutral-30 text-[14px] font-semibold text-foreground bg-card disabled:opacity-50"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
          >
            취소
          </button>
          {step === 2 && (
            <button
              className="cursor-pointer h-[34px] w-[50px] rounded-[5px] border border-neutral-30 text-[14px] font-semibold text-foreground bg-card disabled:opacity-50 hidden md:block"
              onClick={() => setStep(1)}
              disabled={submitting}
            >
              이전
            </button>
          )}
          {step === 1 ? (
            <button
              className="cursor-pointer h-[34px] flex-1 md:flex-none md:w-[50px] rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold leading-[17px] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setStep(2)}
              disabled={!canGoNext || submitting}
            >
              다음
            </button>
          ) : (
            <button
              className="cursor-pointer h-[34px] flex-1 md:flex-none md:min-w-[50px] md:px-2 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold leading-[17px] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleSubmit()}
              disabled={submitting || !canGoNext}
            >
              {submitting ? "생성 중..." : "확인"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
