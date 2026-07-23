"use client";

import { useState, useRef, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { RECOMMENDED_PROCEDURE_LABEL, type DiagnosisDetail } from "@/types/debtRelief";
import { StatusBadge } from "@/components/debt-relief/DiagnosisBadges";
import { formatContactForDisplay } from "@/utils/format";
import { AnalysisService } from "@/services/analysis";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { showConfirmModal } from "@/providers/ConfirmModalProvider";
import { useCustomerModal } from "@/providers/CustomerModalProvider";
import AnalysisShareModal from "@/components/debt-relief/hub/AnalysisShareModal";
import CustomerLinkModeModal from "@/components/chat/customer-link/CustomerLinkModeModal";
import { useProjectType } from "@/hooks/useProjectType";
import CustomerMatchModal from "./CustomerMatchModal";
import CustomerCreateMatchModal from "./CustomerCreateMatchModal";
import DiagnosisCustomerInfoModal from "./DiagnosisCustomerInfoModal";
import FeePaymentInfoModal from "./FeePaymentInfoModal";

function EditIcon() {
  const maskId = useId();
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <mask id={maskId} maskUnits="userSpaceOnUse" x="2" y="2.01465" width="16" height="16" fill="black">
        <rect fill="white" x="2" y="2.01465" width="16" height="16" />
        <path d="M15.5118 4.50184C14.861 3.85225 13.8057 3.85225 13.1548 4.50184L4 13.6386V16.0146H6.33334L15.5118 6.85423C16.1627 6.20464 16.1627 5.15144 15.5118 4.50184Z" />
      </mask>
      <path
        d="M12.1548 5.49988L11.625 6.03073L13.982 8.38311L14.5118 7.85226L15.0416 7.32141L12.6846 4.96902L12.1548 5.49988ZM15.5118 4.50184L16.5715 3.44014V3.44014L15.5118 4.50184ZM6.33334 16.0146V17.5146C6.73065 17.5146 7.11174 17.357 7.39295 17.0764L6.33334 16.0146ZM4 16.0146H2.5C2.5 16.8431 3.17157 17.5146 4 17.5146V16.0146ZM4 13.6386L2.94039 12.5769C2.65844 12.8583 2.5 13.2403 2.5 13.6386H4ZM13.1548 4.50184L14.2144 5.56355C14.2798 5.49835 14.3869 5.49835 14.4522 5.56355L15.5118 4.50184L16.5715 3.44014C15.335 2.20615 13.3316 2.20615 12.0952 3.44014L13.1548 4.50184ZM15.5118 4.50184L14.4522 5.56355C14.5159 5.62712 14.5159 5.72896 14.4522 5.79252L15.5118 6.85423L16.5715 7.91594C17.8095 6.68032 17.8095 4.67576 16.5715 3.44014L15.5118 4.50184ZM15.5118 6.85423L14.4522 5.79252L5.27373 14.9529L6.33334 16.0146L7.39295 17.0764L16.5715 7.91594L15.5118 6.85423ZM6.33334 16.0146V14.5146H4V16.0146V17.5146H6.33334V16.0146ZM13.1548 4.50184L12.0952 3.44014L2.94039 12.5769L4 13.6386L5.05961 14.7003L14.2144 5.56355L13.1548 4.50184ZM4 13.6386H2.5V16.0146H4H5.5V13.6386H4Z"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
      <path d="M11 5L15 9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ShareNodesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M13.2456 2.16699C13.3221 2.21233 13.3952 2.27336 13.4897 2.37305L17.7856 6.90039C17.8219 6.9386 17.8355 6.98151 17.8325 7.03223C17.8293 7.0875 17.8038 7.15358 17.7515 7.21094L13.4712 11.4678L13.4595 11.4795C13.4292 11.5115 13.4007 11.524 13.3774 11.5283C13.3522 11.5329 13.3198 11.5306 13.2837 11.5146C13.244 11.4972 13.1803 11.4313 13.1802 11.3154L13.1772 9.13965L13.1763 8.63281L12.6694 8.64062C10.8762 8.66796 9.50052 9.69207 8.53076 11.0303L8.34229 11.3018C8.11843 11.6387 7.92787 11.9765 7.73975 12.3037C7.70556 12.3631 7.66775 12.3959 7.64014 12.4111C7.62772 12.418 7.61607 12.4219 7.60498 12.4238H7.57178C7.50407 12.4126 7.4443 12.3604 7.4292 12.29C6.9486 10.0334 7.50052 8.03802 9.09619 6.47949L9.10596 6.4707L9.11377 6.46191C10.0027 5.50101 11.2605 5.105 12.6118 4.99121L13.0698 4.95312V4.49316L13.0679 2.42676C13.0678 2.28278 13.1299 2.20535 13.2222 2.16699H13.2456ZM13.4136 4.08887L13.4009 5.13379V5.1582C13.4042 5.25185 13.3735 5.30258 13.3442 5.33105C13.3114 5.36284 13.2537 5.39186 13.1685 5.39062H13.1675C12.395 5.37892 11.644 5.49605 10.9106 5.76562C10.5502 5.89816 10.1637 6.06262 9.80518 6.34766H9.8042C8.58447 7.31833 7.87661 8.36905 7.67725 10.0039L7.47607 11.6543L8.5542 10.3887C9.0563 9.79925 9.53885 9.34419 10.1411 8.97168C11.137 8.35637 12.2441 8.11784 13.3589 8.28125C13.4322 8.29215 13.5112 8.35326 13.5112 8.49316V8.49902L13.521 9.61133L13.5317 10.7627L14.3657 9.96973L17.0659 7.40039L17.4292 7.05566L17.0835 6.69336L14.2759 3.75L13.4292 2.86328L13.4136 4.08887Z"
        fill="currentColor"
        stroke="currentColor"
      />
      <path
        d="M9.04778 3.33301H5.3335C4.22893 3.33301 3.3335 4.22844 3.3335 5.33301V14.6663C3.3335 15.7709 4.22893 16.6663 5.3335 16.6663H14.6668C15.7714 16.6663 16.6668 15.7709 16.6668 14.6663V10.9521"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PaymentCardIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M2.5 8.33366H17.5M5.83333 12.5003H6.66667M10 12.5003H10.8333M5 15.8337H15C16.3807 15.8337 17.5 14.7144 17.5 13.3337V6.66699C17.5 5.28628 16.3807 4.16699 15 4.16699H5C3.61929 4.16699 2.5 5.28628 2.5 6.66699V13.3337C2.5 14.7144 3.61929 15.8337 5 15.8337Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 계약대기중 + 결제정보 미입력 상태에서 "결제정보" 버튼 아래에 떠서 클릭을 유도하는 말풍선.
// 결제정보를 입력해야 절차 진행(진행 절차 선택 → 절차진행중)이 시작된다는 걸 안내한다.
// 말풍선 클릭 또는 결제정보 버튼 클릭 시 닫힌다.
function PaymentInfoNudgeBubble({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2">
      <button
        type="button"
        onClick={onDismiss}
        aria-label="결제정보 안내 닫기"
        className="animate-payment-nudge-in relative w-max max-w-[180px] cursor-pointer rounded-[8px] bg-neutral-90 dark:bg-neutral-20 px-3 py-2 text-center text-[12px] font-medium leading-[16px] text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
      >
        <span
          className="absolute -top-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-neutral-90 dark:bg-neutral-20"
          aria-hidden
        />
        결제 정보를 입력하면
        <br />
        절차 진행이 시작돼요
      </button>
    </div>
  );
}

// 모바일 "전달사항" 토글 — 원형 테두리(34x34)가 아이콘 안에 포함돼 있어 버튼 자체엔
// 별도 배경/테두리 클래스가 필요 없다. 꺼짐: neutral-30 테두리 + neutral-50 아이콘.
// 켜짐: secondary-40 테두리 + secondary-10/50 배경(반투명) + secondary-20 아이콘.
function AnnotationToggleIcon({ active }: { active: boolean }) {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
      <rect
        x="0.5"
        y="0.5"
        width="33"
        height="33"
        rx="16.5"
        className={
          active
            ? "fill-[rgba(228,237,255,0.5)] stroke-[var(--secondary-40)] dark:fill-blue-950 dark:stroke-blue-800"
            : "fill-transparent stroke-neutral-30"
        }
      />
      <path
        d="M12.8333 13.6663H21.1667M12.8333 16.9997H16.1667M17 23.6663L13.6667 20.333H11.1667C10.2462 20.333 9.5 19.5868 9.5 18.6663V11.9997C9.5 11.0792 10.2462 10.333 11.1667 10.333H22.8333C23.7538 10.333 24.5 11.0792 24.5 11.9997V18.6663C24.5 19.5868 23.7538 20.333 22.8333 20.333H20.3333L17 23.6663Z"
        className={
          active
            ? "stroke-[var(--secondary-20)] dark:stroke-blue-300"
            : "stroke-neutral-50 dark:stroke-neutral-60"
        }
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CustomerInfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M13.3332 5.83333C13.3332 7.67428 11.8408 9.16667 9.99984 9.16667C8.15889 9.16667 6.6665 7.67428 6.6665 5.83333C6.6665 3.99238 8.15889 2.5 9.99984 2.5C11.8408 2.5 13.3332 3.99238 13.3332 5.83333Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.99984 11.6667C6.77818 11.6667 4.1665 14.2783 4.1665 17.5H15.8332C15.8332 14.2783 13.2215 11.6667 9.99984 11.6667Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UnlinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M11.5237 8.47631C10.2219 7.17456 8.11139 7.17456 6.80964 8.47631L3.47631 11.8096C2.17456 13.1114 2.17456 15.2219 3.47631 16.5237C4.77806 17.8254 6.88861 17.8254 8.19036 16.5237L9.10832 15.6057M8.47631 11.5237C9.77806 12.8254 11.8886 12.8254 13.1904 11.5237L16.5237 8.19036C17.8254 6.88861 17.8254 4.77806 16.5237 3.47631C15.2219 2.17456 13.1114 2.17456 11.8096 3.47631L10.8933 4.39265"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 3L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ShareMenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M11.6667 3.33301H15.8333M15.8333 3.33301V7.49967M15.8333 3.33301L10 9.16634M8.33333 5.83301H5.83333C4.91286 5.83301 4.16667 6.5792 4.16667 7.49967V14.1663C4.16667 15.0868 4.91286 15.833 5.83333 15.833H12.5C13.4205 15.833 14.1667 15.0868 14.1667 14.1663V11.6663"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkedCustomerIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M11.5237 8.47631C10.2219 7.17456 8.11139 7.17456 6.80964 8.47631L3.47631 11.8096C2.17456 13.1114 2.17456 15.2219 3.47631 16.5237C4.77806 17.8254 6.88861 17.8254 8.19036 16.5237L9.10832 15.6057M8.47631 11.5237C9.77806 12.8254 11.8886 12.8254 13.1904 11.5237L16.5237 8.19036C17.8254 6.88861 17.8254 4.77806 16.5237 3.47631C15.2219 2.17456 13.1114 2.17456 11.8096 3.47631L10.8933 4.39265"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 모바일 헤더 액션 통합 버튼 — 피그마 vertical dots (34x34, radius 5, white + #E2E2E2)
function MobileActionsMoreIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="0.5" y="0.5" width="35" height="35" rx="5.5" className="fill-white dark:fill-neutral-10 stroke-neutral-30" />
      <path
        d="M17.9997 12.1663L17.9997 12.1747M17.9997 17.9997L17.9997 18.008M17.9997 23.833L17.9997 23.8413M17.9997 12.9997C17.5394 12.9997 17.1663 12.6266 17.1663 12.1663C17.1663 11.7061 17.5394 11.333 17.9997 11.333C18.4599 11.333 18.833 11.7061 18.833 12.1663C18.833 12.6266 18.4599 12.9997 17.9997 12.9997ZM17.9997 18.833C17.5394 18.833 17.1663 18.4599 17.1663 17.9997C17.1663 17.5394 17.5394 17.1663 17.9997 17.1663C18.4599 17.1663 18.833 17.5394 18.833 17.9997C18.833 18.4599 18.4599 18.833 17.9997 18.833ZM17.9997 24.6663C17.5394 24.6663 17.1663 24.2932 17.1663 23.833C17.1663 23.3728 17.5394 22.9997 17.9997 22.9997C18.4599 22.9997 18.833 23.3728 18.833 23.833C18.833 24.2932 18.4599 24.6663 17.9997 24.6663Z"
        className="stroke-neutral-90"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ACTION_BTN =
  "cursor-pointer inline-flex items-center justify-center gap-2.5 h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-black dark:text-foreground hover:bg-neutral-10 whitespace-nowrap";

// 공유된 건(isShared)일 때만 파란색 — 리스트 페이지의 AnalysisShareIcon tone="active"와 동일한 톤.
// 타이포는 ACTION_BTN과 동일해야 하는데 색상만 오버라이드하다가 사이즈 클래스가 누락돼 있었음(브라우저 기본값 16px/400으로 렌더링되던 버그)
// 다크모드는 라이트용 파스텔(secondary-10)을 그대로 쓰면 어두운 카드 위에서 혼자 튀어서
// FeePaymentInfoModal의 결제상태 칩과 동일하게 진한 네이비(blue-950/800/300)로 대체
// 공유 완료 상태에서는 재공유 불가 → cursor-default, hover 없음
const ACTION_BTN_SHARED =
  "inline-flex items-center justify-center gap-2.5 h-[34px] max-w-[220px] px-3 rounded-[5px] border border-secondary-60 dark:border-blue-800 bg-secondary-10 dark:bg-blue-950 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-secondary-60 dark:text-blue-300 cursor-default whitespace-nowrap disabled:opacity-100";

const LINKED_CHIP_BTN =
  "cursor-pointer inline-flex items-center justify-center gap-2.5 h-[34px] max-w-[244px] px-[7px] py-1.5 rounded-[5px] bg-secondary-10 dark:bg-blue-950 border border-secondary-60 dark:border-blue-800 text-secondary-40 dark:text-blue-300 hover:opacity-90 transition-opacity";
const MENU_ITEM =
  "cursor-pointer w-full flex items-center gap-2.5 px-4 py-3 text-left text-[14px] font-medium text-foreground hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent";

type Props = {
  detail: DiagnosisDetail;
  projectId: string | null;
  onCustomerMatchChange: () => void;
  // 모바일 전용 "전달사항" 토글 아이콘. AI 분석 추천을 보여줄 수 있는 화면(전달사항이
  // 그 영역을 덮는 팝업으로 뜨는 화면)에서만 부모가 넘겨준다.
  showMessagesToggle?: boolean;
  messagesOpen?: boolean;
  onToggleMessages?: () => void;
};

function LinkedCustomerMenu({
  open,
  onOpenCustomerInfo,
  onUnlink,
}: {
  open: boolean;
  onOpenCustomerInfo: () => void;
  onUnlink: () => void;
}) {
  if (!open) return null;
  return (
    <div
      role="menu"
      className="absolute right-0 top-full mt-2 z-30 min-w-[140px] rounded-[12px] bg-card border border-border shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)] overflow-hidden"
    >
      <button type="button" role="menuitem" onClick={onOpenCustomerInfo} className={MENU_ITEM}>
        <CustomerInfoIcon />
        고객정보
      </button>
      <button type="button" role="menuitem" onClick={onUnlink} className={MENU_ITEM}>
        <UnlinkIcon />
        연결해제
      </button>
    </div>
  );
}

function MobileActionsMenu({
  open,
  isShared,
  onCustomerLink,
  onEdit,
  onPaymentInfo,
  onShare,
}: {
  open: boolean;
  isShared: boolean;
  onCustomerLink: () => void;
  onEdit: () => void;
  onPaymentInfo: () => void;
  onShare: () => void;
}) {
  if (!open) return null;
  return (
    <div
      role="menu"
      className="absolute right-0 top-full mt-2 z-30 min-w-[148px] rounded-[12px] bg-card border border-border shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)] overflow-hidden"
    >
      <button type="button" role="menuitem" onClick={onCustomerLink} className={MENU_ITEM}>
        <LinkedCustomerIcon />
        고객연동
      </button>
      <button type="button" role="menuitem" onClick={onEdit} className={MENU_ITEM}>
        <EditIcon />
        정보수정
      </button>
      <button type="button" role="menuitem" onClick={onPaymentInfo} className={MENU_ITEM}>
        <PaymentCardIcon />
        결제정보
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={onShare}
        disabled={isShared}
        className={MENU_ITEM}
      >
        <ShareMenuIcon />
        공유하기
      </button>
    </div>
  );
}

// size: 데스크톱 헤더는 36(기본), 모바일 고객정보 칩 안에서는 24로 축소해 쓴다(viewBox는
// 36x36 그대로 두고 렌더 크기만 줄여 내부 비율을 유지).
function MoreOptionsIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect
        x="0.5"
        y="0.5"
        width="35"
        height="35"
        rx="17.5"
        className="fill-neutral-10 dark:fill-neutral-20 stroke-neutral-30"
      />
      <path
        d="M11 18H11.01M18 18H18.01M25 18H25.01M12 18C12 18.5523 11.5523 19 11 19C10.4477 19 10 18.5523 10 18C10 17.4477 10.4477 17 11 17C11.5523 17 12 17.4477 12 18ZM19 18C19 18.5523 18.5523 19 18 19C17.4477 19 17 18.5523 17 18C17 17.4477 17.4477 17 18 17C18.5523 17 19 17.4477 19 18ZM26 18C26 18.5523 25.5523 19 25 19C24.4477 19 24 18.5523 24 18C24 17.4477 24.4477 17 25 17C25.5523 17 26 17.4477 26 18Z"
        className="stroke-neutral-60 dark:stroke-neutral-50"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AssigneeProfileChip({
  name,
  projectName,
  profileImageUrl,
}: {
  name?: string;
  projectName?: string;
  profileImageUrl?: string;
}) {
  const initial = name?.charAt(0) ?? "?";
  const hasPerson = Boolean(name || projectName);

  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-[14px] font-medium leading-[17px] text-neutral-60 whitespace-nowrap shrink-0">
        담당직원&nbsp;|&nbsp;
      </span>
      {!hasPerson ? (
        <span className="text-[14px] font-medium text-neutral-50">-</span>
      ) : (
        <>
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt=""
              className="w-8 h-8 rounded-full object-cover shrink-0 bg-neutral-20"
            />
          ) : (
            <span className="w-8 h-8 rounded-full bg-neutral-20 text-neutral-60 text-[12px] font-semibold inline-flex items-center justify-center shrink-0">
              {initial}
            </span>
          )}
          <div className="flex flex-col min-w-0">
            {name ? (
              <p className="text-[14px] font-semibold leading-[17px] text-foreground opacity-80 truncate">
                {name}
              </p>
            ) : null}
            {projectName ? (
              <p className="text-[12px] font-medium leading-[14px] text-neutral-60 opacity-80 truncate">
                {projectName}
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

export default function ResultHeader({
  detail,
  projectId,
  onCustomerMatchChange,
  showMessagesToggle = false,
  messagesOpen = false,
  onToggleMessages,
}: Props) {
  const router = useRouter();
  const { openCustomerModal } = useCustomerModal();
  const { isAnalysis, isLawyer, ready: projectTypeReady } = useProjectType();
  const [linkStep, setLinkStep] = useState<null | "mode" | "existing" | "create">(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [paymentInfoOpen, setPaymentInfoOpen] = useState(false);
  const [paymentNudgeDismissed, setPaymentNudgeDismissed] = useState(false);
  const [customerInfoOpen, setCustomerInfoOpen] = useState(false);
  const [linkedMenuOpen, setLinkedMenuOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const mobileLinkedMenuRef = useRef<HTMLDivElement>(null);
  const mobileActionsMenuRef = useRef<HTMLDivElement>(null);
  const desktopLinkedMenuRef = useRef<HTMLDivElement>(null);
  const isMatched = detail.customerId != null;
  // 리스트와 동일: 영업점(analysis)만 연동·수정·공유 액션 세트 노출
  const showOwnerActions = projectTypeReady && isAnalysis;
  const showAssigneeProfile = projectTypeReady && isLawyer;
  // 계약대기중인데 결제정보가 아직 없으면 절차 진행이 시작되지 않은 상태 — 결제정보 입력을 유도한다.
  // 말풍선·결제정보 버튼 클릭으로 닫으면 다시 띄우지 않는다.
  const showPaymentNudge =
    (showOwnerActions || showAssigneeProfile) &&
    detail.status === "contract_pending" &&
    !detail.feePlan &&
    !paymentNudgeDismissed;

  // 공유 완료(isShared): 라벨을 공유처 프로젝트명으로 바꾸고 재공유 클릭을 막는다.
  const shareLabel = detail.isShared
    ? detail.lawyerProjectName?.trim() || "공유됨"
    : "공유하기";

  const handleShareClick = () => {
    if (detail.isShared) return;
    setActionsMenuOpen(false);
    setShareOpen(true);
  };

  const handleOpenPaymentInfo = () => {
    setPaymentNudgeDismissed(true);
    setActionsMenuOpen(false);
    setPaymentInfoOpen(true);
  };

  const handleDismissPaymentNudge = () => {
    setPaymentNudgeDismissed(true);
  };

  const phonePreview = detail.phone ? formatContactForDisplay(detail.phone) : "";
  const linkedLabel =
    phonePreview.length > 0
      ? `${detail.customerName} · ${phonePreview}`
      : detail.customerName;

  useEffect(() => {
    if (!linkedMenuOpen && !actionsMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const inMobileLinked = mobileLinkedMenuRef.current?.contains(target);
      const inMobileActions = mobileActionsMenuRef.current?.contains(target);
      const inDesktop = desktopLinkedMenuRef.current?.contains(target);
      if (!inMobileLinked && !inMobileActions && !inDesktop) {
        setLinkedMenuOpen(false);
        setActionsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [linkedMenuOpen, actionsMenuOpen]);

  const handleEdit = () => {
    setActionsMenuOpen(false);
    // 정보수정(재분석)은 상담중/반려된 건만 가능 — 계약 이후(계약대기중 이상) 건은 절차가 이미
    // 진행돼 입력값을 되돌려 재분석하면 안 되므로 서버도 이 상태에서만 허용한다.
    if (detail.status !== "consulting" && detail.status !== "rejected") {
      showErrorModal({
        type: "info",
        title: "정보수정 불가",
        headline: "정보수정은 상담중 또는 반려된 분석 건만 가능합니다.",
        hideCancel: true,
      });
      return;
    }
    router.push(`/debt-relief/${detail.id}/edit`);
  };
  const handleGoToList = () => {
    router.push("/debt-relief");
  };

  const handleOpenMatchModal = () => {
    setActionsMenuOpen(false);
    setLinkStep("mode");
  };

  const handleCloseLinkFlow = () => {
    setLinkStep(null);
  };

  const handleOpenCustomerDetail = () => {
    if (detail.customerId == null) return;
    setLinkedMenuOpen(false);
    setActionsMenuOpen(false);
    openCustomerModal(detail.customerId);
  };

  const handleUnlink = () => {
    setLinkedMenuOpen(false);
    setActionsMenuOpen(false);
    showConfirmModal({
      headline: "고객 연결을 해제할까요?",
      message: "연결을 해제하면 문자 발송에 필요한 연락처 정보가 사라집니다.",
      type: "warning",
      confirmText: "해제",
      onConfirm: async () => {
        if (!projectId) return;
        try {
          await AnalysisService.unmatchCustomer(Number(detail.id), projectId);
          onCustomerMatchChange();
        } catch (error) {
          console.error("Failed to unmatch customer:", error);
          showErrorModal({
            headline: "연결 해제에 실패했습니다.",
            description: "잠시 후 다시 시도해주세요.",
          });
        }
      },
    });
  };

  const handleMobileCustomerLink = () => {
    setActionsMenuOpen(false);
    if (isMatched) {
      setLinkedMenuOpen(true);
      return;
    }
    handleOpenMatchModal();
  };

  const assigneeProfile = (
    <AssigneeProfileChip
      name={detail.assigneeName}
      projectName={detail.assigneeProjectName}
      profileImageUrl={detail.assigneeProfileImageUrl}
    />
  );

  const customerSummaryLabel = [detail.customerName, detail.ageGroupLabel, detail.occupation]
    .filter(Boolean)
    .join(" · ");

  const inProgressStepLabel =
    detail.status === "in_progress" && detail.procedureGuide.totalSteps > 1
      ? `${detail.procedureGuide.currentStep}/${detail.procedureGuide.totalSteps}`
      : undefined;

  const statusBadge = (
    <StatusBadge
      status={detail.status}
      rejectionReason={detail.rejectionReason}
      stepLabel={inProgressStepLabel}
    />
  );

  const customerInfoButton = (
    <button
      type="button"
      onClick={() => setCustomerInfoOpen(true)}
      aria-label="고객정보"
      className="cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
    >
      <MoreOptionsIcon />
    </button>
  );

  // 모바일 2줄째 "김민수 · 42세 · 자영업 ⋯" 칩 안에 들어가는 축소 버전(24px).
  const customerInfoButtonCompact = (
    <button
      type="button"
      onClick={() => setCustomerInfoOpen(true)}
      aria-label="고객정보"
      className="cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
    >
      <MoreOptionsIcon size={24} />
    </button>
  );

  return (
    <>
      {/* 모바일·태블릿(lg 미만): 1줄(뒤로+제목+상태[+공유처칩] | ⋮ 액션메뉴),
          2줄(고객메타+⋯ | 전달사항 토글).
          영업점 액션(연동·수정·결제·공유)은 ⋮ 플로팅으로 통합.
          태블릿(md~lg)도 PC 버튼 세트가 겹쳐 보여 이 컴팩트 레이아웃을 lg까지 확장. */}
      <div className="flex lg:hidden flex-col pt-1.5">
        <div className="flex items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={handleGoToList}
              aria-label="목록으로"
              className="cursor-pointer w-6 h-6 -ml-1.5 grid place-items-center text-foreground hover:opacity-70 shrink-0"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15 19L8 12L15 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h1 className="text-[18px] font-semibold leading-[21px] text-black dark:text-neutral-90 truncate min-w-0">
              {RECOMMENDED_PROCEDURE_LABEL[detail.trackingProcedure]}
            </h1>
            <div className="shrink-0">{statusBadge}</div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {detail.isShared ? (
              <span className="inline-flex h-[22px] items-center justify-center rounded-[24px] border border-neutral-20 px-2 py-0.5 whitespace-nowrap">
                <span className="text-[12px] font-semibold leading-[17px] text-neutral-60">
                  {shareLabel}
                </span>
              </span>
            ) : null}

            {showOwnerActions ? (
              <div className="relative" ref={mobileActionsMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setLinkedMenuOpen(false);
                    setActionsMenuOpen((prev) => !prev);
                  }}
                  aria-label="더보기"
                  aria-expanded={actionsMenuOpen || linkedMenuOpen}
                  className="cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
                >
                  <MobileActionsMoreIcon />
                </button>
                {showPaymentNudge && !actionsMenuOpen && !linkedMenuOpen ? (
                  <PaymentInfoNudgeBubble onDismiss={handleDismissPaymentNudge} />
                ) : null}
                <MobileActionsMenu
                  open={actionsMenuOpen}
                  isShared={detail.isShared}
                  onCustomerLink={handleMobileCustomerLink}
                  onEdit={handleEdit}
                  onPaymentInfo={handleOpenPaymentInfo}
                  onShare={handleShareClick}
                />
                <div ref={mobileLinkedMenuRef}>
                  <LinkedCustomerMenu
                    open={linkedMenuOpen}
                    onOpenCustomerInfo={handleOpenCustomerDetail}
                    onUnlink={handleUnlink}
                  />
                </div>
              </div>
            ) : showAssigneeProfile ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleOpenPaymentInfo}
                    aria-label="결제정보"
                    className="cursor-pointer w-9 h-9 grid place-items-center rounded-[8px] border border-neutral-30 text-foreground hover:bg-neutral-10"
                  >
                    <PaymentCardIcon />
                  </button>
                  {showPaymentNudge && <PaymentInfoNudgeBubble onDismiss={handleDismissPaymentNudge} />}
                </div>
                {assigneeProfile}
              </div>
            ) : null}
          </div>
        </div>

        <div className="-mx-6 border-t border-neutral-30" />

        <div className="flex items-center justify-between gap-3 pt-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 items-center gap-2.5 rounded-full border border-neutral-30 px-3 py-1.5">
              <p className="min-w-0 truncate text-[14px] font-semibold leading-5 tracking-[-0.04em] text-black dark:text-neutral-90">
                {customerSummaryLabel}
              </p>
              {customerInfoButtonCompact}
            </div>
          </div>

          {showMessagesToggle ? (
            <button
              type="button"
              onClick={onToggleMessages}
              aria-label="전달사항"
              aria-pressed={messagesOpen}
              className="cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
            >
              <AnnotationToggleIcon active={messagesOpen} />
            </button>
          ) : null}
        </div>
      </div>

      {/* PC(lg 이상): 뒤로 | 제목 | 메타  ……  액션 세트(영업점) 또는 담당직원(변호사) */}
      <div className="hidden lg:flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={handleGoToList}
            aria-label="목록으로"
            className="cursor-pointer w-6 h-6 flex items-center justify-center text-black dark:text-foreground hover:opacity-70 shrink-0"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="text-[24px] font-bold leading-5 text-neutral-90 shrink-0">
            {RECOMMENDED_PROCEDURE_LABEL[detail.trackingProcedure]}
          </h1>
          {statusBadge}
          <span className="w-px h-4 bg-neutral-60 shrink-0" aria-hidden />
          <span className="text-[18px] font-medium leading-5 text-neutral-60 truncate min-w-0">
            {customerSummaryLabel}
          </span>
          {customerInfoButton}
        </div>

        {showOwnerActions ? (
          <div className="flex items-center justify-end gap-4 shrink-0">
            {isMatched ? (
              <div className="relative" ref={desktopLinkedMenuRef}>
                <button
                  type="button"
                  onClick={() => setLinkedMenuOpen((prev) => !prev)}
                  className={LINKED_CHIP_BTN}
                  aria-label={`연결된 고객 ${linkedLabel}`}
                  aria-expanded={linkedMenuOpen}
                >
                  <LinkedCustomerIcon className="text-secondary-60 dark:text-blue-300 shrink-0" />
                  <span className="text-[14px] font-medium leading-5 truncate max-w-[200px]">
                    {linkedLabel}
                  </span>
                </button>
                <LinkedCustomerMenu
                  open={linkedMenuOpen}
                  onOpenCustomerInfo={handleOpenCustomerDetail}
                  onUnlink={handleUnlink}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenMatchModal}
                aria-label="고객 연결"
                className="cursor-pointer w-[34px] h-[34px] flex items-center justify-center rounded-[5px] border border-neutral-30 text-black dark:text-foreground hover:bg-neutral-10"
              >
                <LinkedCustomerIcon />
              </button>
            )}

            <button type="button" className={ACTION_BTN} onClick={handleEdit}>
              <EditIcon />
              <span className="leading-none">정보수정</span>
            </button>
            <div className="relative">
              <button type="button" className={ACTION_BTN} onClick={handleOpenPaymentInfo}>
                <PaymentCardIcon />
                <span className="leading-none">결제정보</span>
              </button>
              {showPaymentNudge && <PaymentInfoNudgeBubble onDismiss={handleDismissPaymentNudge} />}
            </div>
            <button
              type="button"
              className={detail.isShared ? ACTION_BTN_SHARED : ACTION_BTN}
              onClick={handleShareClick}
              disabled={detail.isShared}
              aria-label={shareLabel}
              title={detail.isShared ? shareLabel : undefined}
            >
              <ShareNodesIcon />
              <span className="min-w-0 truncate leading-none">{shareLabel}</span>
            </button>
          </div>
        ) : showAssigneeProfile ? (
          <div className="flex items-center justify-end gap-4 shrink-0">
            <div className="relative">
              <button type="button" className={ACTION_BTN} onClick={handleOpenPaymentInfo}>
                <PaymentCardIcon />
                <span className="leading-none">결제정보</span>
              </button>
              {showPaymentNudge && <PaymentInfoNudgeBubble onDismiss={handleDismissPaymentNudge} />}
            </div>
            {assigneeProfile}
          </div>
        ) : null}
      </div>

      {projectId && showOwnerActions && (
        <>
          <CustomerLinkModeModal
            open={linkStep === "mode"}
            onClose={handleCloseLinkFlow}
            onSelect={(mode) => setLinkStep(mode)}
            existingDescription="이미 등록된 고객 정보를 연동합니다."
          />
          <CustomerMatchModal
            open={linkStep === "existing"}
            onClose={handleCloseLinkFlow}
            onBack={() => setLinkStep("mode")}
            analysisId={detail.id}
            projectId={projectId}
            analysisCustomerName={detail.customerName}
            onMatched={onCustomerMatchChange}
          />
          <CustomerCreateMatchModal
            open={linkStep === "create"}
            onClose={handleCloseLinkFlow}
            onBack={() => setLinkStep("mode")}
            customerName={detail.customerName}
            analysisId={detail.id}
            projectId={projectId}
            onMatched={onCustomerMatchChange}
          />
        </>
      )}
      <DiagnosisCustomerInfoModal
        open={customerInfoOpen}
        onClose={() => setCustomerInfoOpen(false)}
        inputData={detail.inputData}
        contact={detail.contact}
      />
      {projectId && (showOwnerActions || showAssigneeProfile) && (
        <FeePaymentInfoModal
          open={paymentInfoOpen}
          onClose={() => setPaymentInfoOpen(false)}
          analysisId={Number(detail.id)}
          projectId={projectId}
          isContractPending={detail.status === "contract_pending"}
          feePlan={detail.feePlan}
          procedureScores={detail.procedureScores}
          procedureProgress={{
            current: detail.procedureGuide.currentStep,
            total: detail.procedureGuide.totalSteps,
          }}
          onChanged={onCustomerMatchChange}
        />
      )}
      {projectId && showOwnerActions && (
        <AnalysisShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          projectId={projectId}
          analysisIds={[detail.id]}
          customerName={detail.customerName}
          initialContact={detail.customerId != null ? detail.phone : ""}
          lockedPartner={
            detail.partnerId != null && detail.lawyerProjectId != null
              ? {
                  id: detail.partnerId,
                  projectName: detail.lawyerProjectName?.trim() || "프로젝트",
                }
              : null
          }
        />
      )}
    </>
  );
}
