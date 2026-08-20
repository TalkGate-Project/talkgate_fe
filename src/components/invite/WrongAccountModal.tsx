"use client";

import BaseModal from "@/components/common/BaseModal";

type WrongAccountModalProps = {
  loggedInEmail: string | null;
  inviteEmail: string | null;
  socialProvider?: "naver" | "kakao" | "google" | null;
  onCancel: () => void;
  onLogout: () => void;
};

export function WrongAccountModal({
  loggedInEmail,
  inviteEmail,
  socialProvider,
  onCancel,
  onLogout,
}: WrongAccountModalProps) {
  // 소셜 로그인 플랫폼 이름 변환
  const getProviderName = (provider: string | null | undefined): string => {
    switch (provider) {
      case "naver":
        return "네이버";
      case "kakao":
        return "카카오";
      case "google":
        return "구글";
      default:
        return "소셜 로그인";
    }
  };

  const providerName = getProviderName(socialProvider);
  return (
    <BaseModal
      onClose={onCancel}
      zIndexClassName="z-[150]"
      overlayClassName="bg-black/35 dark:bg-[#000000CC]"
      ariaLabel="현재 다른 계정으로 로그인되어 있어 진행할 수 없어요."
      disableAutoContainerSizing
      containerClassName="relative w-[500px] rounded-[14px] bg-white dark:bg-neutral-10"
    >
        <div className="px-8 pt-7 pb-6">
          {/* 경고 아이콘 */}
          <div className="mt-6 flex justify-center">
            <div className="flex items-center justify-center rounded-full">
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.9986 15V18.3333M19.9986 25H20.0153M8.45159 31.6667H31.5456C34.1116 31.6667 35.7153 28.8889 34.4323 26.6667L22.8853 6.66667C21.6023 4.44444 18.3948 4.44444 17.1118 6.66667L5.56484 26.6667C4.28184 28.8889 5.88559 31.6667 8.45159 31.6667Z"
                  stroke="#D83232"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          
          {/* 제목 */}
          <p className="mt-6 text-center text-[18px] font-semibold leading-[21px] text-danger-40">
            현재 다른 계정으로 로그인되어 있어 진행할 수 없어요.
          </p>
          
          {/* 설명 */}
          <div className="mt-4 space-y-2">
            <p className="text-center text-[14px] font-medium leading-[17px] text-neutral-90 dark:text-neutral-80">
              현재 <span className="font-semibold">{loggedInEmail}</span>로 로그인되어 있습니다.
            </p>
            <p className="text-center text-[14px] font-medium leading-[17px] text-neutral-90 dark:text-neutral-80">
              {socialProvider ? (
                <>
                  {providerName}에서 초대받은 이메일 <span className="font-semibold">{inviteEmail}</span> 계정으로 로그인한 후, 소셜 로그인을 다시 시도해주세요.
                </>
              ) : (
                <>
                  초대받은 이메일 <span className="font-semibold">{inviteEmail}</span>로 로그인해주세요.
                </>
              )}
            </p>
          </div>
        </div>
        
        {/* 구분선 */}
        <div className="h-px w-full bg-neutral-30 dark:bg-neutral-30" />
        
        {/* 버튼 영역 */}
        <div className="flex justify-end gap-3 px-8 py-4">
          <button
            type="button"
            className="cursor-pointer flex h-[34px] min-w-[72px] items-center justify-center rounded-[5px] border border-neutral-30 dark:border-neutral-30 px-3 text-[14px] font-semibold tracking-[-0.02em] text-neutral-90 dark:text-neutral-80"
            onClick={onCancel}
          >
            취소
          </button>
          <button
            type="button"
            className="cursor-pointer flex h-[34px] min-w-[72px] items-center justify-center rounded-[5px] bg-danger-40 px-3 text-[14px] font-semibold tracking-[-0.02em] text-white"
            onClick={onLogout}
          >
            로그아웃
          </button>
        </div>
    </BaseModal>
  );
}

