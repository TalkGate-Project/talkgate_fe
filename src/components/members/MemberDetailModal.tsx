"use client";

import { useQuery } from "@tanstack/react-query";
import BaseModal from "@/components/common/BaseModal";
import { MembersService } from "@/services/members";
import type { MemberDetail } from "@/types/members";

export type MemberDetailModalProps = {
  open: boolean;
  onClose: () => void;
  memberId: number | null;
};

export default function MemberDetailModal({
  open,
  onClose,
  memberId,
}: MemberDetailModalProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["member", "detail", memberId],
    queryFn: async () => {
      if (!memberId) throw new Error("memberId is required");
      const res = await MembersService.detail(memberId);
      return res.data.data as MemberDetail;
    },
    enabled: open && memberId !== null,
  });

  if (!open) return null;

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/50"
      containerClassName="relative w-[480px] max-h-[90vh] rounded-[14px] bg-white shadow-[0_13px_61px_rgba(169,169,169,0.37)] overflow-hidden flex flex-col"
      ariaLabel="멤버 정보"
    >
      {/* Header */}
      <div className="px-7 pt-6 pb-4 border-b border-neutral-20 flex items-center justify-between flex-shrink-0">
        <h2 className="text-[18px] font-semibold text-neutral-90">멤버 정보</h2>
        <button
          aria-label="close"
          className="cursor-pointer w-6 h-6 grid place-items-center hover:opacity-70"
          onClick={onClose}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="px-7 py-6 overflow-y-auto flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-12 text-danger-40">
            멤버 정보를 불러오는 데 실패했습니다.
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Profile Section */}
            <div className="flex items-center gap-4">
              {data.profileImageUrl ? (
                <img
                  src={data.profileImageUrl}
                  alt={data.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-neutral-20 flex items-center justify-center text-neutral-60 text-[24px] font-semibold">
                  {data.name?.charAt(0) || "?"}
                </div>
              )}
              <div>
                <div className="text-[18px] font-semibold text-neutral-90">
                  {data.name}
                </div>
                <div className="text-[14px] text-neutral-60 mt-1">
                  {data.organizationTree?.teamName || "소속 없음"}
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="space-y-4">
              <InfoRow label="이메일" value={data.email || "-"} />
              <InfoRow label="연락처" value={data.phone || "-"} />
              {data.hrData && (
                <>
                  <InfoRow label="생년월일" value={data.hrData.birth || "-"} />
                  <InfoRow label="주소" value={data.hrData.address || "-"} />
                </>
              )}
            </div>

            {/* Team History */}
            {data.teamChangeLogs && data.teamChangeLogs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-[14px] font-semibold text-neutral-90 mb-3">
                  팀 이동 이력
                </h3>
                <div className="space-y-2">
                  {data.teamChangeLogs.map((log) => (
                    <div
                      key={log.id}
                      className="text-[13px] text-neutral-60 bg-neutral-10 rounded-lg px-3 py-2"
                    >
                      <span className="text-neutral-90">
                        {log.previousTeamName}
                      </span>
                      <span className="mx-2">→</span>
                      <span className="text-neutral-90">{log.newTeamName}</span>
                      <span className="ml-2 text-neutral-50">
                        ({new Date(log.createdAt).toLocaleDateString("ko-KR")})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </BaseModal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-[14px] text-neutral-60 w-[80px] shrink-0">
        {label}
      </span>
      <span className="text-[14px] text-neutral-90 flex-1">{value}</span>
    </div>
  );
}

