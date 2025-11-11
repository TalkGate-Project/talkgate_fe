"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AssetsService } from "@/services/assets";
import { ProjectsService } from "@/services/projects";
import pleaseDragImg from "@/assets/images/projects/please_drag.png";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateProjectModal({ onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  // 1단계: 브랜드 아이콘 + 프로젝트 이름
  const [projectName, setProjectName] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 2단계: 서브도메인
  const [subdomain, setSubdomain] = useState("");
  const [domainChecking, setDomainChecking] = useState(false);
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);

  const onPickFile = useCallback(() => fileInputRef.current?.click(), []);
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setIconFile(file);
    if (file) setIconPreview(URL.createObjectURL(file));
    else setIconPreview(null);
  }, []);

  const validateSubdomain = useCallback(async () => {
    if (!subdomain || subdomain.length < 3) {
      setDomainAvailable(null);
      return;
    }
    try {
      setDomainChecking(true);
      const res = await ProjectsService.checkSubDomainDuplicate(subdomain);
      const payload = res.data;
      const duplicateInfo = payload?.data;
      const isDuplicate = Boolean(duplicateInfo?.isDuplicate);
      setDomainAvailable(!isDuplicate);
    } catch {
      setDomainAvailable(false);
    } finally {
      setDomainChecking(false);
    }
  }, [subdomain]);

  const canGoNext = step === 1 ? (Boolean(iconFile) && projectName.trim().length > 0) : Boolean(subdomain && domainAvailable !== false);

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

  async function handleSubmit() {
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

      await ProjectsService.create({
        name: projectName.trim(),
        subDomain: subdomain || undefined,
        logoUrl,
        useAttendanceMenu: false,
      });
      await onCreated();
    } catch (e) {
      console.error("Project creation failed:", e);
      const errorMessage = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
      alert(`생성에 실패했습니다: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  }

  const handleSkip = () => {
    setSubdomain("");
    handleSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.37)] w-[848px] h-[568px] flex flex-col">
        {/* 헤더 */}
        <div className="h-[64px] flex items-center px-7 border-b border-[#E2E2E266]">
          <div className="text-[18px] font-semibold leading-[21px] text-[#000]">새 프로젝트 생성</div>
          <button
            aria-label="close"
            className="ml-auto w-6 h-6 grid place-items-center"
            onClick={() => !submitting && onClose()}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18L18 6M6 6L18 18" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* 단계 인디케이터 */}
        <div className="flex items-center justify-center gap-[30px] mt-8 mb-8">
          <div className="flex flex-col items-center gap-[17px]">
            <div className={`w-9 h-9 rounded-full grid place-items-center ${step >= 1 ? "bg-[#D6FAE8]" : "bg-[#EDEDED]"}`}>
              <span className={`text-[18px] font-semibold leading-[21px] ${step >= 1 ? "text-[#00B55B]" : "text-[#808080]"}`}>
                1
              </span>
            </div>
            <div className={`text-[14px] font-medium leading-[17px] ${step >= 1 ? "text-[#00B55B]" : "text-[#808080]"}`}>
              기본정보
            </div>
          </div>
          <div className="w-[60px] h-px bg-[#E2E2E2]" />
          <div className="flex flex-col items-center gap-[17px]">
            <div className={`w-9 h-9 rounded-full grid place-items-center ${step >= 2 ? "bg-[#D6FAE8]" : "bg-[#EDEDED]"}`}>
              <span className={`text-[18px] font-semibold leading-[21px] ${step >= 2 ? "text-[#00B55B]" : "text-[#808080]"}`}>
                2
              </span>
            </div>
            <div className={`text-[14px] font-medium leading-[17px] ${step >= 2 ? "text-[#00B55B]" : "text-[#808080]"}`}>
              도메인 설정
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 px-7 overflow-y-auto">
          {step === 1 ? (
            <div className="space-y-4">
              {/* 브랜드 아이콘 영역 */}
              <div className="h-[181px] rounded-[5px] bg-[#F8F8F8] px-6 py-3">
                <div className="text-[14px] font-medium text-[#000]">브랜드 아이콘</div>
                {/* 드롭존 */}
                <div className="mt-2 flex items-center justify-center">
                  <div
                    className="w-[100px] h-[100px] rounded-[14px] border border-dashed border-[#E2E2E2] bg-white overflow-hidden cursor-pointer grid place-items-center"
                    onClick={onPickFile}
                  >
                    {iconPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={iconPreview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pleaseDragImg.src} alt="클릭하거나 드래그하여 업로드" className="w-full h-full object-contain" />
                    )}
                  </div>
                </div>
                <div className="mt-3 text-center text-[14px] text-[#808080]">PNG, JPG, SVG 파일 (최대 5MB) · 정사각형 이미지 권장</div>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={onFileChange} />
              </div>

              {/* 프로젝트 이름 */}
              <div className="h-[90px] rounded-[5px] bg-[#F8F8F8] px-6 py-3">
                <div className="text-[14px] font-medium text-[#000]">
                  프로젝트 이름 <span className="text-[#F00]">*</span>
                </div>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="프로젝트 이름을 입력하세요"
                  className="mt-2 w-full h-[34px] rounded-[5px] border border-[#E2E2E2] px-3 text-[14px] text-[#000] bg-[#fff]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 안내 문구 */}
              <div className="text-center text-[14px] font-medium leading-[17px] text-[#000] mb-6">
                프로젝트에서 사용할 서브 도메인을 설정해주세요.
              </div>

              {/* 서브도메인 설정 섹션 */}
              <div className="rounded-[5px] bg-[#F8F8F8] px-6 py-3 h-[146px] flex flex-col">
                <div className="text-[14px] font-medium leading-[24px] text-[#000] mb-2">서브도메인 설정</div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 relative">
                    <input
                      value={subdomain}
                      onChange={(e) => {
                        setSubdomain(e.target.value.toLowerCase());
                        setDomainAvailable(null);
                      }}
                      placeholder="myservice"
                      className="w-full h-[34px] rounded-[5px] border border-[#E2E2E2] px-3 pr-[85px] text-[14px] font-medium leading-[17px] text-[#000] bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-medium leading-[17px] text-[#000]">
                      .talkgate.im
                    </span>
                  </div>
                  <button
                    className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold leading-[17px] whitespace-nowrap disabled:opacity-50"
                    type="button"
                    onClick={validateSubdomain}
                    disabled={domainChecking || !subdomain}
                  >
                    {domainChecking ? "확인 중..." : "중복확인"}
                  </button>
                </div>
                <div className="text-[14px] font-medium leading-[24px] text-[#808080]">
                  <div>• 영문 소문자, 숫자, 하이픈(-) 사용 가능 (3-30자)</div>
                  <div>• 하이픈(-)으로 시작하거나 끝날 수 없습니다</div>
                </div>
              </div>

              {/* 건너뛰기 섹션 */}
              <div className="rounded-[5px] bg-[#F8F8F8] px-6 py-3 h-[104px] flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-medium leading-[24px] text-[#000] mb-2">도메인을 나중에 설정하시겠습니까?</div>
                  <div className="text-[14px] font-medium leading-[24px] text-[#808080]">
                    이 단계를 건너뛰면 무작위 도메인이 자동으로 생성됩니다.
                    <br />
                    언제든지 설정 &gt; 일반에서 변경할 수 있습니다.
                  </div>
                </div>
                <button
                  className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] bg-white text-[#000] text-[14px] font-semibold leading-[17px] disabled:opacity-50"
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
        <div className="border-t border-[#E2E2E266] px-7 py-4 flex items-center justify-end gap-3">
          <button
            className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#000] bg-white disabled:opacity-50"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
          >
            취소
          </button>
          {step === 2 && (
            <button
              className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#000] bg-white disabled:opacity-50"
              onClick={() => setStep(1)}
              disabled={submitting}
            >
              이전
            </button>
          )}
          {step === 1 ? (
            <button
              className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold leading-[17px] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setStep(2)}
              disabled={!canGoNext || submitting}
            >
              다음
            </button>
          ) : (
            <button
              className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold leading-[17px] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
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
