type AssignmentTeam = {
  teamId: number | null;
  teamName: string | null;
  totalAssignedCount: number;
  color: string;
};

type AssignmentCardsProps = {
  teams: AssignmentTeam[];
  isLoading: boolean;
  isError: boolean;
  hasProject: boolean;
};

const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

export default function AssignmentCards({ teams, isLoading, isError, hasProject }: AssignmentCardsProps) {
  if (!hasProject) {
    return (
      <div className="col-span-full flex h-[70px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-neutral-10 text-[14px] text-neutral-60">
        프로젝트를 먼저 선택해주세요.
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-[70px] rounded-[12px] bg-neutral-10 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 animate-pulse rounded-full bg-neutral-20" />
              <span className="h-4 w-20 animate-pulse rounded bg-neutral-20" />
            </div>
            <span className="h-4 w-10 animate-pulse rounded bg-neutral-20" />
          </div>
        ))}
      </>
    );
  }

  if (isError) {
    return (
      <div className="col-span-full flex h-[70px] items-center justify-center rounded-[12px] border border-dashed border-danger-20 bg-danger-10 text-[14px] text-danger-40">
        팀별 배정 데이터를 불러오는 중 문제가 발생했습니다.
      </div>
    );
  }

  if (!teams.length) {
    return (
      <div className="col-span-full flex h-[70px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-neutral-10 text-[14px] text-neutral-60">
        표시할 팀별 배정 데이터가 없습니다.
      </div>
    );
  }

  return (
    <>
      {teams.map((item) => (
        <div key={`${item.teamId ?? 'none'}-${item.teamName ?? 'unknown'}`} className="h-[70px] bg-neutral-10 rounded-[12px] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full" style={{ background: item.color }} />
            <span className="text-[18px] font-bold text-neutral-90">{item.teamName ?? "소속없음"}</span>
          </div>
          <span className="text-[14px] text-neutral-90">{NUMBER_FORMATTER.format(item.totalAssignedCount)}건</span>
        </div>
      ))}
    </>
  );
}

