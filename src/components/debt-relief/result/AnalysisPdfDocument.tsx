import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  CONDITION_STATUS_LABEL,
  DIAGNOSIS_STATUS_LABEL,
  PROCEDURE_GRADE_LABEL,
  RECOMMENDED_PROCEDURE_LABEL,
  RECOMMENDED_PROCEDURE_ORDER,
  type ConditionStatus,
  type DiagnosisDetail,
  type ProcedureStep,
  type RecommendedProcedure,
} from "@/types/debtRelief";
import { formatDateTimeDisplay, formatManwonComma } from "@/components/debt-relief/format";
import {
  buildCustomerInfoViewModel,
  type DisplayRow,
  type RichDisplayRow,
  type SummaryLine,
} from "./customerInfoViewModel";
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
import type { DebtReliefChatUiMessage } from "./useDebtReliefAiChat";

// "PretendardPdf" 폰트 등록은 analysisPdfWorker가 렌더링 직전에 문서별 서브셋으로 해준다
// (원본 프리텐다르를 그대로 등록하면 fontkit 파싱 비용 때문에 생성이 수십 초씩 걸린다).
Font.registerHyphenationCallback((word) => [word]);

export const PRETENDARD_PDF_FONT_FAMILY = "PretendardPdf";

const colors = {
  ink: "#171717",
  muted: "#6b7280",
  line: "#d9dbe0",
  lineSoft: "#e9eaee",
  accent: "#1d4ed8",
  met: "#1d4ed8",
  caution: "#b45309",
  risk: "#dc2626",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingRight: 40,
    paddingBottom: 54,
    paddingLeft: 40,
    color: colors.ink,
    fontFamily: "PretendardPdf",
    fontSize: 8.5,
    lineHeight: 1.5,
  },
  header: {
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
  },
  eyebrow: { color: colors.muted, fontSize: 8.5, marginBottom: 3 },
  title: { fontSize: 19, fontWeight: 600, lineHeight: 1.25 },
  subtitle: { color: colors.muted, fontSize: 10, fontWeight: 600, marginTop: 5 },
  metaGrid: { flexDirection: "row", gap: 8, marginTop: 11 },
  metaCell: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: 6,
  },
  metaLabel: { color: colors.muted, fontSize: 7, marginBottom: 2 },
  metaValue: { fontSize: 8, fontWeight: 600 },
  section: { marginTop: 18 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.ink,
  },
  // PC 인쇄본(AnalysisPrintDocument)의 .print-section-number와 동일하게 — 검정 사각
  // 배지(파란 원이 아님). 절차 조건의 "충족"·강조 값 등 다른 곳의 파란색(accent)은 인쇄본과
  // 이미 일치하므로 건드리지 않는다, 이 번호 배지만 원래 인쇄본과 다르게 파랗게 들어가 있었다.
  sectionNumber: {
    width: 17,
    height: 17,
    borderRadius: 3,
    color: "#ffffff",
    backgroundColor: colors.ink,
    fontSize: 8,
    fontWeight: 600,
    textAlign: "center",
    paddingTop: 2.5,
  },
  sectionTitle: { fontSize: 12.5, fontWeight: 600 },
  block: { marginTop: 10 },
  blockTitle: { fontSize: 9.5, fontWeight: 600, marginBottom: 5 },
  paragraph: { marginBottom: 7, lineHeight: 1.6 },
  recommendationTitle: { fontSize: 11, fontWeight: 600, marginBottom: 4 },
  infoTable: { borderTopWidth: 1, borderTopColor: colors.line },
  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  infoLabel: {
    width: "32%",
    paddingVertical: 5,
    paddingHorizontal: 7,
    color: colors.muted,
    fontSize: 7.5,
  },
  // 고객 정보 카드 안 라벨은 인쇄본(.print-customer-info-rows dt)처럼 고정 폭(78px ≈ 58.5pt,
  // 96dpi→72pt 환산)을 쓴다 — 카드 폭이 인쇄본과 달라 %로는 라벨 폭이 벌어져 보인다.
  customerInfoLabelWidth: { width: 58.5 },
  infoValue: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 7,
    fontSize: 8,
    fontWeight: 600,
  },
  emphasized: { color: colors.accent, fontWeight: 600 },
  // 인쇄본(.print-data-table)은 line-soft 테두리·#f3f4f6 헤더 배경을 쓴다 — line(더 진한 색)을
  // 쓰면 표가 인쇄본보다 눈에 띄게 진해 보인다.
  table: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: colors.lineSoft },
  tableRow: { flexDirection: "row" },
  tableHeader: { backgroundColor: "#f3f4f6" },
  tableCell: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.lineSoft,
    fontSize: 7.4,
  },
  tableHeaderText: { fontWeight: 600, color: colors.muted },
  twoColumn: { flexDirection: "row", gap: 8 },
  // 인쇄본(.print-customer-info-pair)의 314:672 비율 그대로 — react-pdf도 숫자 flex는
  // CSS와 같은 flex-grow 비율로 동작해 50:50이 아니라 이 비율로 카드 폭이 나뉜다.
  customerInfoColumnLeft: { flex: 314 },
  customerInfoColumnRight: { flex: 672 },
  // 인쇄본(.print-customer-info-card)과 동일하게 옅은 회색 채움 배경을 준다 — 기존엔 배경
  // 없이 테두리만 있어서 카드가 더 밋밋하고 얇아 보였다.
  card: { borderWidth: 1, borderColor: "#e2e2e2", borderRadius: 8, backgroundColor: "#f8f8f8", padding: 8 },
  cardTitle: { fontSize: 9, fontWeight: 600, marginBottom: 5 },
  richRow: { marginBottom: 5 },
  richLabel: { color: colors.muted, fontSize: 7, marginBottom: 1 },
  richTitle: { fontSize: 8.2, fontWeight: 600 },
  richDescription: { color: colors.muted, fontSize: 7.2, marginTop: 1 },
  summaryLine: { marginBottom: 3 },
  // 인쇄본(.print-procedure-condition)은 선택 안 된 카드는 테두리가 투명(안 보임)이고,
  // 선택된 카드만 ink(검정) 테두리가 보인다 — 파란 테두리를 항상 그리는 건 인쇄본과 다르다.
  conditionCard: {
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 5,
    padding: 8,
    marginTop: 7,
  },
  conditionSelected: { borderColor: colors.ink },
  conditionTitle: { fontSize: 9, fontWeight: 600, marginBottom: 4 },
  conditionLine: { flexDirection: "row", gap: 5, marginTop: 3 },
  conditionTag: { width: 31, fontSize: 7, fontWeight: 600 },
  conditionText: { flex: 1, fontSize: 7.5 },
  note: { flexDirection: "row", gap: 5, marginTop: 3 },
  bullet: { width: 7, color: colors.muted },
  noteText: { flex: 1 },
  step: {
    borderLeftWidth: 2,
    borderLeftColor: colors.line,
    paddingLeft: 9,
    paddingBottom: 10,
  },
  // 인쇄본(.print-step-current)은 진행중 단계 강조색도 ink — stepStatus 문구도
  // (.print-step-status) 항상 muted 회색이라 파란색을 안 쓴다.
  stepCurrent: { borderLeftColor: colors.ink },
  stepHeading: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
  stepTitle: { flex: 1, fontSize: 9, fontWeight: 600 },
  stepStatus: { color: colors.muted, fontSize: 7, fontWeight: 600 },
  stepPeriod: { color: colors.muted, fontSize: 7 },
  stepBody: { color: colors.muted, fontSize: 7.5, marginBottom: 2 },
  history: { color: colors.muted, fontSize: 6.8, marginTop: 3 },
  chatItem: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft, paddingVertical: 6 },
  // 인쇄본(.print-chat-role)도 muted 회색 — 파란색이 아니다.
  chatRole: { color: colors.muted, fontSize: 7, fontWeight: 600, marginBottom: 2 },
  disclaimer: {
    marginTop: 18,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    color: colors.muted,
    fontSize: 7,
  },
  pageFooter: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 22,
    color: colors.muted,
    fontSize: 7,
    textAlign: "center",
  },
});

function formatDateTimeLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function PdfSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading} minPresenceAhead={40}>
        <Text style={styles.sectionNumber}>{number}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoRows({ rows, fixedLabelWidth }: { rows: DisplayRow[]; fixedLabelWidth?: boolean }) {
  return (
    <View style={styles.infoTable}>
      {rows.map((row, index) => (
        <View key={`${row.label}-${index}`} style={styles.infoRow} wrap={false}>
          <Text style={[styles.infoLabel, fixedLabelWidth ? styles.customerInfoLabelWidth : undefined]}>
            {row.label}
          </Text>
          <Text style={[styles.infoValue, row.emphasize ? styles.emphasized : undefined]}>
            {row.value || "-"}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]} wrap={false}>
        {headers.map((header) => (
          <Text key={header} style={[styles.tableCell, styles.tableHeaderText]}>
            {header}
          </Text>
        ))}
      </View>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.tableRow} wrap={false}>
          {headers.map((_, columnIndex) => (
            <Text key={columnIndex} style={styles.tableCell}>
              {row[columnIndex] || "-"}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function RichRows({ rows }: { rows: RichDisplayRow[] }) {
  return (
    <View>
      {rows.map((row) => (
        <View key={row.key} style={styles.richRow} wrap={false}>
          <Text style={styles.richLabel}>{row.label}</Text>
          <Text style={styles.richTitle}>{row.title || "-"}</Text>
          {row.description ? <Text style={styles.richDescription}>{row.description}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function SummaryLines({ lines }: { lines: SummaryLine[] }) {
  return (
    <View>
      {lines.map((line, index) => (
        <Text key={`${line.label}-${index}`} style={styles.summaryLine}>
          {line.label}
          {line.value ? ` - ${line.value}` : ""}
        </Text>
      ))}
    </View>
  );
}

function NoteList({ notes }: { notes: string[] }) {
  return (
    <View>
      {notes.map((note, index) => (
        <View key={index} style={styles.note} wrap={false}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.noteText}>{note.replaceAll("**", "")}</Text>
        </View>
      ))}
    </View>
  );
}

const conditionColor: Record<ConditionStatus, string> = {
  met: colors.met,
  caution: colors.caution,
  risk: colors.risk,
};

const stepStatusLabel: Record<ProcedureStep["status"], string> = {
  done: "완료",
  in_progress: "진행중",
  pending: "예정",
};

export default function AnalysisPdfDocument({
  detail,
  selectedProcedure,
  chatMessages,
  generatedAt,
}: {
  detail: DiagnosisDetail;
  selectedProcedure: RecommendedProcedure;
  chatMessages: DebtReliefChatUiMessage[];
  generatedAt: Date;
}) {
  const input = detail.inputData;
  const customerInfo = buildCustomerInfoViewModel(
    input,
    detail.collateralBreakdown ?? input.collateralBreakdown
  );
  const procedureScores = [...(detail.procedureScores ?? [])].sort(
    (left, right) =>
      RECOMMENDED_PROCEDURE_ORDER.indexOf(left.procedure) -
      RECOMMENDED_PROCEDURE_ORDER.indexOf(right.procedure)
  );
  const debtComposition = detail.debtStatus.composition ?? [];
  const repaymentKind = resolveSectionKind(selectedProcedure);
  const repaymentTitle = REPAYMENT_SECTION_TITLE[repaymentKind];
  const plan = detail.repaymentPlanByProcedure[selectedProcedure];
  const bucketSummary = BUCKET_SUMMARY[selectedProcedure];
  const startDate = parseConsultedAt(detail.consultedAt);
  const endDate = plan && startDate ? addMonths(startDate, plan.months) : null;
  const guide =
    detail.procedureGuideByProcedure[selectedProcedure] ?? detail.procedureGuide;
  const historyByStepId = new Map(
    (detail.procedureStepHistory ?? []).map((item) => [item.stepId, item])
  );
  let sectionNumber = 1;

  return (
    <Document
      title={`${detail.customerName} 고객 채무조정 진단 결과`}
      author="톡게이트"
      subject="채무조정 진단 결과"
      creator="Talkgate"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>톡게이트 채무조정 진단서</Text>
          <Text style={styles.title}>{detail.customerName} 고객 채무조정 진단 결과</Text>
          <Text style={styles.subtitle}>
            {DIAGNOSIS_STATUS_LABEL[detail.status]} · {RECOMMENDED_PROCEDURE_LABEL[selectedProcedure]}
            {selectedProcedure !== detail.trackingProcedure
              ? ` (추적 절차: ${RECOMMENDED_PROCEDURE_LABEL[detail.trackingProcedure]})`
              : ""}
          </Text>
          <View style={styles.metaGrid}>
            {[
              ["문서번호", `#${detail.id}`],
              ["상담일시", formatDateTimeDisplay(detail.consultedAt)],
              ["생성일시", formatDateTimeLocal(generatedAt)],
              ["담당자", detail.assigneeName || "-"],
            ].map(([label, value]) => (
              <View key={label} style={styles.metaCell}>
                <Text style={styles.metaLabel}>{label}</Text>
                <Text style={styles.metaValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <PdfSection number={sectionNumber++} title="고객 정보">
          <View style={styles.twoColumn}>
            <View style={[styles.card, styles.customerInfoColumnLeft]}>
              <Text style={styles.cardTitle}>고객 정보</Text>
              <InfoRows rows={customerInfo.customerRows} fixedLabelWidth />
            </View>
            <View style={[styles.card, styles.customerInfoColumnRight]}>
              <Text style={styles.cardTitle}>자산현황</Text>
              <RichRows rows={customerInfo.assetRows} />
            </View>
          </View>
          <View style={[styles.twoColumn, { marginTop: 8 }]}>
            <View style={[styles.card, styles.customerInfoColumnLeft]}>
              <Text style={styles.cardTitle}>소득 / 지출</Text>
              <InfoRows rows={customerInfo.incomeRows} fixedLabelWidth />
            </View>
            <View style={[styles.card, styles.customerInfoColumnRight]}>
              <Text style={styles.cardTitle}>채무현황</Text>
              <RichRows rows={customerInfo.debtRows} />
              <InfoRows rows={customerInfo.debtTotalRows} fixedLabelWidth />
            </View>
          </View>
          <View style={[styles.card, { marginTop: 8 }]}>
            <Text style={styles.cardTitle}>기타사항</Text>
            <Text style={styles.richLabel}>새출발기금</Text>
            <SummaryLines lines={customerInfo.businessLines} />
            <Text style={[styles.richLabel, { marginTop: 5 }]}>기타 확인 사항</Text>
            <SummaryLines lines={customerInfo.otherCheckLines} />
            <Text style={[styles.richLabel, { marginTop: 5 }]}>상담사 메모</Text>
            <Text>{customerInfo.counselorMemo || "-"}</Text>
          </View>
        </PdfSection>

        <PdfSection number={sectionNumber++} title="AI 분석 추천">
          <Text style={styles.recommendationTitle}>{detail.recommendation.title}</Text>
          <Text style={styles.paragraph}>{detail.recommendation.description}</Text>
          <InfoRows
            rows={[
              {
                label: "AI 성공 가능성",
                value: `${detail.successProbability}/100`,
                emphasize: true,
              },
            ]}
          />
        </PdfSection>

        <PdfSection number={sectionNumber++} title="절차별 성공 가능성">
          <DataTable
            headers={["절차", "점수", "등급", "추천"]}
            rows={procedureScores.map((score) => [
              score.label,
              `${score.score}/100`,
              PROCEDURE_GRADE_LABEL[score.grade],
              score.recommended ? "추천" : "-",
            ])}
          />
          {procedureScores.map((score) => {
            const conditions =
              detail.conditionAnalysisByProcedure[score.procedure] ??
              (score.procedure === selectedProcedure ? detail.conditionAnalysis ?? [] : []);
            return (
              <View
                key={score.procedure}
                style={[
                  styles.conditionCard,
                  score.procedure === selectedProcedure ? styles.conditionSelected : undefined,
                ]}
              >
                <Text style={styles.conditionTitle}>{score.label} 조건 분석</Text>
                {conditions.length > 0 ? (
                  conditions.map((condition, index) => (
                    <View key={index} style={styles.conditionLine} wrap={false}>
                      <Text
                        style={[styles.conditionTag, { color: conditionColor[condition.status] }]}
                      >
                        {CONDITION_STATUS_LABEL[condition.status]}
                      </Text>
                      <Text style={styles.conditionText}>{condition.text}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.richDescription}>조건 분석 정보가 없습니다.</Text>
                )}
              </View>
            );
          })}
        </PdfSection>

        {detail.debtAdjustmentComparison ? (
          <PdfSection number={sectionNumber++} title="채무조정 비교 요약">
            <Text style={styles.paragraph}>{detail.debtAdjustmentComparison}</Text>
          </PdfSection>
        ) : null}

        <PdfSection number={sectionNumber++} title="채무 현황">
          <InfoRows
            rows={[
              {
                label: "총 채무 (원금)",
                value: formatManwonComma(detail.debtStatus.totalDebtManwon),
              },
              ...(detail.debtStatus.totalDebtWithInterestManwon != null
                ? [
                    {
                      label: "총 상환 예정 (이자 포함)",
                      value: formatManwonComma(detail.debtStatus.totalDebtWithInterestManwon),
                    },
                  ]
                : []),
              { label: "총 자산", value: formatManwonComma(detail.debtStatus.totalAssetManwon) },
              {
                label: "월 가용소득",
                value: formatManwonComma(detail.debtStatus.monthlyAvailableIncomeManwon),
              },
              { label: "연체 기간", value: `${detail.debtStatus.overdueMonths}개월` },
            ]}
          />
          {debtComposition.length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>채무 구성</Text>
              <DataTable
                headers={["구분", "비율", "금액"]}
                rows={debtComposition.map((item) => [
                  item.label,
                  `${item.percent}%`,
                  formatManwonComma(item.amountManwon),
                ])}
              />
            </View>
          ) : null}
        </PdfSection>

        <PdfSection number={sectionNumber++} title={repaymentTitle}>
          {repaymentKind === "full" && plan ? (
            <>
              <InfoRows
                rows={[
                  {
                    label: "월 변제액",
                    value:
                      plan.monthlyPaymentManwon === 0
                        ? "산정 불가"
                        : formatManwonComma(plan.monthlyPaymentManwon),
                    emphasize: true,
                  },
                  {
                    label: "변제 기간",
                    value:
                      plan.monthlyPaymentManwon === 0
                        ? "-"
                        : `${plan.months}개월 (${plan.years}년)`,
                  },
                  {
                    label: "총 변제액",
                    value:
                      plan.monthlyPaymentManwon === 0
                        ? "-"
                        : formatManwonComma(plan.totalPaymentManwon),
                  },
                ]}
              />
              {plan.monthlyPaymentManwon > 0 ? (
                <Text style={[styles.paragraph, { marginTop: 7 }]}>
                  앞으로 {formatYearsLabel(plan.months)}년간 {formatManwonComma(plan.monthlyPaymentManwon)}씩
                  변제 예정입니다
                  {startDate && endDate
                    ? ` (${formatYearMonth(startDate)} ~ ${formatYearMonth(endDate)})`
                    : ""}
                  .
                </Text>
              ) : null}
            </>
          ) : bucketSummary ? (
            <>
              <InfoRows rows={bucketSummary.rows} />
              <Text style={[styles.paragraph, { marginTop: 7 }]}>
                {bucketSummary.sentence.replaceAll("**", "")}
              </Text>
            </>
          ) : null}
          {plan && plan.monthlyPaymentManwon > 0 ? (
            <InfoRows
              rows={[
                ...(plan.exemptedDebtWithInterestManwon != null
                  ? [
                      {
                        label: "예상 면책 채무 (이자 포함)",
                        value: formatManwonComma(plan.exemptedDebtWithInterestManwon),
                      },
                    ]
                  : []),
                {
                  label: "예상 면책 채무 (원금 기준)",
                  value: formatManwonComma(plan.exemptedDebtManwon),
                },
                {
                  label: `예상 잔여 채무${
                    REMAINING_DEBT_SUBTITLE[repaymentKind]
                      ? ` (${REMAINING_DEBT_SUBTITLE[repaymentKind]})`
                      : ""
                  }`,
                  value: formatManwonComma(plan.totalPaymentManwon),
                  emphasize: true,
                },
              ]}
            />
          ) : null}
          {detail.repaymentNotes.length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>주의사항</Text>
              <NoteList notes={detail.repaymentNotes} />
            </View>
          ) : null}
        </PdfSection>

        <PdfSection
          number={sectionNumber++}
          title={`${guide.procedureLabel || RECOMMENDED_PROCEDURE_LABEL[selectedProcedure]} 진행 안내`}
        >
          <InfoRows
            rows={[
              {
                label: "현재 단계",
                value:
                  guide.currentStep > 0
                    ? `${guide.currentStep}단계 / 총 ${guide.totalSteps}단계`
                    : "진행 전",
              },
              { label: "예상 남은 기간", value: guide.estimatedRemaining || "-" },
              { label: "전체 예상 기간", value: guide.totalPeriodHint || "-" },
            ]}
          />
          <View style={styles.block}>
            {(guide.steps ?? []).map((step) => {
              const history = step.stepId != null ? historyByStepId.get(step.stepId) : undefined;
              return (
                <View
                  key={step.step}
                  style={[styles.step, step.status === "in_progress" ? styles.stepCurrent : undefined]}
                >
                  <View style={styles.stepHeading} wrap={false}>
                    <Text style={styles.stepTitle}>{step.step}단계. {step.title}</Text>
                    <Text style={styles.stepStatus}>{stepStatusLabel[step.status]}</Text>
                    {step.period && step.period !== "-" ? (
                      <Text style={styles.stepPeriod}>{step.period}</Text>
                    ) : null}
                  </View>
                  {step.detail ? <Text style={styles.stepBody}>{step.detail}</Text> : null}
                  {step.checklist?.length ? <NoteList notes={step.checklist} /> : null}
                  {step.note ? <Text style={styles.stepBody}>{step.note}</Text> : null}
                  {history ? (
                    <Text style={styles.history}>
                      {history.changedByMemberName}
                      {history.changedByProjectName ? ` (${history.changedByProjectName})` : ""}님이{" "}
                      {formatDateTimeDisplay(history.changedAt)}에 설정
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </PdfSection>

        {detail.messages.length > 0 ? (
          <PdfSection number={sectionNumber++} title="전달 이력">
            <DataTable
              headers={["구분", "담당", "일시", "내용"]}
              rows={detail.messages.map((message) => [
                MESSAGE_TYPE_LABEL[message.type],
                [message.memberName, message.projectName].filter(Boolean).join(" · ") || "-",
                formatDateTimeDisplay(message.createdAt),
                message.message?.trim() || "-",
              ])}
            />
          </PdfSection>
        ) : null}

        {chatMessages.length > 0 ? (
          <PdfSection number={sectionNumber++} title="상담 채팅 기록">
            {chatMessages.map((message) => (
              <View key={message.localId} style={styles.chatItem} wrap={false}>
                <Text style={styles.chatRole}>{message.role === "user" ? "상담자" : "AI 상담"}</Text>
                <Text>{message.content}</Text>
              </View>
            ))}
          </PdfSection>
        ) : null}

        <Text style={styles.disclaimer}>
          본 문서는 입력 정보를 기준으로 한 AI 참고 분석 결과이며, 실제 법원·채권자 심사 결과 및 법적
          효력을 보장하지 않습니다.
        </Text>
        <Text
          fixed
          style={styles.pageFooter}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
