"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AssetsService } from "@/services/assets";
import { ProjectsService } from "@/services/projects";

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
  const domainHint = useMemo(() => {
    if (!subdomain) return "영문 소문자, 숫자, 하이픈(-) 사용 가능 (3-30자)";
    if (domainChecking) return "중복 확인 중...";
    if (domainAvailable === true) return "사용 가능한 도메인입니다";
    if (domainAvailable === false) return "이미 사용 중인 도메인입니다";
    return "중복확인을 눌러 확인하세요";
  }, [subdomain, domainChecking, domainAvailable]);

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

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      let logoUrl: string | undefined = undefined;
      if (iconFile) {
        // 1) presign → 2) upload → 3) use fileUrl
        const presigned = await AssetsService.presignAttachment({ fileName: iconFile.name, fileType: iconFile.type || "application/octet-stream" });
        const { uploadUrl, fileUrl, url } = (presigned as any).data || {};
        const putUrl: string | undefined = uploadUrl || url;
        if (putUrl) await AssetsService.uploadToS3(putUrl, iconFile);
        logoUrl = fileUrl;
      }

      await ProjectsService.create({
        name: projectName.trim(),
        subDomain: subdomain || undefined,
        logoUrl,
      });
      await onCreated();
    } catch (e) {
      alert("생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => !submitting && onClose()} />
      <div className="relative bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.37)] w-[848px] h-[597px] flex flex-col">
        {/* 헤더 */}
        <div className="h-[64px] flex items-center px-7">
          <div className="text-[18px] font-semibold text-[#000]">새 프로젝트 생성</div>
          <button aria-label="close" className="ml-auto w-6 h-6 grid place-items-center" onClick={() => !submitting && onClose()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18L18 6M6 6L18 18" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* 단계 인디케이터 */}
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex flex-col items-center gap-3">
            <div className={`w-9 h-9 rounded-full grid place-items-center ${step >= 1 ? "bg-[#D6FAE8]" : "bg-[#EDEDED]"}`}>
              <span className={`text-[18px] font-semibold ${step >= 1 ? "text-[#00B55B]" : "text-[#808080]"}`}>1</span>
            </div>
            <div className={`text-[14px] font-medium ${step >= 1 ? "text-[#00B55B]" : "text-[#808080]"}`}>기본정보</div>
          </div>
          <div className="w-[60px] h-px bg-[#E2E2E2]" />
          <div className="flex flex-col items-center gap-3">
            <div className={`w-9 h-9 rounded-full grid place-items-center ${step >= 2 ? "bg-[#D6FAE8]" : "bg-[#EDEDED]"}`}>
              <span className={`text-[18px] font-semibold ${step >= 2 ? "text-[#00B55B]" : "text-[#808080]"}`}>2</span>
            </div>
            <div className={`text-[14px] font-medium ${step >= 2 ? "text-[#00B55B]" : "text-[#808080]"}`}>도메인 설정</div>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 px-7 pt-6">
          {step === 1 ? (
            <div>
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
                    <img src="/please_drag.png" alt="클릭하거나 드래그하여 업로드" className="w-full h-full object-contain" />
                  )}
                  </div>
                </div>
                <div className="mt-3 text-center text-[14px] text-[#808080]">PNG, JPG, SVG 파일 (최대 5MB) · 정사각형 이미지 권장</div>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={onFileChange} />
              </div>

              {/* 프로젝트 이름 */}
              <div className="mt-4 h-[90px] rounded-[5px] bg-[#F8F8F8] px-6 py-3">
                <div className="text-[14px] font-medium text-[#000]">프로젝트 이름 <span className="text-[#F00]">*</span></div>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="프로젝트 이름을 입력하세요"
                  className="mt-2 w-full h-[34px] rounded-[5px] border border-[#E2E2E2] px-3 text-[14px] text-[#000]"
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="rounded-[5px] bg-[#F8F8F8] px-6 py-3">
                <div className="text-[14px] font-medium text-[#000]">프로젝트에서 사용할 서브 도메인을 설정해주세요.</div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={subdomain}
                    onChange={(e) => {
                      setSubdomain(e.target.value.toLowerCase());
                      setDomainAvailable(null);
                    }}
                    placeholder="myservice"
                    className="flex-1 h-[40px] rounded-[8px] border border-[#E2E2E2] px-3"
                  />
                  <div className="px-3 h-[40px] grid place-items-center rounded-[8px] border border-[#E2E2E2] text-[#000]">.talkgate.im</div>
                  <button
                    className="h-[40px] px-3 rounded-[8px] bg-[#252525] text-[#D0D0D0] text-[14px]"
                    type="button"
                    onClick={validateSubdomain}
                    disabled={domainChecking || !subdomain}
                  >
                    중복확인
                  </button>
                </div>
                <div className={`mt-2 text-[14px] ${domainAvailable === false ? "text-[#D93025]" : domainAvailable === true ? "text-[#00B55B]" : "text-[#808080]"}`}>{domainHint}</div>
                <div className="mt-4 rounded-[5px] bg-white text-[#6b7280] text-[13px] px-4 py-3">
                  도메인을 나중에 설정하시겠습니까? 이 단계를 건너뛰면 무작위 도메인이 자동으로 생성됩니다. 언제든지 설정 &gt; 일반에서 변경할 수 있습니다.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 영역 */}
        <div className="border-t border-[#E2E2E2] px-7 py-4 flex items-center justify-end gap-2">
          <button className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#000] bg-white" onClick={() => onClose()}>
            취소
          </button>
          {step === 2 && (
            <button
              className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#000] bg-white"
              onClick={() => setStep(1)}
              disabled={submitting}
            >
              이전
            </button>
          )}
          {step === 1 ? (
            <button
              className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setStep(2)}
              disabled={!canGoNext}
            >
              다음
            </button>
          ) : (
            <button
              className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={submitting || !canGoNext}
            >
              {submitting ? "생성 중..." : "완료"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


