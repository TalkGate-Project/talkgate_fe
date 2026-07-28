import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAnchoredPanel } from "@/hooks/useAnchoredPanel";

/** 패널 너비(px). 위치 계산과 실제 렌더 폭이 어긋나지 않도록 한 곳에서만 정의한다. */
const PANEL_WIDTH = 240;

type TimePickerProps = {
  /** "HH:mm" 형식의 24시간제 문자열 (예: "09:00", "16:40") */
  value: string | null;
  onChange: (next: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** 분 단위 스텝 (기본: 10분) */
  minuteStep?: number;
  /** 광고성 문자 시간 제한 활성화 (21:00 ~ 08:00 비활성화) */
  restrictAdHours?: boolean;
  /** 패널과 인풋 사이 세로 간격(px). 기본 8 */
  panelOffsetY?: number;
  /** 검증 실패 상태일 때 인풋 테두리를 빨간색으로 표시 */
  invalid?: boolean;
};

type Period = "오전" | "오후";

function parseTime(value: string | null): {
  period: Period;
  hour12: number;
  minute: number;
} | null {
  if (!value) return null;
  const [hh, mm] = value.split(":").map((v) => Number(v));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  const period: Period = hh < 12 ? "오전" : "오후";
  const baseHour = hh % 12;
  const hour12 = baseHour === 0 ? 12 : baseHour;
  return { period, hour12, minute: mm };
}

function toValue(period: Period, hour12: number, minute: number): string {
  const hNormalized = ((hour12 % 12) + 12) % 12;
  const hour24 = period === "오전" ? hNormalized : hNormalized + 12;
  const hh = hour24.toString().padStart(2, "0");
  const mm = minute.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

/** 광고성 문자 시간 제한 체크 (21:00 ~ 08:00) */
function isRestrictedTime(period: Period, hour12: number, minute: number): boolean {
  // minute은 무시(요구사항: 분 무관)
  void minute;
  // 요구사항(12시간 표기 기준):
  // - 오전: 12, 01~08 금지 (00:00~08:59)
  // - 오후: 09~11 금지 (21:00~23:59)
  //   - 오후 12시는 정오(12:xx)이므로 금지 대상이 아님
  if (period === "오전") return hour12 === 12 || hour12 <= 8;
  return hour12 >= 9 && hour12 <= 11;
}

function formatLabel(value: string | null): string {
  const parsed = parseTime(value);
  if (!parsed) return "";
  const { period, hour12, minute } = parsed;
  const mm = minute.toString().padStart(2, "0");
  return `${period} ${hour12}:${mm}`;
}

export default function TimePicker(props: TimePickerProps) {
  const {
    value,
    onChange,
    placeholder = "오전 시 : 분",
    className = "",
    disabled,
    minuteStep = 10,
    restrictAdHours = false,
    panelOffsetY = 8,
    invalid = false,
  } = props;

  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("오전");
  const [hour12, setHour12] = useState<number>(10);
  const [minute, setMinute] = useState<number>(0);


  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(
    () => Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) => i * minuteStep),
    [minuteStep]
  );

  const label = useMemo(() => formatLabel(value), [value]);

  const syncFromValue = useCallback(() => {
    const parsed = parseTime(value);
    if (!parsed) {
      setPeriod("오전");
      setHour12(10);
      setMinute(0);
      return;
    }
    setPeriod(parsed.period);
    setHour12(parsed.hour12);
    setMinute(parsed.minute);
  }, [value]);

  const emitChange = useCallback(
    (nextPeriod: Period, nextHour12: number, nextMinute: number) => {
      const v = toValue(nextPeriod, nextHour12, nextMinute);
      onChange(v);
    },
    [onChange]
  );

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const { rootRef, anchorRef, panelRef, panelPos } = useAnchoredPanel<HTMLInputElement>({
    open,
    onClose: close,
    panelWidth: PANEL_WIDTH,
    estimatedPanelHeight: 260,
    offsetY: panelOffsetY,
  });

  const openPicker = () => {
    if (disabled) return;
    syncFromValue();
    setOpen(true);
  };

  // 제한 활성화 시, 이미 선택된 값이 제한 시간대면 즉시 해제
  useEffect(() => {
    if (!restrictAdHours || !value) return;
    const parsed = parseTime(value);
    if (!parsed) return;
    if (isRestrictedTime(parsed.period, parsed.hour12, parsed.minute)) {
      onChange(null);
    }
  }, [restrictAdHours, value, onChange]);

  // Keep internal state in sync when value changes while picker is closed
  useEffect(() => {
    if (!open) {
      syncFromValue();
    }
  }, [value, open, syncFromValue]);

  return (
    <div ref={rootRef} className="relative w-full">
      <input
        ref={anchorRef}
        readOnly
        disabled={disabled}
        onClick={openPicker}
        onFocus={openPicker}
        value={label}
        placeholder={placeholder}
        className={`w-full outline-none text-[14px] leading-[17px] tracking-[-0.02em] h-[34px] rounded-[6px] border border-border bg-card text-foreground placeholder:text-neutral-60 px-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${invalid ? "!border-danger-40 dark:!border-danger-40" : ""} ${className}`}
      />

      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            className="z-[1000] bg-card dark:bg-neutral-10 rounded-[14px] shadow-[0px_18px_28px_rgba(9,30,66,0.10)] dark:shadow-[0px_13px_61px_0px_#000000B2] p-3"
            style={{ position: "fixed", top: panelPos.top, left: panelPos.left, width: PANEL_WIDTH }}
          >
            <div className="flex justify-between text-[12px] text-neutral-60 mb-2 px-1">
              <span>오전/오후</span>
              <span>시</span>
              <span>분</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {/* Period column */}
              <div className="max-h-[180px] overflow-auto pr-1">
                {(["오전", "오후"] as Period[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`w-full h-8 flex items-center justify-center rounded-[6px] text-[14px] cursor-pointer ${
                      p === period
                        ? "bg-neutral-90 dark:bg-neutral-90 text-white dark:text-neutral-0"
                        : "text-foreground hover:bg-neutral-20 dark:hover:bg-neutral-25"
                    }`}
                    onClick={() => {
                      setPeriod(p);
                      emitChange(p, hour12, minute);
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Hour column */}
              <div className="max-h-[180px] overflow-auto pr-1">
                {hours.map((h) => {
                  const isRestricted = restrictAdHours && isRestrictedTime(period, h, minute);
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={isRestricted}
                      className={`w-full h-8 flex items-center justify-center rounded-[6px] text-[14px] ${
                        isRestricted
                          ? "opacity-30 !cursor-not-allowed text-neutral-60 dark:text-neutral-60"
                          : h === hour12
                          ? "bg-neutral-90 dark:bg-neutral-90 text-white dark:text-neutral-0"
                          : "text-foreground hover:bg-neutral-20 dark:hover:bg-neutral-25 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (!isRestricted) {
                          setHour12(h);
                          emitChange(period, h, minute);
                        }
                      }}
                    >
                      {h.toString().padStart(2, "0")}
                    </button>
                  );
                })}
              </div>

              {/* Minute column */}
              <div className="max-h-[180px] overflow-auto pr-1">
                {minutes.map((m) => {
                  const isRestricted = restrictAdHours && isRestrictedTime(period, hour12, m);
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={isRestricted}
                      className={`w-full h-8 flex items-center justify-center rounded-[6px] text-[14px] ${
                        isRestricted
                          ? "opacity-30 !cursor-not-allowed text-neutral-60 dark:text-neutral-60"
                          : m === minute
                          ? "bg-neutral-90 dark:bg-neutral-90 text-white dark:text-neutral-0"
                          : "text-foreground hover:bg-neutral-20 dark:hover:bg-neutral-25 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (!isRestricted) {
                          setMinute(m);
                          emitChange(period, hour12, m);
                        }
                      }}
                    >
                      {m.toString().padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}


