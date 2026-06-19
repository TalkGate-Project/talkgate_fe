"use client";

type StatsChartFilterButtonProps = {
  onClick?: () => void;
};

/**
 * 통계 페이지 title 옆 필터 추가 버튼 (36×36 아이콘).
 * TODO: 클릭 시 필터 설정 모달을 열어 차트/테이블 데이터를 필터링하는 기능 연동 예정 (모달 미제작).
 */
export default function StatsChartFilterButton({ onClick }: StatsChartFilterButtonProps) {
  return (
    <button
      type="button"
      aria-label="필터 추가"
      className="cursor-pointer shrink-0 flex items-center justify-center w-9 h-9 p-0 bg-transparent border-0 overflow-visible"
      onClick={onClick}
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block w-[34px] h-[34px] overflow-visible"
        aria-hidden
      >
        <rect
          x="0.5"
          y="0.5"
          width="35"
          height="35"
          rx="5.5"
          stroke="#E2E2E2"
          className="dark:stroke-neutral-30"
        />
        <path
          d="M10.5 11.5C10.5 10.9477 10.9477 10.5 11.5 10.5H24.5C25.0523 10.5 25.5 10.9477 25.5 11.5V13.4191C25.5 13.6843 25.3946 13.9387 25.2071 14.1262L19.9596 19.3738C19.772 19.5613 19.6667 19.8157 19.6667 20.0809V22.1667L16.3333 25.5V20.0809C16.3333 19.8157 16.228 19.5613 16.0404 19.3738L10.7929 14.1262C10.6054 13.9387 10.5 13.6843 10.5 13.4191V11.5Z"
          stroke="#B0B0B0"
          className="dark:stroke-neutral-50"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
