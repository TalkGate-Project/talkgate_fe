"use client";

import { useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { CustomerNoteCategory } from "@/types/customerNoteCategories";
import ColorPalettePopover from "@/components/common/ColorPalettePopover";
import { getStatusColorTone } from "@/utils/statusColors";

type Props = {
  newStatusName: string;
  setNewStatusName: (name: string) => void;
  newStatusColor: string;
  setNewStatusColor: (color: string) => void;
  statuses: CustomerNoteCategory[];
  onAddStatus: () => void;
  onModifyStatus: (
    id: number,
    payload: { name: string; colorCode?: string | null }
  ) => Promise<boolean | undefined>;
  onDeleteStatus: (id: number) => void;
};

type PaletteState =
  | {
      key: string;
      anchorElement: HTMLElement;
    }
  | null;

/**
 * 처리상태 관리 섹션 컴포넌트
 */
export default function StatusManagementSection({
  newStatusName,
  setNewStatusName,
  newStatusColor,
  setNewStatusColor,
  statuses,
  onAddStatus,
  onModifyStatus,
  onDeleteStatus,
}: Props) {
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editingStatusName, setEditingStatusName] = useState("");
  const [editingStatusColor, setEditingStatusColor] = useState(newStatusColor);
  const [paletteState, setPaletteState] = useState<PaletteState>(null);
  const [savingColorStatusId, setSavingColorStatusId] = useState<number | null>(null);

  const selectedPaletteColor = useMemo(() => {
    if (!paletteState) return null;

    if (paletteState.key === "new") {
      return newStatusColor;
    }

    if (paletteState.key.startsWith("edit-")) {
      return editingStatusColor;
    }

    if (paletteState.key.startsWith("row-")) {
      const targetId = Number(paletteState.key.replace("row-", ""));
      return statuses.find((status) => status.id === targetId)?.colorCode ?? null;
    }

    return null;
  }, [editingStatusColor, newStatusColor, paletteState, statuses]);

  const openPalette = (
    key: string,
    event: ReactMouseEvent<HTMLElement>
  ) => {
    if (paletteState?.key === key) {
      setPaletteState(null);
      return;
    }

    setPaletteState({
      key,
      anchorElement: event.currentTarget,
    });
  };

  const closePalette = () => {
    setPaletteState(null);
  };

  const resetEditing = () => {
    setEditingStatusId(null);
    setEditingStatusName("");
    setEditingStatusColor(newStatusColor);
    closePalette();
  };

  const startEditing = (status: CustomerNoteCategory) => {
    setEditingStatusId(status.id);
    setEditingStatusName(status.name);
    setEditingStatusColor(status.colorCode ?? newStatusColor);
    closePalette();
  };

  const handleSaveEdit = async () => {
    if (editingStatusId === null) return;

    const trimmedName = editingStatusName.trim();
    if (!trimmedName) return;

    const isUpdated = await onModifyStatus(editingStatusId, {
      name: trimmedName,
      colorCode: editingStatusColor,
    });

    if (isUpdated) {
      resetEditing();
    }
  };

  const handleSelectColor = async (color: string) => {
    if (!paletteState) return;

    if (paletteState.key === "new") {
      setNewStatusColor(color);
      closePalette();
      return;
    }

    if (paletteState.key.startsWith("edit-")) {
      setEditingStatusColor(color);
      closePalette();
      return;
    }

    if (!paletteState.key.startsWith("row-")) return;

    const targetId = Number(paletteState.key.replace("row-", ""));
    const status = statuses.find((item) => item.id === targetId);
    if (!status || status.colorCode === color) {
      closePalette();
      return;
    }

    setSavingColorStatusId(targetId);
    const isUpdated = await onModifyStatus(targetId, {
      name: status.name,
      colorCode: color,
    });
    setSavingColorStatusId(null);

    if (isUpdated) {
      closePalette();
    }
  };

  return (
    <div className="md:bg-card md:rounded-[14px] md:shadow-sm px-6 md:px-7 md:py-[30px] mt-5 md:mt-0">
      <h3 className="text-[16px] font-semibold text-foreground mb-2 tracking-[0.2px] leading-[1]">처리상태 관리</h3>
      <p className="hidden md:block text-[14px] text-neutral-60 mb-3 font-medium tracking-[0.2px]">고객 상담에서 사용될 처리상태를 관리합니다.</p>
      
      <div className="border-t border-neutral-30 mb-3"></div>
      
      <div className="flex gap-3 mb-5">
        <button
          type="button"
          onClick={(event) => openPalette("new", event)}
          className="cursor-pointer flex h-[34px] w-[58px] items-center justify-between rounded-[5px] border border-neutral-30 bg-card px-3"
          aria-label="새 처리상태 색상 선택"
        >
          <span
            className="h-[18px] w-[18px] rounded-full"
            style={{ backgroundColor: getStatusColorTone(newStatusColor).backgroundColor }}
          />
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4.25896 5.4382C4.05939 5.71473 3.64764 5.71473 3.44807 5.4382L0.0954003 0.792604C-0.143249 0.461921 0.0930391 1.87809e-07 0.500843 2.2346e-07L7.20619 8.0966e-07C7.61399 8.45312e-07 7.85028 0.461922 7.61163 0.792604L4.25896 5.4382Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <input
          type="text"
          value={newStatusName}
          onChange={(e) => setNewStatusName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void onAddStatus()}
          className="w-full px-3 h-[34px] border border-neutral-30 rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground tracking-[-0.02em]"
          placeholder="새 상태 이름을 입력하세요"
        />
        <button 
          onClick={() => void onAddStatus()}
          className="cursor-pointer min-w-[48px] h-[34px] py-2 bg-neutral-90 text-neutral-20 text-[14px] font-semibold rounded-[5px] hover:opacity-90 transition-colors tracking-[-0.02em] leading-[17px]"
        >
          추가
        </button>
      </div>

      {/* 상태 목록 */}
      <div className="space-y-3">
        {statuses.map((status) => {
          const isEditing = editingStatusId === status.id;
          const tone = getStatusColorTone(status.colorCode);

          return (
            <div key={status.id} className="flex items-center justify-between gap-4 py-2 px-4 md:px-6 bg-neutral-10 rounded-[5px] min-h-[50px]">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <button
                  type="button"
                  disabled={savingColorStatusId === status.id}
                  onClick={(event) =>
                    isEditing
                      ? openPalette(`edit-${status.id}`, event)
                      : openPalette(`row-${status.id}`, event)
                  }
                  className="cursor-pointer flex h-6 w-6 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`${status.name} 색상 선택`}
                >
                  <span
                    className="h-[14px] w-[14px] rounded-full"
                    style={{
                      backgroundColor: isEditing
                        ? getStatusColorTone(editingStatusColor).backgroundColor
                        : tone.backgroundColor,
                    }}
                  />
                </button>

                {isEditing ? (
                  <input
                    type="text"
                    value={editingStatusName}
                    onChange={(event) => setEditingStatusName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void handleSaveEdit();
                      }

                      if (event.key === "Escape") {
                        resetEditing();
                      }
                    }}
                    className="w-full h-[34px] rounded-[5px] border border-neutral-30 bg-card px-3 text-[14px] text-foreground focus:outline-none focus:border-foreground tracking-[-0.02em]"
                  />
                ) : (
                  <span className="truncate text-[16px] font-semibold text-foreground leading-[19px]">
                    {status.name}
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => void handleSaveEdit()}
                      className="cursor-pointer w-[48px] h-[34px] text-[14px] font-semibold text-neutral-20 bg-neutral-90 rounded-[5px] hover:opacity-90 transition-colors tracking-[-0.02em] leading-[17px]"
                    >
                      저장
                    </button>
                    <button
                      onClick={resetEditing}
                      className="cursor-pointer w-[48px] h-[34px] text-[14px] font-semibold text-foreground bg-card border border-neutral-30 rounded-[5px] hover:bg-neutral-10 transition-colors tracking-[-0.02em] leading-[17px]"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEditing(status)}
                      className="cursor-pointer w-[48px] h-[34px] text-[14px] font-semibold text-foreground bg-card border border-neutral-30 rounded-[5px] hover:bg-neutral-10 transition-colors tracking-[-0.02em] leading-[17px]"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => onDeleteStatus(status.id)}
                      className="cursor-pointer w-[48px] h-[34px] text-[14px] font-semibold text-foreground bg-card border border-neutral-30 rounded-[5px] hover:bg-neutral-10 transition-colors tracking-[-0.02em] leading-[17px]"
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ColorPalettePopover
        anchorElement={paletteState?.anchorElement ?? null}
        isOpen={!!paletteState}
        selectedColor={selectedPaletteColor}
        onClose={closePalette}
        onSelect={(color) => void handleSelectColor(color)}
      />
    </div>
  );
}
