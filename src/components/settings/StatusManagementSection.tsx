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

type ColorSelectTriggerProps = {
  color: string;
  ariaLabel: string;
  onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
};

function ColorSelectTrigger({
  color,
  ariaLabel,
  onClick,
  disabled = false,
}: ColorSelectTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer flex h-[34px] w-[64px] shrink-0 items-center justify-center rounded-[5px] border border-neutral-30 bg-card px-3 text-foreground transition-colors hover:bg-neutral-10 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={ariaLabel}
    >
      <span className="flex w-full items-center justify-between">
        <span
          className="h-[18px] w-[18px] rounded-full"
          style={{ backgroundColor: getStatusColorTone(color).backgroundColor }}
        />
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M5.86134 7.21755C5.46305 7.76992 4.64029 7.76992 4.242 7.21755L0.670153 2.26841C0.193737 1.60704 0.665896 0.683197 1.48043 0.683197L8.6229 0.683198C9.43744 0.683198 9.9096 1.60704 9.43319 2.26841L5.86134 7.21755Z" fill="currentColor" />
        </svg>
      </span>
    </button>
  );
}

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

  const selectedPaletteColor = useMemo(() => {
    if (!paletteState) return null;

    if (paletteState.key === "new") {
      return newStatusColor;
    }

    if (paletteState.key.startsWith("edit-")) {
      return editingStatusColor;
    }

    return null;
  }, [editingStatusColor, newStatusColor, paletteState]);

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
  };

  return (
    <div className="md:bg-card md:rounded-[14px] md:shadow-sm px-6 md:px-7 md:py-[30px] mt-5 md:mt-0">
      <h3 className="text-[16px] font-semibold text-foreground mb-2 tracking-[0.2px] leading-[1]">처리상태 관리</h3>
      <p className="hidden md:block text-[14px] text-neutral-60 mb-3 font-medium tracking-[0.2px]">고객 상담에서 사용될 처리상태를 관리합니다.</p>
      
      <div className="border-t border-neutral-30 mb-3"></div>
      
      <div className="flex gap-3 mb-5">
        <ColorSelectTrigger
          color={newStatusColor}
          ariaLabel="새 처리상태 색상 선택"
          onClick={(event) => openPalette("new", event)}
        />
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
                {isEditing ? (
                  <>
                    <ColorSelectTrigger
                      color={editingStatusColor}
                      ariaLabel={`${status.name} 색상 선택`}
                      onClick={(event) => openPalette(`edit-${status.id}`, event)}
                    />
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
                  </>
                ) : (
                  <>
                    <span
                      className="h-[18px] w-[18px] shrink-0 rounded-full"
                      style={{ backgroundColor: tone.backgroundColor }}
                      aria-hidden="true"
                    />
                    <span className="truncate text-[16px] font-semibold text-foreground leading-[19px]">
                      {status.name}
                    </span>
                  </>
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
