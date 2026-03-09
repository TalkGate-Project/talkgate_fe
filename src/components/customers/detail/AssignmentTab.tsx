"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { AssignedPartnerItem } from "@/types/customers";

type AssignmentTabProps = {
  assignedPartners: AssignedPartnerItem[];
  onCloseModal: () => void;
};

function DefaultPartnerIcon({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-neutral-20 dark:bg-neutral-30 text-neutral-60 ${className}`}
      aria-hidden
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function AssignmentTab({ assignedPartners, onCloseModal }: AssignmentTabProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPartners = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return assignedPartners;
    return assignedPartners.filter((p) => p.projectName.toLowerCase().includes(q));
  }, [assignedPartners, searchQuery]);

  const handlePartnerClick = (partnerId: number) => {
    const params = new URLSearchParams();
    params.set("tab", "partner-registration");
    params.set("partnerId", String(partnerId));
    router.push(`/settings?${params.toString()}`);
    onCloseModal();
  };

  return (
    <div className="pt-4 md:pt-6 flex flex-col gap-4">
      <div className="relative w-full md:max-w-[260px]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder="이름으로 검색..."
          className="w-full h-10 rounded-[5px] border border-neutral-30 dark:border-neutral-30 bg-neutral-10 dark:bg-neutral-20 px-3 pr-10 text-[14px] text-foreground placeholder:text-neutral-50 focus:outline-none focus:border-primary-50"
        />
        <span
          className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-[5px] text-neutral-50 pointer-events-none"
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </div>

      <h2 className="font-semibold text-[16px] leading-[19px] text-foreground">배정된 파트너</h2>

      <div className="w-full h-[1px] bg-neutral-30 dark:bg-neutral-30 opacity-70" />

      {filteredPartners.length === 0 ? (
        <p className="text-[14px] text-neutral-60 py-4">
          {assignedPartners.length === 0 ? "배정된 파트너가 없습니다." : "검색 결과가 없습니다."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 list-none p-0 m-0">
          {filteredPartners.map((partner) => (
            <li key={partner.partnerId}>
              <button
                type="button"
                onClick={() => handlePartnerClick(partner.partnerId)}
                className="w-full flex items-center gap-4 p-4 rounded-[12px] bg-neutral-10 dark:bg-neutral-20 hover:bg-neutral-20 dark:hover:bg-neutral-30 transition-colors text-left cursor-pointer"
              >
                {partner.thumbnailUrl ? (
                  <img
                    src={partner.thumbnailUrl}
                    alt=""
                    className="w-[20px] h-[20px] rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <DefaultPartnerIcon className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="flex-1 min-w-0 truncate text-[14px] font-semibold leading-5 text-neutral-60 dark:text-neutral-60">
                  {partner.projectName || `파트너 ${partner.partnerId}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
