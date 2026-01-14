"use client";

import BaseModal from "@/components/common/BaseModal";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function PrivacyConsignmentModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      containerClassName="w-full max-w-4xl bg-background rounded-[14px] max-h-[90vh] overflow-y-auto"
      ariaLabel="개인정보 처리위탁에 대한 동의"
    >
      <div className="relative px-4 py-12 md:px-8 md:py-20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-20 transition-colors"
          aria-label="닫기"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <h1 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-foreground">
          개인정보 처리위탁에 대한 동의
        </h1>
        <br />
        <div className="space-y-6 md:space-y-8">
          <p className="text-base md:text-lg leading-relaxed text-neutral-70 pl-0 md:pl-4">
            본인은 Talkgate 서비스 이용과 관련하여 다음과 같이 개인정보 처리위탁에 동의합니다.
          </p>
          <br />
          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-foreground">
              개인정보처리자
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-neutral-70 pl-0 md:pl-4">
              회원(영업회사)
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-foreground">
              개인정보처리수탁자
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-neutral-70 pl-0 md:pl-4">
              주식회사 핑크코브라
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-foreground">
              위탁 업무 내용
            </h2>
            <ul className="space-y-2 md:space-y-3 text-base md:text-lg leading-relaxed text-neutral-70 pl-4 md:pl-6">
              <li className="pl-2">고객정보 저장 및 관리</li>
              <li className="pl-2">CRM 시스템 운영 및 유지보수</li>
              <li className="pl-2">보안 관리 및 장애 대응</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-foreground">
              위탁 기간
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-neutral-70 pl-0 md:pl-4">
              서비스 이용 계약 종료 시까지
            </p>
          </section>

          <section>
            <p className="text-base md:text-lg leading-relaxed text-neutral-70 pl-0 md:pl-4">
              회사는 위탁받은 개인정보를 위탁 목적 범위 내에서만 처리하며, 목적 외 이용 또는 제3자 제공을 하지 않습니다.
            </p>
          </section>
        </div>
      </div>
    </BaseModal>
  );
}
