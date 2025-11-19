import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TimePickerProps = {
  /** "HH:mm" 형식의 24시간제 문자열 (예: "09:00", "16:40") */
  value: string | null;
  onChange: (next: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** 분 단위 스텝 (기본: 10분) */
  minuteStep?: number;
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
  } = props;

  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("오전");
  const [hour12, setHour12] = useState<number>(10);
  const [minute, setMinute] = useState<number>(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

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

  const openPicker = () => {
    if (disabled) return;
    syncFromValue();
    setOpen(true);
  };

  // Close on outside click / ESC
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      const inRoot = !!rootRef.current?.contains(t);
      const inPanel = !!panelRef.current?.contains(t);
      if (!inRoot && !inPanel) close();
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDocMouseDown, true);
    document.addEventListener("keydown", onEsc, true);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown, true);
      document.removeEventListener("keydown", onEsc, true);
    };
  }, [open, close]);

  // Anchor panel near input
  useEffect(() => {
    if (!open) return;
    function update() {
      const el = inputRef.current;
      const panel = panelRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const panelHeight = panel?.offsetHeight || 260;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - r.bottom;
      const spaceAbove = r.top;
      let top: number;
      if (spaceBelow < panelHeight + 8 && spaceAbove > panelHeight + 8) {
        top = r.top - panelHeight - 8;
      } else {
        top = r.bottom + 8;
      }
      setPanelPos({ top, left: r.left });
    }
    const timer = setTimeout(update, 0);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  // Keep internal state in sync when value changes while picker is closed
  useEffect(() => {
    if (!open) {
      syncFromValue();
    }
  }, [value, open, syncFromValue]);

  return (
    <div ref={rootRef} className="relative w-full">
      <input
        ref={inputRef}
        readOnly
        disabled={disabled}
        onClick={openPicker}
        onFocus={openPicker}
        value={label}
        placeholder={placeholder}
        className={`w-full outline-none text-[14px] leading-[17px] tracking-[-0.02em] h-[34px] rounded-[6px] border border-[#E5E7EB] px-3 cursor-pointer ${className}`}
      />

      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            className="z-[1000] w-[240px] bg-white rounded-[14px] shadow-[0px_18px_28px_rgba(9,30,66,0.10)] p-3"
            style={{ position: "fixed", top: panelPos.top, left: panelPos.left }}
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
                    className={`w-full h-8 flex items-center justify-center rounded-[6px] text-[14px] ${
                      p === period ? "bg-neutral-90 text-white" : "text-[#252525] hover:bg-neutral-20"
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
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={`w-full h-8 flex items-center justify-center rounded-[6px] text-[14px] ${
                      h === hour12
                        ? "bg-neutral-90 text-white"
                        : "text-[#252525] hover:bg-neutral-20"
                    }`}
                    onClick={() => {
                      setHour12(h);
                      emitChange(period, h, minute);
                    }}
                  >
                    {h.toString().padStart(2, "0")}
                  </button>
                ))}
              </div>

              {/* Minute column */}
              <div className="max-h-[180px] overflow-auto pr-1">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`w-full h-8 flex items-center justify-center rounded-[6px] text-[14px] ${
                      m === minute
                        ? "bg-neutral-90 text-white"
                        : "text-[#252525] hover:bg-neutral-20"
                    }`}
                    onClick={() => {
                      setMinute(m);
                      emitChange(period, hour12, m);
                    }}
                  >
                    {m.toString().padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}


