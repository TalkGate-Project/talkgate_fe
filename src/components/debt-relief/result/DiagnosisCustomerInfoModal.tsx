"use client";

import { useState, type ReactNode } from "react";
import type { DiagnosisDetail } from "@/types/debtRelief";
import BaseModal from "@/components/common/BaseModal";
import DebtDetailModal from "./DebtDetailModal";
import {
  buildCustomerInfoViewModel,
  type DisplayRow,
  type RichDisplayRow,
  type SummaryLine,
} from "./customerInfoViewModel";

type Props = {
  open: boolean;
  onClose: () => void;
  detail: DiagnosisDetail;
  projectId: string | null;
  /** 「자세히 보기」로 연 채무 상세 모달에서 값 저장/재분석에 성공했을 때 상위 상세 데이터 새로고침 */
  onDebtApplied: () => void | Promise<void>;
};

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 19L8 12L15 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 18L18 6M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// "자세히 보기" 버튼의 돋보기 아이콘 — SectionDebtStatus.tsx의 동일 버튼과 통일.
function DebtDetailSearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M6.66667 13.3333L9.06557 10.9344M9.06557 10.9344C9.51798 11.3868 10.143 11.6667 10.8333 11.6667C12.214 11.6667 13.3333 10.5474 13.3333 9.16667C13.3333 7.78595 12.214 6.66667 10.8333 6.66667C9.45262 6.66667 8.33333 7.78595 8.33333 9.16667C8.33333 9.85702 8.61316 10.482 9.06557 10.9344ZM17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z"
        className="stroke-[var(--secondary-20)] dark:stroke-blue-300"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

type ContentRow = {
  key: string;
  label: string;
  content: ReactNode;
};

function ContentRows({ rows }: { rows: ContentRow[] }) {
  return (
    <dl className="flex flex-col gap-3">
      {rows.map((row) => (
        <div
          key={row.key}
          className="grid min-w-0 grid-cols-[96px_minmax(0,1fr)] items-start gap-6"
        >
          <dt className="text-[14px] font-medium leading-5 tracking-[0.2px] text-neutral-60">
            {row.label}
          </dt>
          <dd className="min-w-0 break-words text-[14px] font-medium leading-5 tracking-[-0.02em] text-foreground">
            {row.content}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function InfoRows({ rows }: { rows: DisplayRow[] }) {
  return (
    <ContentRows
      rows={rows.map((row, index) => ({
        key: `${row.label}-${index}`,
        label: row.label,
        content: (
          <span className={`whitespace-pre-line ${row.emphasize ? "font-bold" : ""}`}>
            {row.value || "-"}
          </span>
        ),
      }))}
    />
  );
}

function InfoSection({
  title,
  children,
  className = "",
  titleAction,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  /** 타이틀 옆에 붙는 버튼 등 — 채무현황의 「자세히 보기」 */
  titleAction?: ReactNode;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col rounded-[12px] border border-neutral-30 bg-neutral-10 dark:bg-neutral-0 ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-4">
        <h3 className="text-[16px] font-bold leading-[19px] tracking-[0.2px] text-foreground">
          {title}
        </h3>
        {titleAction}
      </div>
      <div className="min-h-0 flex-1 px-5 pb-5 pt-3">
        {children}
      </div>
    </section>
  );
}

function RichInfoRows({ rows }: { rows: RichDisplayRow[] }) {
  return (
    <ContentRows
      rows={rows.map((row) => ({
        key: row.key,
        label: row.label,
        content: (
          <div>
            <p className="font-bold">{row.title}</p>
            {row.description ? (
              <p className="whitespace-pre-line font-normal text-neutral-80">{row.description}</p>
            ) : null}
          </div>
        ),
      }))}
    />
  );
}

function SummaryLines({
  lines,
}: {
  lines: SummaryLine[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {lines.map((line, index) => (
        <p key={`${line.label}-${index}`}>
          <span className={line.emphasizeLabel === false ? "" : "font-bold"}>{line.label}</span>
          {line.value ? ` - ${line.value}` : ""}
        </p>
      ))}
    </div>
  );
}

/**
 * 진단 상세 「고객정보」 모달.
 * 상세 페이지 진입 시 이미 조회된 detail(inputData/contact 포함)을 그대로 사용합니다.
 * (별도 API 재조회 없음 — /v1/customers 도 호출하지 않습니다.)
 */
export default function DiagnosisCustomerInfoModal({
  open,
  onClose,
  detail,
  projectId,
  onDebtApplied,
}: Props) {
  const [debtDetailOpen, setDebtDetailOpen] = useState(false);

  if (!open) return null;

  const inputData = detail.inputData;
  const summaryLabel = [inputData.customerName, inputData.ageGroup, inputData.employmentType]
    .filter(Boolean)
    .join(" · ");
  const viewModel = buildCustomerInfoViewModel(
    inputData,
    detail.collateralBreakdown ?? inputData.collateralBreakdown
  );

  return (
    <>
      <BaseModal
        onClose={onClose}
        ariaLabel="고객정보"
        overlayClassName="bg-black/50 dark:bg-[#000000CC]"
        disableAutoContainerSizing
        containerClassName={[
          "flex h-[1342px] max-h-[90vh] w-full flex-col overflow-hidden",
          "bg-card dark:bg-neutral-10 rounded-[14px]",
          "drop-shadow-[0px_8px_12px_rgba(9,30,66,0.1)] dark:drop-shadow-none",
          "min-[709px]:max-w-[1062px]",
        ].join(" ")}
      >
        <div className="flex h-[76px] shrink-0 items-center gap-4 border-b border-neutral-30 px-5 min-[1024px]:px-7">
          <button
            type="button"
            onClick={onClose}
            aria-label="뒤로가기"
            className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center text-foreground hover:opacity-70"
          >
            <BackIcon />
          </button>
          <h2
            id="diagnosis-customer-info-title"
            className="shrink-0 text-[20px] font-bold leading-6 text-foreground min-[1024px]:text-[24px]"
          >
            고객정보
          </h2>
          {summaryLabel ? (
            <>
              <span className="h-4 w-px shrink-0 bg-neutral-60" aria-hidden />
              <p className="min-w-0 flex-1 truncate text-[14px] font-medium leading-5 text-neutral-60 min-[1024px]:text-[18px]">
                {summaryLabel}
              </p>
            </>
          ) : (
            <span className="flex-1" />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center text-foreground hover:opacity-70"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[30px] pt-5 min-[1024px]:px-7">
          <div className="grid grid-cols-1 gap-5 min-[1024px]:grid-cols-[314px_minmax(0,672px)]">
            <InfoSection title="고객 정보">
              <InfoRows rows={viewModel.customerRows} />
            </InfoSection>

            <InfoSection title="자산현황">
              <RichInfoRows rows={viewModel.assetRows} />
            </InfoSection>

            <InfoSection title="소득 / 지출">
              <InfoRows rows={viewModel.incomeRows} />
            </InfoSection>

            <InfoSection
              title="채무현황"
              titleAction={
                <button
                  type="button"
                  onClick={() => setDebtDetailOpen(true)}
                  className="inline-flex h-7 cursor-pointer items-center gap-1 whitespace-nowrap rounded-[5px] border border-secondary-20 bg-white px-2 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-foreground hover:bg-neutral-10 dark:border-secondary-40 dark:bg-neutral-10 dark:hover:bg-neutral-20"
                >
                  <DebtDetailSearchIcon />
                  자세히 보기
                </button>
              }
            >
              <div className="flex h-full flex-col gap-3">
                <RichInfoRows rows={viewModel.debtRows} />
                <div className="mt-auto pt-1">
                  <InfoRows rows={viewModel.debtTotalRows} />
                </div>
              </div>
            </InfoSection>

            <InfoSection
              title="기타사항"
              className="min-[1024px]:col-span-2 min-[1024px]:min-h-[372px]"
            >
              <ContentRows
                rows={[
                  {
                    key: "fresh-start-fund",
                    label: "새출발기금",
                    content: <SummaryLines lines={viewModel.businessLines} />,
                  },
                  {
                    key: "other-checks",
                    label: "기타 확인 사항",
                    content: <SummaryLines lines={viewModel.otherCheckLines} />,
                  },
                  {
                    key: "counselor-memo",
                    label: "상담사 메모",
                    content: (
                      <p className="whitespace-pre-line font-normal text-neutral-80">
                        {viewModel.counselorMemo}
                      </p>
                    ),
                  },
                ]}
              />
            </InfoSection>
          </div>
        </div>

        <div className="flex h-[59px] shrink-0 items-center justify-end border-t border-neutral-30 px-5 min-[1024px]:px-7">
          <button
            type="button"
            onClick={onClose}
            className="h-[34px] w-[72px] cursor-pointer rounded-[5px] bg-neutral-90 text-[14px] font-semibold text-neutral-20 hover:opacity-90"
          >
            확인
          </button>
        </div>
      </BaseModal>

      {projectId && (
        <DebtDetailModal
          open={debtDetailOpen}
          onClose={() => setDebtDetailOpen(false)}
          detail={detail}
          projectId={projectId}
          onApplied={onDebtApplied}
        />
      )}
    </>
  );
}
