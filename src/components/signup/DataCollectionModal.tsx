"use client";

import BaseModal from "@/components/common/BaseModal";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function DataCollectionModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      containerClassName="w-full max-w-4xl bg-background rounded-[14px] max-h-[90vh] overflow-y-auto"
      ariaLabel="고객정보 적법 수집 및 제3자 제공 책임 확인"
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
          고객정보 적법 수집 및 제3자 제공 책임 확인
        </h1>
        <br />
        <div className="space-y-6 md:space-y-8">
          <p className="text-base md:text-lg leading-relaxed text-neutral-70 pl-0 md:pl-4">
            본인은 Talkgate에 입력&middot;연동&middot;관리하는 모든 고객정보에 대하여 다음 사항을 확인하고 이에 동의합니다.
          </p>

          <ul className="space-y-4 md:space-y-6 text-base md:text-lg leading-relaxed text-neutral-70 pl-4 md:pl-6">
            <li className="pl-2">
              해당 개인정보는 개인정보보호법 및 관계 법령에 따라 적법하게 수집되었습니다.
            </li>
            <li className="pl-2">
              광고사 또는 제3자로부터 제공받은 개인정보의 경우, 정보주체로부터 적법한 제3자 제공 동의를 사전에 확보하였습니다.
            </li>
            <li className="pl-2">
              회사는 해당 개인정보의 수집 경위, 동의 여부, 적법성에 대해 검증할 책임이 없음을 이해합니다.
            </li>
            <li className="pl-2">
              본 확인 내용이 사실과 다를 경우 발생하는 모든 민&middot;형사&middot;행정상 책임은 본인에게 귀속됨을 확인합니다.
            </li>
          </ul>
        </div>
      </div>
    </BaseModal>
  );
}
