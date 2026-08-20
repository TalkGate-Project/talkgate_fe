"use client";

import { useEffect, useState } from "react";
import {
  COUNSEL_MENT_TABS,
  CONDITION_STATUS_LABEL,
  DIAGNOSIS_STATUS_LABEL,
  PROCEDURE_GRADE_LABEL,
  RECOMMENDED_PROCEDURE_LABEL,
  RECOMMENDED_PROCEDURE_ORDER,
  type ConditionItem,
  type ConditionStatus,
  type CounselMentCategory,
  type DiagnosisDetail,
  type ProcedureStep,
  type RecommendedProcedure,
} from "@/types/debtRelief";
import { formatDateTimeDisplay, formatManwonComma } from "@/components/debt-relief/format";
import { useDebtReliefAiChat } from "./useDebtReliefAiChat";
import {
  buildCustomerInfoViewModel,
  type DisplayRow,
  type RichDisplayRow,
  type SummaryLine,
} from "./DiagnosisCustomerInfoModal";
import {
  BUCKET_SUMMARY,
  REMAINING_DEBT_SUBTITLE,
  SECTION_TITLE as REPAYMENT_SECTION_TITLE,
  addMonths,
  formatYearMonth,
  formatYearsLabel,
  parseConsultedAt,
  resolveSectionKind,
} from "./SectionRepaymentPlan";
import { TYPE_LABEL as MESSAGE_TYPE_LABEL } from "./SectionDeliveryMessages";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDateTimeLocal(date: Date): string {
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

const CONDITION_TEXT_CLASS: Record<ConditionStatus, string> = {
  met: "print-condition-met",
  caution: "print-condition-caution",
  risk: "print-condition-risk",
};

const COUNSEL_CATEGORY_ORDER: CounselMentCategory[] = ["core", "concern", "next"];

function PrintSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="print-section">
      <h2 className="print-section-title">
        <span className="print-section-number">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** DisplayRow[]을 label/value 2열 표로 렌더. columns가 있으면 좌우 두 표를 나란히 배치(모달과 동일한 그룹). */
function InfoTable({
  rows,
  columns,
}: {
  rows: DisplayRow[];
  columns?: { left: DisplayRow[]; right: DisplayRow[] };
}) {
  if (columns) {
    return (
      <div className="print-info-grid">
        <InfoTable rows={columns.left} />
        <InfoTable rows={columns.right} />
      </div>
    );
  }
  return (
    <table className="print-info-table">
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th>{row.label}</th>
            <td className={row.emphasize ? "print-emphasize" : undefined}>{row.value || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="print-info-block">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function PrintCustomerInfoRows({ rows }: { rows: DisplayRow[] }) {
  return (
    <dl className="print-customer-info-rows">
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`}>
          <dt>{row.label}</dt>
          <dd className={row.emphasize ? "print-customer-emphasize" : undefined}>
            {row.value || "-"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PrintRichInfoRows({ rows }: { rows: RichDisplayRow[] }) {
  return (
    <dl className="print-customer-info-rows print-customer-rich-rows">
      {rows.map((row) => (
        <div key={row.key}>
          <dt>{row.label}</dt>
          <dd>
            <strong>{row.title}</strong>
            {row.description ? <p>{row.description}</p> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PrintSummaryLines({ lines }: { lines: SummaryLine[] }) {
  return (
    <div className="print-customer-summary-lines">
      {lines.map((line, index) => (
        <p key={`${line.label}-${index}`}>
          <span className={line.emphasizeLabel === false ? undefined : "print-customer-line-label"}>
            {line.label}
          </span>
          {line.value ? ` - ${line.value}` : ""}
        </p>
      ))}
    </div>
  );
}

function PrintCustomerInfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="print-customer-info-card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export default function AnalysisPrintDocument({
  detail,
  projectId,
  selectedProcedure,
}: {
  detail: DiagnosisDetail;
  projectId: string | null;
  selectedProcedure: RecommendedProcedure;
}) {
  const { messages: chatMessages } = useDebtReliefAiChat(detail.id, projectId);

  // 실제로 인쇄 버튼을 눌러 브라우저 인쇄 창이 뜨는 시점의 시각으로 갱신한다 — 마운트 시각을
  // 그대로 쓰면 열어둔 채 한참 있다가 인쇄했을 때 "인쇄일시"가 실제와 어긋난다.
  const [printedAt, setPrintedAt] = useState<Date | null>(null);
  useEffect(() => {
    const handleBeforePrint = () => setPrintedAt(new Date());
    window.addEventListener("beforeprint", handleBeforePrint);
    return () => window.removeEventListener("beforeprint", handleBeforePrint);
  }, []);

  const input = detail.inputData;
  const customerInfo = buildCustomerInfoViewModel(
    input,
    detail.collateralBreakdown ?? input.collateralBreakdown
  );

  const procedureScores = [...(detail.procedureScores ?? [])].sort(
    (a, b) =>
      RECOMMENDED_PROCEDURE_ORDER.indexOf(a.procedure) -
      RECOMMENDED_PROCEDURE_ORDER.indexOf(b.procedure)
  );
  const conditionAnalysis: ConditionItem[] =
    detail.conditionAnalysisByProcedure[selectedProcedure] ?? detail.conditionAnalysis ?? [];
  const debtComposition = detail.debtStatus.composition ?? [];
  const repaymentKind = resolveSectionKind(selectedProcedure);
  const repaymentTitle = REPAYMENT_SECTION_TITLE[repaymentKind];
  const plan = detail.repaymentPlanByProcedure[selectedProcedure];
  const bucketSummary = BUCKET_SUMMARY[selectedProcedure];
  const repaymentNotes = detail.repaymentNotes ?? [];
  const startDate = parseConsultedAt(detail.consultedAt);
  const endDate = plan && startDate ? addMonths(startDate, plan.months) : null;

  const guide = detail.procedureGuideByProcedure[selectedProcedure] ?? detail.procedureGuide;
  const guideSteps = guide.steps ?? [];
  const historyByStepId = new Map(
    (detail.procedureStepHistory ?? []).map((item) => [item.stepId, item])
  );
  const STEP_STATUS_LABEL: Record<ProcedureStep["status"], string> = {
    done: "완료",
    in_progress: "진행중",
    pending: "예정",
  };

  const counselMents = detail.counselMents ?? [];
  const messages = detail.messages ?? [];

  // JSX는 소스 순서대로(위→아래) 평가되므로, 조건부 섹션이 렌더되지 않을 때만 자연히
  // 건너뛰어 번호가 항상 연속된다 — 하드코딩한 삼항식보다 섹션을 추가·제거하기 쉽다.
  let sectionNumber = 1;

  return (
    <>
      <article className="analysis-print-root hidden" aria-hidden="true">
        <header className="print-doc-header">
          <p className="print-doc-eyebrow">톡게이트 채무조정 진단서</p>
          <h1>{detail.customerName} 고객 채무조정 진단 결과</h1>
          <p className="print-doc-subtitle">
            {DIAGNOSIS_STATUS_LABEL[detail.status]} · {RECOMMENDED_PROCEDURE_LABEL[selectedProcedure]}
            {selectedProcedure !== detail.trackingProcedure
              ? ` (추적 절차: ${RECOMMENDED_PROCEDURE_LABEL[detail.trackingProcedure]})`
              : ""}
          </p>
          <div className="print-doc-meta">
            <div>
              <span>문서번호</span>
              <strong>#{detail.id}</strong>
            </div>
            <div>
              <span>상담일시</span>
              <strong>{formatDateTimeDisplay(detail.consultedAt)}</strong>
            </div>
            <div>
              <span>인쇄일시</span>
              <strong>{printedAt ? formatDateTimeLocal(printedAt) : "-"}</strong>
            </div>
            <div>
              <span>담당자</span>
              <strong>{detail.assigneeName || "-"}</strong>
            </div>
          </div>
        </header>

        <PrintSection number={sectionNumber++} title="고객 정보">
          <div className="print-customer-info-layout">
            <div className="print-customer-info-pair">
              <PrintCustomerInfoCard title="고객 정보">
                <PrintCustomerInfoRows rows={customerInfo.customerRows} />
              </PrintCustomerInfoCard>
              <PrintCustomerInfoCard title="자산현황">
                <PrintRichInfoRows rows={customerInfo.assetRows} />
              </PrintCustomerInfoCard>
            </div>

            <div className="print-customer-info-pair">
              <PrintCustomerInfoCard title="소득 / 지출">
                <PrintCustomerInfoRows rows={customerInfo.incomeRows} />
              </PrintCustomerInfoCard>
              <PrintCustomerInfoCard title="채무현황">
                <div className="print-customer-debt-card-content">
                  <PrintRichInfoRows rows={customerInfo.debtRows} />
                  <PrintCustomerInfoRows rows={customerInfo.debtTotalRows} />
                </div>
              </PrintCustomerInfoCard>
            </div>

            <PrintCustomerInfoCard title="기타사항">
              <dl className="print-customer-info-rows print-customer-other-rows">
                <div>
                  <dt>새출발기금</dt>
                  <dd><PrintSummaryLines lines={customerInfo.businessLines} /></dd>
                </div>
                <div>
                  <dt>기타 확인 사항</dt>
                  <dd><PrintSummaryLines lines={customerInfo.otherCheckLines} /></dd>
                </div>
                <div>
                  <dt>상담사 메모</dt>
                  <dd className="print-customer-memo">{customerInfo.counselorMemo}</dd>
                </div>
              </dl>
            </PrintCustomerInfoCard>
          </div>
        </PrintSection>

        <PrintSection number={sectionNumber++} title="AI 분석 추천">
          <p className="print-recommendation-title">{detail.recommendation.title}</p>
          <p className="print-paragraph">{detail.recommendation.description}</p>
          <InfoTable
            rows={[{ label: "AI 성공 가능성", value: `${detail.successProbability}/100`, emphasize: true }]}
          />
        </PrintSection>

        <PrintSection number={sectionNumber++} title="절차별 성공 가능성">
          <table className="print-data-table">
            <thead>
              <tr>
                <th>절차</th>
                <th>점수</th>
                <th>등급</th>
                <th>추천</th>
              </tr>
            </thead>
            <tbody>
              {procedureScores.map((score) => (
                <tr key={score.procedure} className={score.procedure === selectedProcedure ? "print-row-selected" : undefined}>
                  <td>{score.label}</td>
                  <td className="print-num">{score.score}/100</td>
                  <td>{PROCEDURE_GRADE_LABEL[score.grade]}</td>
                  <td>{score.recommended ? "추천" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {conditionAnalysis.length > 0 && (
            <InfoBlock title={`${RECOMMENDED_PROCEDURE_LABEL[selectedProcedure]} 조건 분석`}>
              <ul className="print-condition-list">
                {conditionAnalysis.map((item, index) => (
                  <li key={index} className={CONDITION_TEXT_CLASS[item.status]}>
                    <span className="print-condition-tag">{CONDITION_STATUS_LABEL[item.status]}</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </InfoBlock>
          )}
        </PrintSection>

        {detail.debtAdjustmentComparison && (
          <PrintSection number={sectionNumber++} title="채무조정 비교 요약">
            <p className="print-paragraph">{detail.debtAdjustmentComparison}</p>
          </PrintSection>
        )}

        <PrintSection number={sectionNumber++} title="채무 현황">
          <InfoTable
            rows={[
              { label: "총 채무 (원금)", value: formatManwonComma(detail.debtStatus.totalDebtManwon) },
              ...(detail.debtStatus.totalDebtWithInterestManwon != null
                ? [{ label: "총 상환 예정 (이자 포함)", value: formatManwonComma(detail.debtStatus.totalDebtWithInterestManwon) }]
                : []),
              { label: "총 자산", value: formatManwonComma(detail.debtStatus.totalAssetManwon) },
              { label: "월 가용소득", value: formatManwonComma(detail.debtStatus.monthlyAvailableIncomeManwon) },
              { label: "연체 기간", value: `${detail.debtStatus.overdueMonths}개월` },
            ]}
          />
          {debtComposition.length > 0 && (
            <InfoBlock title="채무 구성">
              <table className="print-data-table">
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>비율</th>
                    <th>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {debtComposition.map((item) => (
                    <tr key={item.label}>
                      <td>{item.label}</td>
                      <td className="print-num">{item.percent}%</td>
                      <td className="print-num">{formatManwonComma(item.amountManwon)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </InfoBlock>
          )}
        </PrintSection>

        <PrintSection number={sectionNumber++} title={repaymentTitle}>
          {repaymentKind === "full" && plan ? (
            <>
              <InfoTable
                rows={[
                  {
                    label: "월 변제액",
                    value: plan.monthlyPaymentManwon === 0 ? "산정 불가" : formatManwonComma(plan.monthlyPaymentManwon),
                    emphasize: true,
                  },
                  { label: "변제 기간", value: plan.monthlyPaymentManwon === 0 ? "-" : `${plan.months}개월 (${plan.years}년)` },
                  { label: "총 변제액", value: plan.monthlyPaymentManwon === 0 ? "-" : formatManwonComma(plan.totalPaymentManwon) },
                ]}
              />
              {plan.monthlyPaymentManwon > 0 && (
                <p className="print-paragraph">
                  앞으로 {formatYearsLabel(plan.months)}년간 {formatManwonComma(plan.monthlyPaymentManwon)}씩 변제 예정입니다
                  {startDate && endDate ? ` (${formatYearMonth(startDate)} ~ ${formatYearMonth(endDate)})` : ""}.
                </p>
              )}
              {plan.monthlyPaymentManwon > 0 && (
                <InfoTable
                  rows={[
                    ...(plan.exemptedDebtWithInterestManwon != null
                      ? [{ label: "예상 면책 채무 (이자 포함)", value: formatManwonComma(plan.exemptedDebtWithInterestManwon) }]
                      : []),
                    { label: "예상 면책 채무 (원금 기준)", value: formatManwonComma(plan.exemptedDebtManwon) },
                    {
                      label: `예상 잔여 채무${REMAINING_DEBT_SUBTITLE.full ? ` (${REMAINING_DEBT_SUBTITLE.full})` : ""}`,
                      value: formatManwonComma(plan.totalPaymentManwon),
                      emphasize: true,
                    },
                  ]}
                />
              )}
            </>
          ) : (
            <>
              {bucketSummary && (
                <>
                  <InfoTable rows={bucketSummary.rows} />
                  <p className="print-paragraph">{bucketSummary.sentence.replaceAll("**", "")}</p>
                </>
              )}
              {plan && (
                <InfoTable
                  rows={[
                    ...(plan.exemptedDebtWithInterestManwon != null
                      ? [{ label: "예상 면책 채무 (이자 포함)", value: formatManwonComma(plan.exemptedDebtWithInterestManwon) }]
                      : []),
                    { label: "예상 면책 채무 (원금 기준)", value: formatManwonComma(plan.exemptedDebtManwon) },
                    {
                      label: `예상 잔여 채무${REMAINING_DEBT_SUBTITLE[repaymentKind] ? ` (${REMAINING_DEBT_SUBTITLE[repaymentKind]})` : ""}`,
                      value: formatManwonComma(plan.totalPaymentManwon),
                      emphasize: true,
                    },
                  ]}
                />
              )}
            </>
          )}
          {repaymentNotes.length > 0 && (
            <InfoBlock title="주의사항">
              <ul className="print-note-list">
                {repaymentNotes.map((note, index) => (
                  <li key={index}>{note.replaceAll("**", "")}</li>
                ))}
              </ul>
            </InfoBlock>
          )}
        </PrintSection>

        {counselMents.length > 0 && (
          <PrintSection number={sectionNumber++} title="상담 포인트">
            {COUNSEL_CATEGORY_ORDER.map((category) => {
              const items = counselMents.filter((ment) => ment.category === category);
              if (items.length === 0) return null;
              const label = COUNSEL_MENT_TABS.find((tab) => tab.key === category)?.label ?? category;
              return (
                <InfoBlock key={category} title={label}>
                  <ul className="print-list">
                    {items.map((ment, index) => (
                      <li key={index}>{ment.text}</li>
                    ))}
                  </ul>
                </InfoBlock>
              );
            })}
          </PrintSection>
        )}

        <PrintSection number={sectionNumber++} title={`${guide.procedureLabel || RECOMMENDED_PROCEDURE_LABEL[selectedProcedure]} 진행 안내`}>
          <InfoTable
            rows={[
              {
                label: "현재 단계",
                value: guide.currentStep > 0 ? `${guide.currentStep}단계 / 총 ${guide.totalSteps}단계` : "진행 전",
              },
              { label: "예상 남은 기간", value: guide.estimatedRemaining || "-" },
              { label: "전체 예상 기간", value: guide.totalPeriodHint || "-" },
            ]}
          />
          <ol className="print-steps">
            {guideSteps.map((step) => {
              const history = step.stepId != null ? historyByStepId.get(step.stepId) : undefined;
              return (
                <li key={step.step} className={step.status === "in_progress" ? "print-step-current" : undefined}>
                  <div className="print-step-heading">
                    <span className="print-step-number">{step.step}</span>
                    <strong>{step.step}단계. {step.title}</strong>
                    <span className="print-step-status">{STEP_STATUS_LABEL[step.status]}</span>
                    {step.period && step.period !== "-" && <span className="print-step-period">{step.period}</span>}
                  </div>
                  {step.detail && <p className="print-step-detail">{step.detail}</p>}
                  {step.checklist && step.checklist.length > 0 && (
                    <ul className="print-list">
                      {step.checklist.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {step.note && <p className="print-step-note">{step.note}</p>}
                  {history && (
                    <p className="print-step-history">
                      {history.changedByMemberName}
                      {history.changedByProjectName ? ` (${history.changedByProjectName})` : ""}님이{" "}
                      {formatDateTimeDisplay(history.changedAt)}에 설정
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </PrintSection>

        {messages.length > 0 && (
          <PrintSection number={sectionNumber++} title="전달 이력">
            <table className="print-data-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>담당</th>
                  <th>일시</th>
                  <th>내용</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message, index) => (
                  <tr key={`${message.type}-${message.createdAt}-${index}`}>
                    <td>{MESSAGE_TYPE_LABEL[message.type]}</td>
                    <td>{[message.memberName, message.projectName].filter(Boolean).join(" · ") || "-"}</td>
                    <td className="print-num">{formatDateTimeDisplay(message.createdAt)}</td>
                    <td>{message.message?.trim() || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PrintSection>
        )}

        {chatMessages.length > 0 && (
          <PrintSection number={sectionNumber++} title="상담 채팅 기록">
            <div className="print-chat-list">
              {chatMessages.map((message) => (
                <p key={message.localId} className={message.role === "user" ? "print-chat-user" : "print-chat-assistant"}>
                  <span className="print-chat-role">{message.role === "user" ? "상담자" : "AI 상담"}</span>
                  {message.content}
                </p>
              ))}
            </div>
          </PrintSection>
        )}

        <footer className="print-doc-footer">
          본 문서는 입력 정보를 기준으로 한 AI 참고 분석 결과이며, 실제 법원·채권자 심사 결과 및 법적 효력을
          보장하지 않습니다.
        </footer>
      </article>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 16mm 14mm;
            @bottom-center {
              content: counter(page) " / " counter(pages);
              font-size: 8pt;
              color: #9ca3af;
            }
          }

          html,
          body {
            zoom: 1 !important;
            color-scheme: light !important;
            background: #ffffff !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body * {
            visibility: hidden !important;
          }
          .analysis-print-root,
          .analysis-print-root * {
            visibility: visible !important;
          }

          .analysis-print-root {
            display: block !important;
            position: absolute;
            inset: 0;
            width: 100%;
            color-scheme: light;
            --ink: #171717;
            --muted: #6b7280;
            --line: #d9dbe0;
            --line-soft: #e9eaee;
            --accent: #1d4ed8;
            --met: #1d4ed8;
            --caution: #b45309;
            --risk: #dc2626;
            color: var(--ink);
            background: #ffffff;
            font-family: inherit;
            font-size: 9.5pt;
            line-height: 1.55;
          }

          .print-doc-header {
            padding-bottom: 10px;
            border-bottom: 2px solid var(--ink);
          }
          .print-doc-eyebrow {
            margin: 0 0 4px;
            color: var(--muted);
            font-size: 8.5pt;
            font-weight: 600;
            letter-spacing: 0.02em;
          }
          .print-doc-header h1 {
            margin: 0;
            font-size: 19pt;
            font-weight: 800;
            letter-spacing: -0.02em;
          }
          .print-doc-subtitle {
            margin: 5px 0 0;
            color: var(--muted);
            font-size: 10pt;
            font-weight: 600;
          }
          .print-doc-meta {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 8px;
            margin-top: 12px;
          }
          .print-doc-meta > div {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 6px 10px;
            border: 1px solid var(--line-soft);
            border-radius: 6px;
          }
          .print-doc-meta span {
            color: var(--muted);
            font-size: 8pt;
          }
          .print-doc-meta strong {
            font-size: 9.5pt;
            font-weight: 700;
          }

          .print-section {
            margin-top: 18px;
          }
          .print-section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0 0 10px;
            padding-bottom: 6px;
            border-bottom: 1.5px solid var(--ink);
            font-size: 12.5pt;
            font-weight: 800;
            break-after: avoid-page;
          }
          .print-section-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            border-radius: 4px;
            background: var(--ink);
            color: #ffffff;
            font-size: 9pt;
            font-weight: 700;
          }

          .print-info-block + .print-info-block {
            margin-top: 12px;
          }
          .print-info-block-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .print-info-block h3 {
            margin: 0 0 6px;
            font-size: 9.5pt;
            font-weight: 700;
            color: var(--muted);
          }
          .print-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0 16px;
          }
          .print-customer-info-layout {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .print-customer-info-pair {
            display: grid;
            grid-template-columns: minmax(0, 314fr) minmax(0, 672fr);
            gap: 12px;
            break-inside: avoid;
          }
          .print-customer-info-card {
            min-height: 220px;
            padding: 12px 14px 14px;
            border: 1px solid #e2e2e2;
            border-radius: 8px;
            background: #f8f8f8;
            break-inside: avoid;
          }
          .print-customer-info-layout > .print-customer-info-card {
            min-height: 210px;
          }
          .print-customer-info-card > h3 {
            margin: 0 0 10px;
            color: var(--ink);
            font-size: 10pt;
            font-weight: 800;
          }
          .print-customer-info-rows {
            display: flex;
            flex-direction: column;
            gap: 7px;
            margin: 0;
          }
          .print-customer-info-rows > div {
            display: grid;
            grid-template-columns: 78px minmax(0, 1fr);
            gap: 10px;
            break-inside: avoid;
          }
          .print-customer-info-rows dt,
          .print-customer-info-rows dd {
            margin: 0;
            font-size: 8.5pt;
            line-height: 1.45;
          }
          .print-customer-info-rows dt {
            color: var(--muted);
            font-weight: 500;
          }
          .print-customer-info-rows dd {
            color: var(--ink);
            font-weight: 600;
            overflow-wrap: anywhere;
            white-space: pre-line;
          }
          .print-customer-rich-rows dd strong {
            display: block;
            font-weight: 800;
          }
          .print-customer-rich-rows dd p {
            margin: 0;
            color: #474747;
            font-weight: 400;
          }
          .print-customer-emphasize {
            font-weight: 800 !important;
          }
          .print-customer-debt-card-content {
            display: flex;
            min-height: 180px;
            flex-direction: column;
            gap: 10px;
          }
          .print-customer-debt-card-content > .print-customer-info-rows:last-child {
            margin-top: auto;
          }
          .print-customer-other-rows {
            gap: 10px;
          }
          .print-customer-other-rows > div {
            grid-template-columns: 92px minmax(0, 1fr);
          }
          .print-customer-summary-lines {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .print-customer-summary-lines p {
            margin: 0;
          }
          .print-customer-line-label {
            font-weight: 800;
          }
          .print-customer-memo {
            color: #474747 !important;
            font-weight: 400 !important;
          }
          .print-info-table {
            width: 100%;
            border-collapse: collapse;
          }
          .print-info-table tr {
            border-bottom: 1px solid var(--line-soft);
          }
          .print-info-table th,
          .print-info-table td {
            padding: 5px 4px;
            text-align: left;
            font-weight: 500;
            vertical-align: top;
          }
          .print-info-table th {
            width: 32%;
            color: var(--muted);
            font-weight: 500;
            white-space: nowrap;
          }
          .print-info-table td {
            font-weight: 600;
            white-space: pre-line;
            overflow-wrap: anywhere;
          }
          .print-emphasize {
            color: var(--accent) !important;
            font-weight: 800 !important;
          }

          .print-data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
          }
          .print-data-table th,
          .print-data-table td {
            border: 1px solid var(--line-soft);
            padding: 5px 6px;
            text-align: left;
            font-size: 8.8pt;
          }
          .print-data-table thead th {
            background: #f3f4f6;
            font-weight: 700;
            white-space: nowrap;
          }
          .print-data-table tbody tr {
            break-inside: avoid;
          }
          .print-num {
            text-align: right;
            font-variant-numeric: tabular-nums;
          }
          .print-row-selected {
            background: #eff6ff;
          }

          .print-recommendation-title {
            margin: 0 0 4px;
            font-size: 15pt;
            font-weight: 800;
          }
          .print-paragraph {
            margin: 6px 0;
            white-space: pre-wrap;
            font-size: 9.3pt;
          }

          .print-condition-list {
            margin: 0;
            padding: 0;
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          .print-condition-list li {
            display: flex;
            align-items: baseline;
            gap: 6px;
          }
          .print-condition-tag {
            flex-shrink: 0;
            display: inline-flex;
            min-width: 44px;
            justify-content: center;
            border: 1px solid currentColor;
            border-radius: 4px;
            padding: 0 4px;
            font-size: 7.8pt;
            font-weight: 700;
          }
          .print-condition-met {
            color: var(--met);
          }
          .print-condition-caution {
            color: var(--caution);
          }
          .print-condition-risk {
            color: var(--risk);
          }

          .print-list {
            margin: 0;
            padding-left: 16px;
          }
          .print-list li {
            margin: 3px 0;
          }
          .print-note-list {
            margin: 0;
            padding-left: 16px;
            color: var(--muted);
          }
          .print-note-list li {
            margin: 3px 0;
          }

          .print-steps {
            margin: 12px 0 0;
            padding: 0;
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .print-steps > li {
            break-inside: avoid;
            border: 1px solid var(--line-soft);
            border-radius: 6px;
            padding: 8px 10px;
          }
          .print-step-current {
            border-color: var(--ink) !important;
          }
          .print-step-heading {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
          }
          .print-step-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            border-radius: 999px;
            background: var(--line-soft);
            font-size: 7.8pt;
            font-weight: 700;
          }
          .print-step-status {
            font-size: 7.8pt;
            color: var(--muted);
          }
          .print-step-period {
            margin-left: auto;
            color: var(--muted);
            font-size: 8.2pt;
          }
          .print-step-detail,
          .print-step-note,
          .print-step-history {
            margin: 4px 0 0;
            color: var(--muted);
            font-size: 8.5pt;
          }

          .print-chat-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .print-chat-user,
          .print-chat-assistant {
            margin: 0;
            padding: 6px 10px;
            border-left: 3px solid var(--line);
            font-size: 8.8pt;
            white-space: pre-wrap;
          }
          .print-chat-user {
            border-left-color: var(--ink);
          }
          .print-chat-role {
            display: block;
            margin-bottom: 2px;
            color: var(--muted);
            font-size: 7.8pt;
            font-weight: 700;
          }

          .print-doc-footer {
            margin-top: 20px;
            padding-top: 8px;
            border-top: 1px solid var(--line-soft);
            color: var(--muted);
            font-size: 7.8pt;
          }
        }
      `}</style>
    </>
  );
}
