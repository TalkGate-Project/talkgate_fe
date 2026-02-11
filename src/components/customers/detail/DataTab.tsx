import React from "react";
import { CustomerFormState } from "./useCustomerDetail";

type Props = {
  form: CustomerFormState;
  setForm: React.Dispatch<React.SetStateAction<CustomerFormState>>;
};

export default function DataTab({ form, setForm }: Props) {
  return (
    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
      {/* 좌: 신청경로 / 우: 사이트 */}
      <label className="block">
        <span className="block text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">신청경로</span>
        <input
          value={form.applicationRoute}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, applicationRoute: e.target.value }))
          }
          className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
          placeholder="신청경로를 입력하세요."
        />
      </label>
      <label className="block">
        <span className="block text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">사이트</span>
        <input
          value={form.site}
          onChange={(e) => setForm((prev) => ({ ...prev, site: e.target.value }))}
          className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
          placeholder="사이트를 입력하세요."
        />
      </label>

      {/* 좌: 매체사 / 우: IP주소 (입력 가능) */}
      <label className="block">
        <span className="block text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">매체사</span>
        <input
          value={form.mediaCompany}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, mediaCompany: e.target.value }))
          }
          className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
          placeholder="매체사를 입력하세요."
        />
      </label>
      <label className="block">
        <span className="block text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">IP주소</span>
        <input
          value={form.ipAddress}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, ipAddress: e.target.value }))
          }
          className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
          placeholder="IP주소를 입력하세요."
        />
      </label>

      {/* 좌: 담당자 / 우: 담당팀 */}
      <label className="block">
        <span className="block text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">담당자</span>
        <input
          value={form.assignedMemberName}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, assignedMemberName: e.target.value }))
          }
          disabled
          className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px] bg-neutral-10 dark:bg-neutral-20 text-neutral-60 dark:text-neutral-60 cursor-not-allowed"
        />
      </label>
      <label className="block">
        <span className="block text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">담당팀</span>
        <input
          value={form.assignedTeamName}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, assignedTeamName: e.target.value }))
          }
          disabled
          className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px] bg-neutral-10 dark:bg-neutral-20 text-neutral-60 dark:text-neutral-60 cursor-not-allowed"
        />
      </label>

      {/* 좌: 신청시간 (읽기 전용, 위치 변경) */}
      <label className="block">
        <span className="block text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">신청시간</span>
        <input
          value={form.applicationDate}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, applicationDate: e.target.value }))
          }
          disabled
          className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px] bg-neutral-10 dark:bg-neutral-20 text-neutral-60 dark:text-neutral-60 cursor-not-allowed"
        />
      </label>
    </div>
  );
}



