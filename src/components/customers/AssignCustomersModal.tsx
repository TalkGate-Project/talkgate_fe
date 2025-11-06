"use client";

import { useEffect, useMemo, useState } from "react";
import { MembersService, Member } from "@/services/members";
import BaseModal from "@/components/common/BaseModal";
import { useMe } from "@/hooks/useMe";

export type AssignCustomersModalProps = {
  open: boolean;
  onClose: () => void;
  selectedCustomerIds: number[];
  onAssign: (targetMemberId: number) => Promise<void>;
};

function flattenMembers(nodes: Member[]): Member[] {
  const out: Member[] = [];
  const stack = [...nodes];
  while (stack.length) {
    const n = stack.shift()!;
    out.push(n);
    if (n.descendants && n.descendants.length) stack.unshift(...n.descendants);
  }
  return out;
}

function countDescendants(n?: Member): number {
  if (!n?.descendants) return 0;
  let c = n.descendants.length;
  for (const d of n.descendants) c += countDescendants(d as any);
  return c;
}

export default function AssignCustomersModal(props: AssignCustomersModalProps) {
  const { open, onClose, selectedCustomerIds, onAssign } = props;
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [leaderMode, setLeaderMode] = useState(false);
  const { user } = useMe();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setTargetId(null);
    MembersService.projectTree()
      .then((res) => {
        const roots = (res.data as any)?.data?.rootMembers || [];
        const flat = flattenMembers(roots);
        // Ensure self exists in list for self-assignment
        if (user?.id && !flat.some((m) => Number(m.id) === Number(user.id))) {
          flat.unshift({ id: Number(user.id), name: user.name || "나", role: "member", profileImageUrl: undefined, descendants: [] });
        }
        setMembers(flat);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const visible = useMemo(() => {
    if (!leaderMode) return members;
    const leaders = members.filter((m) => String(m.role).toLowerCase().includes("leader"));
    // Always include self even in leader mode
    if (user?.id && !leaders.some((m) => Number(m.id) === Number(user.id))) {
      const self = members.find((m) => Number(m.id) === Number(user.id));
      if (self) leaders.unshift(self);
    }
    return leaders;
  }, [leaderMode, members, user]);

  if (!open) return null;

  return (
    <BaseModal onClose={() => !loading && onClose()} overlayClassName="bg-black/50" containerClassName="relative w-[848px] max-w-[92vw] rounded-[14px] bg-white shadow-[0_13px_61px_rgba(169,169,169,0.37)] p-6" ariaLabel="고객 배정">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="text-[18px] font-bold text-neutral-90">고객 배정</div>
          <div className="flex items-center gap-2">
            {user?.name && (
              <span className="inline-flex items-center h-[28px] rounded-[5px] bg-neutral-30 px-3 text-[14px] text-neutral-70 opacity-80">
                {user.name} (관리자)
              </span>
            )}
            <button
              className={`h-[28px] rounded-[5px] px-3 text-[14px] ${leaderMode ? "bg-primary-80 text-neutral-0" : "bg-neutral-30 text-neutral-70"}`}
              onClick={() => setLeaderMode((v) => !v)}
            >
              팀장모드
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-[14px] text-neutral-60">그룹 혹은 팀원에게 고객을 배정할 수 있습니다.</div>
          <span className="inline-flex items-center h-[22px] rounded-[30px] bg-primary-10 px-3 text-[12px] text-primary-80 opacity-80">
            선택된 고객 {selectedCustomerIds.length}
          </span>
        </div>

        <hr className="mt-4 border-neutral-30" />

        <div className="mt-4">
          <div className="text-[16px] font-semibold text-neutral-90 mb-3">그룹</div>
          {loading ? (
            <div className="text-center text-neutral-60 py-10">불러오는 중...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[420px] overflow-auto pr-1">
              {visible.map((m) => (
                <button
                  key={m.id}
                  className={`relative text-left rounded-[14px] border ${targetId === m.id ? "border-primary-60" : "border-neutral-30"} bg-neutral-0 p-4 hover:border-primary-60 transition-colors`}
                  onClick={() => setTargetId(Number(m.id))}
                >
                  {/* count badge */}
                  <span className="absolute top-3 right-3 inline-flex items-center h-[18px] rounded-[5px] bg-danger-10 px-2 text-[12px] text-danger-40 opacity-80">
                    {countDescendants(m)}명
                  </span>
                  <div className="text-[14px] font-semibold text-neutral-90 flex items-center gap-2">
                    <span>{m.name}</span>
                    {user?.id && Number(user.id) === Number(m.id) && (
                      <span className="inline-flex items-center h-[18px] px-2 rounded-[5px] bg-neutral-30 text-[12px] text-neutral-70">나</span>
                    )}
                  </div>
                  <div className="text-[13px] text-neutral-60 mt-1">역할 · {String(m.role)}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <hr className="mt-6 border-neutral-30" />

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="text-[13px] text-neutral-70">
            {targetId ? (
              <>배정 대상: <b>#{targetId}</b></>
            ) : (
              <>배정 대상을 선택하세요</>
            )}
          </div>
          <div className="flex gap-2">
          <button className="h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] text-neutral-90 bg-neutral-0" onClick={onClose} disabled={loading}>
            취소
          </button>
          <button
            className="h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-40 text-[14px] font-semibold disabled:opacity-50"
            disabled={loading || !targetId}
            onClick={async () => {
              if (!targetId) return;
              setLoading(true);
              try {
                await onAssign(targetId);
                onClose();
              } catch (e) {
                alert("배정에 실패했습니다");
              } finally {
                setLoading(false);
              }
            }}
          >
            배정하기
          </button>
          </div>
        </div>
    </BaseModal>
  );
}


