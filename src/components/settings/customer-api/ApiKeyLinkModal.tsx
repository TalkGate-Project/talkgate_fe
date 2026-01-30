"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ProjectPartnersService } from "@/services/projectPartners";
import { ApiKeysService } from "@/services/apiKeys";
import type { ProjectPartnerWithApiKey } from "@/types/projectPartners";
import Pagination from "@/components/common/Pagination";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

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

  const limit = 20;

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
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 dark:bg-[#000000CC] z-40" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:left-1/2 md:right-auto md:w-[500px] md:-translate-x-1/2 w-[calc(100%-2rem)] max-h-[90vh] bg-white dark:bg-neutral-10 rounded-[14px] z-50 flex flex-col overflow-hidden"
        style={{
          filter: "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))",
        }}
        onClick={(e) => e.stopPropagation()}
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
        <p className="px-7 pb-4 text-[14px] text-neutral-60 text-center">
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
                    {/* Partner Logo Placeholder */}
                    <div className="w-8 h-8 rounded-full bg-neutral-30 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      <Image
                        src="/images/default-project-logo.svg"
                        alt={partner.partnerProjectName}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/images/default-project-logo.svg";
                        }}
                      />
                    </div>
                    <span className="text-[14px] font-medium text-foreground truncate">
                      {partner.partnerProjectName}
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggle(partner)}
                    disabled={togglingIds.has(partner.id)}
                    className={`relative w-[52px] h-[28px] rounded-full transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      partner.isConnectedToApiKey
                        ? "bg-primary-50"
                        : "bg-neutral-30"
                    }`}
                    aria-label={partner.isConnectedToApiKey ? "연결 해제" : "연결"}
                  >
                    <span
                      className={`absolute top-[2px] w-[24px] h-[24px] rounded-full bg-white shadow-sm transition-transform ${
                        partner.isConnectedToApiKey
                          ? "translate-x-[26px]"
                          : "translate-x-[2px]"
                      }`}
                    />
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
      </div>
    </>
  );
}
