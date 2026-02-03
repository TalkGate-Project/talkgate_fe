"use client";

import { useState } from "react";
import Image from "next/image";
import { ProjectsService } from "@/services/projects";
import { ProjectPartnersService } from "@/services/projectPartners";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import type { Project } from "@/types/projects";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess?: () => void;
};

export default function PartnerRegisterModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: Props) {
  const [subdomain, setSubdomain] = useState("");
  const [description, setDescription] = useState("");
  const [lookupProject, setLookupProject] = useState<Project | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleLookup = async () => {
    const trimmed = subdomain.trim();
    if (!trimmed) {
      showErrorModal({
        type: "error",
        headline: "서브 도메인을 입력해주세요.",
        hideCancel: true,
      });
      return;
    }
    setLookupError(null);
    setLookupProject(null);
    setLookupLoading(true);
    try {
      const res = await ProjectsService.detailBySubDomain(trimmed);
      const data = res.data?.data;
      if (data && typeof data === "object" && typeof data.id === "number") {
        setLookupProject(data as Project);
      } else {
        setLookupError("조회된 프로젝트가 없습니다.");
      }
    } catch {
      setLookupError("조회된 프로젝트가 없습니다.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!lookupProject) {
      showErrorModal({
        type: "error",
        headline: "먼저 서브 도메인을 조회해 주세요.",
        hideCancel: true,
      });
      return;
    }
    if (!description.trim()) {
      showErrorModal({
        type: "error",
        headline: "설명을 입력해주세요.",
        hideCancel: true,
      });
      return;
    }
    setSubmitLoading(true);
    try {
      await ProjectPartnersService.create(
        { partnerProjectId: lookupProject.id, description: description.trim() },
        { "x-project-id": projectId }
      );
      showErrorModal({
        type: "success",
        headline: "업체가 등록되었습니다.",
        description: "대상 업체가 요청을 수락하면 파트너로 등록됩니다.",
        hideCancel: true,
        onConfirm: () => {
          handleClose();
          onSuccess?.();
        },
      });
    } catch (err: unknown) {
      const data =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { code?: string } }).data
          : undefined;
      const code = data?.code;
      const headline =
        code === "FORBIDDEN"
          ? "권한이 없습니다"
          : code === "PROJECT_NOT_FOUND"
            ? "프로젝트를 찾을 수 없습니다"
            : "업체 등록에 실패했습니다.";
      const description =
        code === "FORBIDDEN"
          ? "이 작업은 프로젝트 관리자만 할 수 있습니다."
          : code === "PROJECT_NOT_FOUND"
            ? "대상 프로젝트를 확인해 주세요."
            : "잠시 후 다시 시도해 주세요.";
      showErrorModal({
        type: "error",
        headline,
        description,
        hideCancel: true,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClose = () => {
    setSubdomain("");
    setDescription("");
    setLookupProject(null);
    setLookupError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50"
        onClick={() => !submitLoading && !lookupLoading && handleClose()}
      />
      <div
        className="relative w-[440px] mx-4 bg-white dark:bg-neutral-10 rounded-[14px] flex flex-col overflow-hidden"
        // style={{
        //   filter: "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))",
        //   boxShadow: "0px 13px 61px rgba(169, 169, 169, 0.366013)",
        // }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-[18px] font-semibold leading-[21px] text-black dark:text-white">
            업체등록
          </h2>
          <button
            type="button"
            aria-label="close"
            className="cursor-pointer w-6 h-6 flex items-center justify-center rounded-[5px] hover:opacity-70 transition-opacity text-[#B0B0B0] disabled:opacity-50"
            onClick={handleClose}
            disabled={submitLoading || lookupLoading}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <p className="text-[18px] font-semibold leading-[21px] text-black dark:text-white text-center px-6 pb-4">
          업체 정보를 등록해주세요.
        </p>

        {/* 연한 회색 박스: 인풋 영역 */}
        <div className="mx-6 mb-4 flex flex-col p-3 px-6 rounded-[5px] bg-[#F8F8F8] dark:bg-neutral-20">
          {/* 서브 도메인 */}
          <div className="flex flex-col gap-1">
            <label className="text-[14px] font-medium leading-[17px] tracking-[0.2px] text-[#808080] dark:text-neutral-50">
              서브 도메인
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={subdomain}
                onChange={(e) => {
                  setSubdomain(e.target.value);
                  setLookupError(null);
                  setLookupProject(null);
                }}
                placeholder="서브 도메인 입력"
                disabled={lookupLoading}
                className="flex-1 h-[34px] rounded-[5px] border border-[#E2E2E2] dark:border-neutral-60 bg-white dark:bg-neutral-10 px-3 py-2 text-[14px] font-medium leading-[17px] tracking-[-0.02em] text-black dark:text-white placeholder-[#808080] focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={lookupLoading || !subdomain.trim()}
                className="cursor-pointer min-w-[48px] h-[34px] rounded-[5px] bg-[#252525] dark:bg-neutral-80 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-[#EDEDED] dark:text-neutral-20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
              >
                {lookupLoading ? (
                  <LoadingSpinner size="sm" variant="white" aria-label="조회 중" />
                ) : (
                  "조회"
                )}
              </button>
            </div>
          </div>

          {/* 조회 결과: 썸네일 + 프로젝트명 또는 에러 */}
          {(lookupProject || lookupError) && (
            <div className="flex flex-row items-center gap-2 py-1 px-1 min-h-[28px] rounded-[5px] bg-[#F8F8F8] dark:bg-neutral-20 mt-2">
              {lookupError && (
                <p className="text-[13px] text-red-600 dark:text-red-400">
                  {lookupError}
                </p>
              )}
              {lookupProject && !lookupError && (
                <>
                  <div className="w-5 h-5 flex-shrink-0 rounded-full overflow-hidden bg-neutral-20 dark:bg-neutral-30 flex items-center justify-center">
                    {lookupProject.logoUrl ? (
                      <Image
                        src={lookupProject.logoUrl}
                        alt=""
                        width={20}
                        height={20}
                        className="w-5 h-5 object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-[10px] font-semibold text-neutral-60 dark:text-neutral-50">
                        {lookupProject.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] font-semibold leading-5 text-[#808080] dark:text-neutral-50 truncate flex-1 min-w-0">
                    {lookupProject.name}
                  </p>
                </>
              )}
            </div>
          )}

          {/* 설명 */}
          <div className="flex flex-col gap-1 mt-4">
            <label className="text-[14px] font-medium leading-[17px] tracking-[0.2px] text-[#808080] dark:text-neutral-50">
              설명
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="설명 입력"
              disabled={submitLoading}
              className="w-full h-[34px] rounded-[5px] border border-[#E2E2E2] dark:border-neutral-60 bg-white dark:bg-neutral-10 px-3 py-2 text-[14px] font-medium leading-[17px] tracking-[-0.02em] text-black dark:text-white placeholder-[#808080] focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* 구분선 + 푸터 버튼 */}
        <div className="border-t border-[#E2E2E2] dark:border-neutral-60 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitLoading || lookupLoading}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] dark:border-neutral-60 bg-white dark:bg-neutral-20 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-black dark:text-white hover:bg-neutral-10 dark:hover:bg-neutral-30 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitLoading || lookupLoading || !lookupProject}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-[#252525] dark:bg-neutral-80 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-[#EDEDED] dark:text-neutral-20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {submitLoading ? "등록 중..." : "확인"}
          </button>
        </div>
      </div>
    </div>
  );
}
