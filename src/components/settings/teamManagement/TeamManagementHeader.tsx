import { TOKENS } from "./tokens";

type Props = {
  viewMode: "list" | "tree";
  onChange: (mode: "list" | "tree") => void;
};

export default function TeamManagementHeader({ viewMode, onChange }: Props) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1
          className="font-bold"
          style={{ fontSize: "24px", lineHeight: "20px", color: TOKENS.colors.light[90] }}
        >
          팀관리
        </h1>
        <button
          className="flex justify-center items-center px-3 py-2 rounded-[5px] font-semibold hover:opacity-90 transition-opacity"
          style={{
            background: TOKENS.colors.light[90],
            color: TOKENS.colors.light[40],
            fontSize: "14px",
            lineHeight: "17px",
            letterSpacing: "-0.02em",
          }}
        >
          팀 생성
        </button>
      </div>
      <div className="w-full h-px bg-[#E2E2E2] mb-6 opacity-50" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2
            className="font-semibold mb-2"
            style={{ fontSize: "16px", lineHeight: "19px", color: TOKENS.colors.light[100], letterSpacing: "0.2px" }}
          >
            조직도 정보
          </h2>
          <p
            style={{ fontSize: "14px", lineHeight: "17px", color: TOKENS.colors.light[60], letterSpacing: "0.2px" }}
          >
            조직 및 멤버를 드래그하여 자유롭게 이동할 수 있습니다.
          </p>
        </div>
        <div className="flex border rounded-[5px]" style={{ borderColor: TOKENS.colors.light[30] }}>
          <button
            onClick={() => onChange("list")}
            className={`flex items-center justify-center px-1 py-1 text-[14px] font-medium transition-colors ${
              viewMode === "list" ? "text-white" : "text-[#808080] hover:bg-gray-50"
            }`}
            style={{
              width: "24px",
              height: "24px",
              background: viewMode === "list" ? TOKENS.colors.light[90] : "transparent",
              borderRadius: "5px 0px 0px 5px",
              borderColor: TOKENS.colors.light[30],
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={() => onChange("tree")}
            className={`flex items-center justify-center px-1 py-1 text-[14px] font-medium transition-colors ${
              viewMode === "tree" ? "text-white" : "text-[#808080] hover:bg-gray-50"
            }`}
            style={{
              width: "25px",
              height: "24px",
              background: viewMode === "tree" ? TOKENS.colors.light[90] : "transparent",
              borderRadius: "0px 5px 5px 0px",
              borderColor: TOKENS.colors.light[30],
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
