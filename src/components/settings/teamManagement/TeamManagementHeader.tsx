type Props = {
  viewMode: "list" | "tree";
  onChange: (mode: "list" | "tree") => void;
};

export default function TeamManagementHeader({ viewMode, onChange }: Props) {
  return (
    <div className="relative">
      <div className="flex justify-between items-center px-4 md:px-7 h-[64px] md:h-[76px]">
        <h1 className="font-bold text-[20px] md:text-[24px] leading-[20px] text-foreground">
          팀관리
        </h1>
      </div>
      <div className="w-full h-px bg-neutral-30 mb-4 md:mb-6 opacity-70" />
      <div className="flex justify-between items-center mb-3 px-4 md:px-7">
        <div>
          <h2 className="font-semibold md:mb-2 text-[14px] md:text-[16px] leading-[19px] text-foreground tracking-[0.2px]">
            조직도 정보
          </h2>
          <p className="hidden md:block text-[14px] leading-[17px] text-neutral-60 tracking-[0.2px]">
            조직 및 멤버를 드래그하여 자유롭게 이동할 수 있습니다.
          </p>
        </div>
        <div className="flex border border-border rounded-[5px]">
          <button
            onClick={() => onChange("list")}
            className={`cursor-pointer flex items-center justify-center px-1 py-1 text-[14px] font-medium transition-colors ${
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
            className={`cursor-pointer flex items-center justify-center px-1 py-1 text-[14px] font-medium transition-colors ${
              viewMode === "tree" ? "text-neutral-0 bg-neutral-90" : "text-neutral-60 hover:bg-neutral-10"
            }`}
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "0px 5px 5px 0px",
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4.66797 9.33341H4.0013C3.26492 9.33341 2.66797 9.93036 2.66797 10.6667V12.0001C2.66797 12.7365 3.26492 13.3334 4.0013 13.3334H5.33464C6.07102 13.3334 6.66797 12.7365 6.66797 12.0001V10.6667C6.66797 9.93036 6.07102 9.33341 5.33464 9.33341H4.66797ZM4.66797 9.33341L6.33464 6.21536M6.33464 6.21536C6.57895 6.49216 6.9364 6.66675 7.33464 6.66675H8.66797C9.0662 6.66675 9.42365 6.49216 9.66797 6.21536M6.33464 6.21536C6.12718 5.98031 6.0013 5.67156 6.0013 5.33341V4.00008C6.0013 3.2637 6.59826 2.66675 7.33464 2.66675H8.66797C9.40435 2.66675 10.0013 3.2637 10.0013 4.00008V5.33341C10.0013 5.67156 9.87542 5.98031 9.66797 6.21536M11.3346 9.33341H10.668C9.93159 9.33341 9.33464 9.93036 9.33464 10.6667V12.0001C9.33464 12.7365 9.93159 13.3334 10.668 13.3334H12.0013C12.7377 13.3334 13.3346 12.7365 13.3346 12.0001V10.6667C13.3346 9.93036 12.7377 9.33341 12.0013 9.33341H11.3346ZM11.3346 9.33341L9.66797 6.21536"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
