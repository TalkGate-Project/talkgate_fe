import React from "react";
import { CustomerFormState } from "./useCustomerDetail";

type Props = {
  form: CustomerFormState;
  setForm: React.Dispatch<React.SetStateAction<CustomerFormState>>;
};

export default function DataTab({ form, setForm }: Props) {
  return (
    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
      <label className="block">
        <span className="block text-[14px] text-[#6B7280] mb-1 font-medium">신청경로</span>
        <input
          value={form.applicationRoute}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, applicationRoute: e.target.value }))
          }
          className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
          placeholder="예: 유튜브"
        />
      </label>
      <label className="block">
        <span className="block text-[14px] text-[#6B7280] mb-1 font-medium">사이트</span>
        <input
          value={form.site}
          onChange={(e) => setForm((prev) => ({ ...prev, site: e.target.value }))}
          className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
          placeholder="예: 모두의주식투자채널"
        />
      </label>

      <label className="block">
        <span className="block text-[14px] text-[#6B7280] mb-1 font-medium">매체사</span>
        <input
          value={form.mediaCompany}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, mediaCompany: e.target.value }))
          }
          className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
          placeholder="예: 광고회사"
        />
      </label>
      <label className="block">
        <span className="block text-[14px] text-[#6B7280] mb-1 font-medium">신청시간</span>
        <input
          value={form.applicationDate}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, applicationDate: e.target.value }))
          }
          disabled
          className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px] bg-neutral-10 dark:bg-neutral-20 text-neutral-60 dark:text-neutral-60 cursor-not-allowed"
          placeholder="YYYY-MM-DD HH:mm"
        />
      </label>

      <label className="block">
        <span className="block text-[14px] text-[#6B7280] mb-1 font-medium">담당자</span>
        <input
          value={form.assignedMemberName}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, assignedMemberName: e.target.value }))
          }
          disabled
          className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px] bg-neutral-10 dark:bg-neutral-20 text-neutral-60 dark:text-neutral-60 cursor-not-allowed"
          placeholder="담당자명"
        />
      </label>
      <label className="block">
        <span className="block text-[14px] text-[#6B7280] mb-1 font-medium">담당팀</span>
        <input
          value={form.assignedTeamName}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, assignedTeamName: e.target.value }))
          }
          disabled
          className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px] bg-neutral-10 dark:bg-neutral-20 text-neutral-60 dark:text-neutral-60 cursor-not-allowed"
          placeholder="예: 영업1팀"
        />
      </label>

      <div className="md:col-span-2">
        <span className="block text-[14px] text-[#6B7280] mb-1 font-medium">특이사항</span>
        <textarea
          value={form.specialNotes}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, specialNotes: e.target.value }))
          }
          rows={3}
          className="w-full rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 py-2 font-medium text-[14px]"
          placeholder="특이사항을 입력하세요"
        />
      </div>
    </div>
  );
}



