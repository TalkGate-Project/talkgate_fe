"use client";

import { useState } from "react";
import type { DiagnosisDetail } from "@/types/debtRelief";
import { formatContactForDisplay } from "@/utils/format";
import {
  DebtReliefSmsModal,
  buildRequiredDocsTemplate,
  buildConsultScheduleTemplate,
  buildAnalysisShareTemplate,
  buildBlankTemplate,
  type SmsTemplate,
} from "./sms";

function ClipboardCheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M8.03041 11.1363C7.73752 10.8434 7.26264 10.8434 6.96975 11.1363C6.67686 11.4292 6.67686 11.9041 6.96975 12.197L7.50008 11.6667L8.03041 11.1363ZM9.16675 13.3333L8.63642 13.8637C8.92931 14.1566 9.40419 14.1566 9.69708 13.8637L9.16675 13.3333ZM13.0304 10.5303C13.3233 10.2374 13.3233 9.76256 13.0304 9.46967C12.7375 9.17678 12.2626 9.17678 11.9698 9.46967L12.5001 10L13.0304 10.5303ZM15.8334 5.83333H15.0834V15.8333H15.8334H16.5834V5.83333H15.8334ZM14.1667 17.5V16.75H5.83341V17.5V18.25H14.1667V17.5ZM4.16675 15.8333H4.91675V5.83333H4.16675H3.41675V15.8333H4.16675ZM5.83341 4.16667V4.91667H7.50008V4.16667V3.41667H5.83341V4.16667ZM12.5001 4.16667V4.91667H14.1667V4.16667V3.41667H12.5001V4.16667ZM5.83341 17.5V16.75C5.32715 16.75 4.91675 16.3396 4.91675 15.8333H4.16675H3.41675C3.41675 17.168 4.49873 18.25 5.83341 18.25V17.5ZM15.8334 15.8333H15.0834C15.0834 16.3396 14.673 16.75 14.1667 16.75V17.5V18.25C15.5014 18.25 16.5834 17.168 16.5834 15.8333H15.8334ZM15.8334 5.83333H16.5834C16.5834 4.49865 15.5014 3.41667 14.1667 3.41667V4.16667V4.91667C14.673 4.91667 15.0834 5.32707 15.0834 5.83333H15.8334ZM4.16675 5.83333H4.91675C4.91675 5.32707 5.32715 4.91667 5.83341 4.91667V4.16667V3.41667C4.49873 3.41667 3.41675 4.49865 3.41675 5.83333H4.16675ZM7.50008 11.6667L6.96975 12.197L8.63642 13.8637L9.16675 13.3333L9.69708 12.803L8.03041 11.1363L7.50008 11.6667ZM9.16675 13.3333L9.69708 13.8637L13.0304 10.5303L12.5001 10L11.9698 9.46967L8.63642 12.803L9.16675 13.3333ZM9.16675 2.5V3.25H10.8334V2.5V1.75H9.16675V2.5ZM10.8334 5.83333V5.08333H9.16675V5.83333V6.58333H10.8334V5.83333ZM9.16675 5.83333V5.08333C8.66049 5.08333 8.25008 4.67293 8.25008 4.16667H7.50008H6.75008C6.75008 5.50135 7.83206 6.58333 9.16675 6.58333V5.83333ZM12.5001 4.16667H11.7501C11.7501 4.67293 11.3397 5.08333 10.8334 5.08333V5.83333V6.58333C12.1681 6.58333 13.2501 5.50135 13.2501 4.16667H12.5001ZM10.8334 2.5V3.25C11.3397 3.25 11.7501 3.66041 11.7501 4.16667H12.5001H13.2501C13.2501 2.83198 12.1681 1.75 10.8334 1.75V2.5ZM9.16675 2.5V1.75C7.83206 1.75 6.75008 2.83198 6.75008 4.16667H7.50008H8.25008C8.25008 3.66041 8.66049 3.25 9.16675 3.25V2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClipboardCopyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M6.66659 4.16667H4.99992C4.07944 4.16667 3.33325 4.91286 3.33325 5.83333V15.8333C3.33325 16.7538 4.07944 17.5 4.99992 17.5H13.3333C14.2537 17.5 14.9999 16.7538 14.9999 15.8333V15M6.66659 4.16667C6.66659 5.08714 7.41278 5.83333 8.33325 5.83333H9.99992C10.9204 5.83333 11.6666 5.08714 11.6666 4.16667M6.66659 4.16667C6.66659 3.24619 7.41278 2.5 8.33325 2.5H9.99992C10.9204 2.5 11.6666 3.24619 11.6666 4.16667M11.6666 4.16667H13.3333C14.2537 4.16667 14.9999 4.91286 14.9999 5.83333V8.33333M16.6666 11.6667H8.33325M10.8333 14.1667L8.33325 11.6667L10.8333 9.16667"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M16.8898 3.11019L17.4201 2.57986V2.57986L16.8898 3.11019ZM5.41667 17.5296V18.2796C5.61558 18.2796 5.80634 18.2005 5.947 18.0599L5.41667 17.5296ZM2.5 17.5296H1.75C1.75 17.9438 2.08579 18.2796 2.5 18.2796V17.5296ZM2.5 14.5537L1.96967 14.0233C1.82902 14.164 1.75 14.3548 1.75 14.5537H2.5ZM13.9435 3.11019L14.4738 3.64052C14.9945 3.11983 15.8387 3.11983 16.3594 3.64052L16.8898 3.11019L17.4201 2.57986C16.3136 1.47338 14.5196 1.47338 13.4132 2.57986L13.9435 3.11019ZM16.8898 3.11019L16.3594 3.64052C16.8801 4.16122 16.8801 5.00544 16.3594 5.52614L16.8898 6.05647L17.4201 6.5868C18.5266 5.48032 18.5266 3.68635 17.4201 2.57986L16.8898 3.11019ZM16.8898 6.05647L16.3594 5.52614L4.88634 16.9992L5.41667 17.5296L5.947 18.0599L17.4201 6.5868L16.8898 6.05647ZM5.41667 17.5296V16.7796H2.5V17.5296V18.2796H5.41667V17.5296ZM13.9435 3.11019L13.4132 2.57986L1.96967 14.0233L2.5 14.5537L3.03033 15.084L14.4738 3.64052L13.9435 3.11019ZM2.5 14.5537H1.75V17.5296H2.5H3.25V14.5537H2.5ZM12.6935 4.36019L12.1632 4.89052L15.1094 7.8368L15.6398 7.30647L16.1701 6.77614L13.2238 3.82986L12.6935 4.36019Z"
        fill="currentColor"
      />
    </svg>
  );
}

const ACTION_BUILDERS: {
  label: string;
  icon: () => React.ReactElement;
  build: (detail: DiagnosisDetail) => SmsTemplate;
}[] = [
  { label: "필요 서류 안내", icon: ClipboardCheckIcon, build: buildRequiredDocsTemplate },
  { label: "상담 일정 안내", icon: CalendarIcon, build: buildConsultScheduleTemplate },
  { label: "분석결과 공유", icon: ClipboardCopyIcon, build: buildAnalysisShareTemplate },
  { label: "직접작성", icon: PencilIcon, build: buildBlankTemplate },
];

export default function SectionSmsSend({ detail }: { detail: DiagnosisDetail }) {
  const [smsTemplate, setSmsTemplate] = useState<SmsTemplate | null>(null);
  // 서버는 공유 시 전달받은 연락처를 우선 쓰고, 없으면 매칭된 고객 연락처를 쓴다(getDiagnosisDetail
  // 참고). detail.phone이 이미 그 결과를 반영하므로 phone 유무로만 판단하면 된다.
  const canSendSms = Boolean(detail.phone);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {ACTION_BUILDERS.map(({ label, icon: Icon, build }) => (
        <button
          key={label}
          type="button"
          disabled={!canSendSms}
          onClick={() => setSmsTemplate(build(detail))}
          className={`inline-flex items-center justify-center gap-1 h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] ${
            canSendSms ? "cursor-pointer hover:opacity-90" : "opacity-40 cursor-not-allowed"
          }`}
        >
          <Icon />
          {label}
        </button>
      ))}
      <span className="text-[14px] text-neutral-60">
        {canSendSms
          ? `${detail.customerName} ${formatContactForDisplay(detail.phone)}`
          : "연락처 정보가 없어 문자 발송이 불가능합니다"}
      </span>

      {smsTemplate && (
        <DebtReliefSmsModal
          open={Boolean(smsTemplate)}
          onClose={() => setSmsTemplate(null)}
          diagnosisId={detail.id}
          recipientName={detail.customerName}
          recipientPhone={detail.phone}
          {...smsTemplate}
        />
      )}
    </div>
  );
}
