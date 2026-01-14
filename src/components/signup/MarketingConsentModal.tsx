"use client";

import BaseModal from "@/components/common/BaseModal";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MarketingConsentModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      containerClassName="w-full max-w-4xl bg-background rounded-[14px] max-h-[90vh] overflow-y-auto"
      ariaLabel="Talkgate 마케팅 정보 수신 동의"
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
          Talkgate 마케팅 정보 수신 동의
        </h1>
        <br />
        <div className="space-y-6 md:space-y-8">
          <p className="text-base md:text-lg leading-relaxed text-neutral-70 pl-0 md:pl-4">
            본인은 주식회사 핑크코브라가 Talkgate 서비스와 관련하여 다음과 같은 정보를 제공하는 것에 동의합니다.
          </p>
          <br />

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-foreground">
              수신 내용
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-neutral-70 pl-0 md:pl-4">
              서비스 안내, 기능 업데이트, 이벤트 및 프로모션 정보
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-foreground">
              수신 방법
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-neutral-70 pl-0 md:pl-4">
              이메일, 문자메시지, 알림톡 등
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-foreground">
              동의 철회
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-neutral-70 pl-0 md:pl-4">
              언제든지 수신 거부 가능
            </p>
          </section>

          <section className="pt-4 md:pt-6 border-t border-border">
            <p className="text-base md:text-lg leading-relaxed text-neutral-70 pl-0 md:pl-4">
              본 동의는 선택 사항이며, 동의하지 않더라도 Talkgate 서비스 이용에는 제한이 없습니다.
            </p>
          </section>
        </div>
      </div>
    </BaseModal>
  );
}
