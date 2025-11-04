"use client";

import { useMemo, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { CustomersService } from "@/services/customers";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function CustomerCreateModal({ open, onClose, onCreated }: Props) {
  const [projectId] = useSelectedProjectId();
  const [submitting, setSubmitting] = useState(false);

  // minimal fields for API test
  const [name, setName] = useState("");
  const [contact1, setContact1] = useState("");
  const [contact2, setContact2] = useState("");
  const [applicationRoute, setApplicationRoute] = useState("");
  const [site, setSite] = useState("");
  const [mediaCompany, setMediaCompany] = useState("");
  const [gender, setGender] = useState("");
  const [investmentRistLevel, setInvestmentRiskLevel] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  if (!open) return null;

  const handleSubmit = async () => {
    if (!projectId) return alert("프로젝트를 선택해주세요.");
    if (!name.trim() || !contact1.trim()) {
      alert("이름과 연락처1은 필수입니다.");
      return;
    }
    setSubmitting(true);
    try {
      await CustomersService.create({
        projectId,
        name: name.trim(),
        contact1: contact1.trim(),
        contact2: contact2.trim() || undefined,
        applicationRoute: applicationRoute || undefined,
        site: site || undefined,
        mediaCompany: mediaCompany || undefined,
        gender: gender || undefined,
        specialNotes: specialNotes || undefined,
        investmentRistLevel: investmentRistLevel || undefined,
      });
      onCreated?.();
      onClose();
    } catch (e: any) {
      alert(e?.data?.message || e?.message || "고객 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      onClose={() => (!submitting ? onClose() : undefined)}
      overlayClassName="bg-black/30"
      containerClassName="relative w-[520px] rounded-[14px] bg-white shadow-[0px_13px_61px_rgba(169,169,169,0.37)]"
      ariaLabel="고객 등록"
    >
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[18px] font-semibold">고객 등록</div>
          <button aria-label="close" onClick={() => !submitting && onClose()} className="w-6 h-6 grid place-items-center text-neutral-50 hover:text-neutral-70">×</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <label className="block">
              <span className="block text-[12px] text-[#6B7280] mb-1">이름 *</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-3" placeholder="홍길동" />
            </label>
            <label className="block">
              <span className="block text-[12px] text-[#6B7280] mb-1">연락처1 *</span>
              <input value={contact1} onChange={(e) => setContact1(e.target.value)} className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-3" placeholder="010-1234-5678" />
            </label>
            <label className="block">
              <span className="block text-[12px] text-[#6B7280] mb-1">연락처2</span>
              <input value={contact2} onChange={(e) => setContact2(e.target.value)} className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-3" placeholder="선택 입력" />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <label className="block">
              <span className="block text-[12px] text-[#6B7280] mb-1">신청경로</span>
              <input value={applicationRoute} onChange={(e) => setApplicationRoute(e.target.value)} className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-3" placeholder="예: 유튜브" />
            </label>
            <label className="block">
              <span className="block text-[12px] text-[#6B7280] mb-1">사이트</span>
              <input value={site} onChange={(e) => setSite(e.target.value)} className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-3" placeholder="예: 채널명" />
            </label>
            <label className="block">
              <span className="block text-[12px] text-[#6B7280] mb-1">매체사</span>
              <input value={mediaCompany} onChange={(e) => setMediaCompany(e.target.value)} className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-3" placeholder="예: 광고회사" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[12px] text-[#6B7280] mb-1">성별</span>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-2">
                <option value="">선택</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-[12px] text-[#6B7280] mb-1">투자성향</span>
              <select value={investmentRistLevel} onChange={(e) => setInvestmentRiskLevel(e.target.value)} className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-2">
                <option value="">선택</option>
                <option value="aggressive">공격형</option>
                <option value="active">적극형</option>
                <option value="neutral">중립형</option>
                <option value="stable">안정추구형</option>
                <option value="conservative">보수형</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="block text-[12px] text-[#6B7280] mb-1">특이사항</span>
            <textarea value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} rows={3} className="w-full rounded-[8px] border border-[#E5E7EB] px-3 py-2" placeholder="특이사항을 입력하세요" />
          </label>
        </div>
      </div>

      <div className="border-t border-[#E2E2E2]" />
      <div className="absolute bottom-4 right-6 flex items-center gap-3">
        <button onClick={() => !submitting && onClose()} className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold">취소</button>
        <button onClick={handleSubmit} disabled={submitting || !projectId} className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[14px] font-semibold text-[#D0D0D0] disabled:opacity-60">등록</button>
      </div>
    </BaseModal>
  );
}


