"use client";

import { useEffect, useState, useCallback } from "react";
import { ProjectPartnersService } from "@/services/projectPartners";
import { ApiKeysService } from "@/services/apiKeys";
import type { ProjectPartnerWithApiKey } from "@/types/projectPartners";
import Pagination from "@/components/common/Pagination";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import BaseModal from "@/components/common/BaseModal";

interface ApiKeyLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeyId: number;
  apiKeyName: string;
  projectId: string;
}

export default function ApiKeyLinkModal({
  isOpen,
  onClose,
  apiKeyId,
  apiKeyName,
  projectId,
}: ApiKeyLinkModalProps) {
  const [partners, setPartners] = useState<ProjectPartnerWithApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const limit = 5;

  const fetchPartners = useCallback(async () => {
    if (!projectId || !apiKeyId) return;

    setLoading(true);
    try {
      const headers = { "x-project-id": projectId };
      const response = await ProjectPartnersService.listWithApiKey(
        { apiKeyId, page, limit },
        headers
      );

      if (response.data?.data) {
        setPartners(response.data.data.partners);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch partners", err);
      showErrorModal({
        type: "error",
        headline: "협력업체 목록을 불러오는데 실패했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, apiKeyId, page]);

  useEffect(() => {
    if (isOpen) {
      fetchPartners();
    }
  }, [isOpen, fetchPartners]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPage(1);
      setPartners([]);
      setTogglingIds(new Set());
    }
  }, [isOpen]);

  const handleToggle = async (partner: ProjectPartnerWithApiKey) => {
    if (togglingIds.has(partner.id)) return;

    setTogglingIds((prev) => new Set(prev).add(partner.id));

    try {
      const headers = { "x-project-id": projectId };

      if (partner.isConnectedToApiKey) {
        // 연결 해제
        await ApiKeysService.disconnectPartner(apiKeyId, partner.id, headers);
      } else {
        // 연결
        await ApiKeysService.connectPartner(apiKeyId, partner.id, headers);
      }

      // 성공 시 로컬 상태 업데이트
      setPartners((prev) =>
        prev.map((p) =>
          p.id === partner.id
            ? { ...p, isConnectedToApiKey: !p.isConnectedToApiKey }
            : p
        )
      );
    } catch (err) {
      console.error("Failed to toggle partner connection", err);
      showErrorModal({
        type: "error",
        headline: partner.isConnectedToApiKey
          ? "연결 해제에 실패했습니다."
          : "연결에 실패했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(partner.id);
        return next;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      onClose={onClose}
      zIndexClassName="z-50"
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      ariaLabel={`${apiKeyName} API 연동`}
      disableAutoContainerSizing
      containerClassName="w-[calc(100%-2rem)] md:w-[500px] max-h-[90vh] bg-white dark:bg-neutral-10 rounded-[14px] flex flex-col overflow-hidden drop-shadow-[0px_8px_12px_rgba(9,30,66,0.1)]"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4 flex-shrink-0">
          <h2 className="text-[18px] font-semibold text-ink dark:text-neutral-80 leading-[21px]">
            {apiKeyName} API 연동
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer w-6 h-6 flex items-center justify-center flex-shrink-0"
            aria-label="닫기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 18L18 6M6 6L18 18"
                stroke="currentColor"
                className="text-neutral-60 dark:text-neutral-60"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="px-7 pb-4 text-[16px] text-center">
          연동할 프로젝트의 버튼을 활성화하세요.
        </p>

        {/* Content */}
        <div className="overflow-y-auto px-7 pb-4 max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-[14px] text-neutral-60">로딩 중...</span>
            </div>
          ) : partners.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-[14px] text-neutral-60">
                승인된 협력업체가 없습니다.
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center justify-between px-4 py-3 bg-neutral-10 dark:bg-neutral-20 rounded-[8px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* 프로젝트 아이콘: 로고 URL 없으면 첫 글자 표시 (404 방지) */}
                    <div className="w-8 h-8 rounded-full bg-neutral-20 dark:bg-neutral-30 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      <span className="text-[14px] font-semibold text-neutral-60 dark:text-neutral-50">
                        {partner.partnerProjectName.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                    <span className="text-[14px] font-medium text-foreground truncate">
                      {partner.partnerProjectName}
                    </span>
                  </div>

                  {/* Toggle Switch: 활성화시(녹색) / 비활성화시(회색) SVG */}
                  <button
                    type="button"
                    onClick={() => handleToggle(partner)}
                    disabled={togglingIds.has(partner.id)}
                    className="flex-shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-10 h-6 flex items-center justify-center"
                    aria-label={partner.isConnectedToApiKey ? "연결 해제" : "연결"}
                  >
                    {partner.isConnectedToApiKey ? (
                      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-6">
                        <rect width="40" height="24" rx="12" fill="#00E272" />
                        <circle cx="28" cy="12" r="8" fill="white" />
                      </svg>
                    ) : (
                      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-6">
                        <rect width="40" height="24" rx="12" transform="matrix(-1 0 0 1 40 0)" fill="#D0D0D0" />
                        <circle cx="8" cy="8" r="8" transform="matrix(-1 0 0 1 20 4)" fill="white" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="flex justify-center mt-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                disabled={loading}
                maxButtons={5}
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-full h-px border-t border-neutral-30 dark:border-neutral-30 flex-shrink-0" />

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-[12px] px-7 py-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="cursor-pointer min-w-[48px] h-[34px] flex items-center justify-center px-3 py-[6px] rounded-[5px] bg-white dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 text-[14px] font-semibold text-ink dark:text-neutral-80 tracking-[-0.02em] hover:bg-neutral-10 transition-colors"
            style={{ lineHeight: "17px" }}
          >
            취소
          </button>
          <button
            onClick={onClose}
            className="cursor-pointer min-w-[48px] h-[34px] flex items-center justify-center px-3 py-[6px] rounded-[5px] bg-[#252525] dark:bg-neutral-90 text-[14px] font-semibold text-[#EDEDED] dark:text-neutral-20 tracking-[-0.02em] hover:opacity-90 transition-opacity"
            style={{ lineHeight: "17px" }}
          >
            확인
          </button>
        </div>
    </BaseModal>
  );
}
