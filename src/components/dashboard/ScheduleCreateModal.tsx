"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import BaseModal from "@/components/common/BaseModal";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { SchedulesService } from "@/services/schedules";

type Props = {
  defaultDate?: Date | null;
  onClose: () => void;
  onCreated?: () => void;
};

const COLOR_PALETTE = [
  "#00E272", // primary-60
  "#00B55B", // primary-80
  "#7EA5F8", // secondary-20
  "#2563EB", // secondary-60
  "#EFB008", // warning-40
  "#976400", // warning-60
  "#D83232", // danger-40
  "#FC9595", // danger-20
];

export default function ScheduleCreateModal({ defaultDate, onClose, onCreated }: Props) {
  const [projectId] = useSelectedProjectId();
  const [current, setCurrent] = useState<Date>(() => defaultDate ? new Date(defaultDate) : new Date());
  const [ampm, setAmpm] = useState<"오전" | "오후">("오전");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState<string>(COLOR_PALETTE[0]);
  const [submitting, setSubmitting] = useState(false);

  const yearMonthLabel = useMemo(() => format(current, "yyyy - MM (EEE)") as string, [current]);

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, "0")), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")), []);

  const buildIso = (): string => {
    const base = new Date(current);
    const parsedHour = hour ? Number(hour) : 0;
    let h = Number(parsedHour === 12 ? 0 : parsedHour);
    if (ampm === "오후") h = (h + 12) % 24;
    base.setHours(h, Number(minute), 0, 0);
    return base.toISOString();
  };

  const onSubmit = async () => {
    if (!projectId || submitting) return;
    if (!desc.trim()) {
      alert("내용을 입력하세요.");
      return;
    }
    if (!hour || !minute) {
      alert("시간을 선택하세요.");
      return;
    }
    setSubmitting(true);
    try {
      await SchedulesService.create({
        projectId,
        scheduleTime: buildIso(),
        description: desc.trim(),
        colorCode: color,
      });
      onCreated?.();
      onClose();
    } catch (e: any) {
      alert(e?.data?.message || e?.message || "일정 추가에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      onClose={() => (!submitting ? onClose() : undefined)}
      overlayClassName="bg-black/30"
      containerClassName="relative w-[440px] h-[426px] rounded-[14px] bg-white shadow-[0px_13px_61px_rgba(169,169,169,0.366013)]"
      ariaLabel="일정 추가"
    >
        {/* Header */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="text-[18px] font-semibold leading-[21px] text-[#000000]">일정 추가</div>
            <button
              aria-label="close"
              onClick={() => !submitting && onClose()}
              className="cursor-pointer w-6 h-6 flex items-center justify-center hover:opacity-70"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6L18 18" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          {/* Date selector row */}
          <div className="flex items-center justify-center gap-3">
              <button
                aria-label="prev"
                onClick={() => setCurrent((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))}
                className="cursor-pointer flex-shrink-0"
              >
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.5" y="0.5" width="35" height="35" rx="5.5" fill="white"/>
                  <rect x="0.5" y="0.5" width="35" height="35" rx="5.5" stroke="#E2E2E2"/>
                  <path d="M21 24.8076L14 17.8076L21 10.8076" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="flex-1 h-[34px] bg-white border border-[#E2E2E2] rounded-[5px] flex items-center justify-center px-8">
                <span className="font-pretendard font-bold text-[16px] leading-[19px] text-[#252525]">
                  {format(current, "yyyy - MM - dd (E)", { locale: ko })}
                </span>
              </div>
              <button
                aria-label="next"
                onClick={() => setCurrent((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))}
                className="cursor-pointer flex-shrink-0"
              >
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.5" y="-0.5" width="35" height="35" rx="5.5" transform="matrix(-1 0 0 1 36 1)" fill="white"/>
                  <rect x="0.5" y="-0.5" width="35" height="35" rx="5.5" transform="matrix(-1 0 0 1 36 1)" stroke="#E2E2E2"/>
                  <path d="M15 24.8076L22 17.8076L15 10.8076" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
        </div>

        {/* Body */}
        <div className="px-6 pt-4">
          {/* Time row */}
          <div className="mb-2 text-[14px] font-medium tracking-[0.2px] text-neutral-60">시간</div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={ampm}
                onChange={(e) => setAmpm(e.target.value as any)}
                className="appearance-none w-[106px] h-[34px] rounded-[5px] border border-[#E2E2E2] px-3 pr-8 text-[14px] font-medium tracking-[-0.02em] text-neutral-60 cursor-pointer bg-white"
                style={{ lineHeight: '17px' }}
              >
                <option>오전</option>
                <option>오후</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.25896 5.4382C4.05939 5.71473 3.64764 5.71473 3.44807 5.4382L0.0954003 0.792604C-0.143249 0.461921 0.0930391 1.87809e-07 0.500843 2.2346e-07L7.20619 8.0966e-07C7.61399 8.45312e-07 7.85028 0.461922 7.61163 0.792604L4.25896 5.4382Z" fill="black"/>
                </svg>
              </div>
            </div>
            <div className="relative">
              <select
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className="appearance-none w-[106px] h-[34px] rounded-[5px] border border-[#E2E2E2] px-3 pr-8 text-[14px] font-medium tracking-[-0.02em] text-neutral-60 cursor-pointer bg-white"
                style={{ lineHeight: '17px' }}
              >
                <option value="" disabled hidden>
                  시
                </option>
                {hours.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.25896 5.4382C4.05939 5.71473 3.64764 5.71473 3.44807 5.4382L0.0954003 0.792604C-0.143249 0.461921 0.0930391 1.87809e-07 0.500843 2.2346e-07L7.20619 8.0966e-07C7.61399 8.45312e-07 7.85028 0.461922 7.61163 0.792604L4.25896 5.4382Z" fill="black"/>
                </svg>
              </div>
            </div>
            <div className="relative">
              <select
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className="appearance-none w-[106px] h-[34px] rounded-[5px] border border-[#E2E2E2] px-3 pr-8 text-[14px] font-medium tracking-[-0.02em] text-neutral-60 cursor-pointer bg-white"
                style={{ lineHeight: '17px' }}
              >
                <option value="" disabled hidden>
                  분
                </option>
                {minutes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.25896 5.4382C4.05939 5.71473 3.64764 5.71473 3.44807 5.4382L0.0954003 0.792604C-0.143249 0.461921 0.0930391 1.87809e-07 0.500843 2.2346e-07L7.20619 8.0966e-07C7.61399 8.45312e-07 7.85028 0.461922 7.61163 0.792604L4.25896 5.4382Z" fill="black"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <div className="mb-2 text-[14px] font-medium tracking-[0.2px] text-neutral-60">내용</div>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="내용을 입력하세요"
              className="w-full h-[34px] rounded-[5px] border border-[#E2E2E2] px-3 text-[14px] font-medium tracking-[-0.02em] text-neutral-60 placeholder:text-neutral-60"
              style={{ lineHeight: '17px' }}
            />
          </div>

          {/* Color */}
          <div className="mt-6">
            <div className="mb-3 text-[14px] font-medium tracking-[0.2px] text-neutral-60">컬러</div>
            <div className="flex items-center gap-3">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`cursor-pointer w-[18px] h-[18px] rounded-full ${color === c ? "ring-2 ring-[#252525]" : ""}`}
                  style={{ background: c }}
                  aria-label={`color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-6 border-t border-[#E2E2E266]" />

        {/* Footer */}
        <div className="absolute bottom-6 right-6 flex items-center gap-3">
          <button
            onClick={() => !submitting && onClose()}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] bg-white text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-[#000000]"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || !projectId}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-[#252525] text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-[#EDEDED] disabled:opacity-60"
          >
            일정 추가
          </button>
        </div>
    </BaseModal>
  );
}


