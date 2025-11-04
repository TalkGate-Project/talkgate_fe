import { TOKENS } from "./tokens";

type Props = {
  viewMode: "list" | "tree";
  onChange: (mode: "list" | "tree") => void;
};

export default function TeamManagementHeader({ viewMode, onChange }: Props) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-[24px] leading-[20px] text-foreground">
          팀관리
        </h1>
      </div>
      <div className="w-full h-px bg-border mb-6 opacity-50" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-semibold mb-2 text-[16px] leading-[19px] text-foreground tracking-[0.2px]">
            조직도 정보
          </h2>
          <p className="text-[14px] leading-[17px] text-neutral-60 tracking-[0.2px]">
            조직 및 멤버를 드래그하여 자유롭게 이동할 수 있습니다.
          </p>
        </div>
        <div className="flex border border-border rounded-[5px]">
          <button
            onClick={() => onChange("list")}
            className={`flex items-center justify-center px-1 py-1 text-[14px] font-medium transition-colors ${
              viewMode === "list" ? "text-neutral-0 bg-neutral-90" : "text-neutral-60 hover:bg-neutral-10"
            }`}
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "5px 0px 0px 5px",
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={() => onChange("tree")}
            className={`flex items-center justify-center px-1 py-1 text-[14px] font-medium transition-colors ${
              viewMode === "tree" ? "text-neutral-0 bg-neutral-90" : "text-neutral-60 hover:bg-neutral-10"
            }`}
            style={{
              width: "25px",
              height: "24px",
              borderRadius: "0px 5px 5px 0px",
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h18v18H3V3zM9 9h6v6H9V9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
