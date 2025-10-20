"use client";

import { useEffect, useState } from "react";
import { CustomersService } from "@/services/customers";
import { CustomerDetail } from "@/types/customers";

export type CustomerDetailModalProps = {
  open: boolean;
  onClose: () => void;
  customerId: number | null;
};

export default function CustomerDetailModal(props: CustomerDetailModalProps) {
  const { open, onClose, customerId } = props;
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);

  useEffect(() => {
    if (!open || !customerId) return;
    setLoading(true);
    CustomersService.detail(String(customerId)).withProject((window as any)?.tgSelectedProjectId || "")
      .then((res) => setDetail((res as any).data?.data || null))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [open, customerId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => !loading && onClose()} />
      <div className="relative bg-white rounded-[12px] w-[960px] p-6 shadow-[0_13px_61px_rgba(0,0,0,0.25)]">
        <h2 className="text-[18px] font-semibold text-[#111827] mb-4">고객정보</h2>
        {loading && <div className="text-center text-[#808080]">불러오는 중...</div>}
        {!loading && detail && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[12px] text-[#6B7280] mb-1">이름</label>
              <div className="h-[40px] rounded-[8px] border border-[#E5E7EB] px-3 flex items-center">{detail.name}</div>
              <label className="block mt-4 text-[12px] text-[#6B7280] mb-1">연락처1</label>
              <div className="h-[40px] rounded-[8px] border border-[#E5E7EB] px-3 flex items-center">{detail.contact1}</div>
            </div>
            <div>
              <label className="block text-[12px] text-[#6B7280] mb-1">매체사</label>
              <div className="h-[40px] rounded-[8px] border border-[#E5E7EB] px-3 flex items-center">{detail.mediaCompany}</div>
              <label className="block mt-4 text-[12px] text-[#6B7280] mb-1">사이트</label>
              <div className="h-[40px] rounded-[8px] border border-[#E5E7EB] px-3 flex items-center">{detail.site}</div>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button className="h-[36px] px-4 rounded-[8px] border border-[#D1D5DB] text-[#374151]" onClick={onClose} disabled={loading}>닫기</button>
        </div>
      </div>
    </div>
  );
}


