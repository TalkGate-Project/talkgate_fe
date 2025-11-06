"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: "existing" | "create") => void;
};

export default function CustomerLinkModeModal({
  open,
  onClose,
  onSelect,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[440px] -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-full rounded-[16px] bg-neutral-0 shadow-[0px_28px_80px_rgba(38,38,38,0.18)] px-7 py-6">
          <button
            aria-label="close"
            onClick={onClose}
            className="absolute right-6 top-6 h-8 w-8 rounded-full"
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
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-neutral-50"
              />
            </svg>
          </button>
          <h2 className="text-[18px] font-semibold text-neutral-60">
            고객 연동 방식 선택
          </h2>
          <p className="mt-[30px] text-[14px] text-neutral-70 text-center">
            고객 정보 연동 방식을 선택해주세요.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => onSelect("create")}
              className="group h-[156px] max-w-[186px] rounded-[14px] border border-neutral-30 bg-primary-10 p-[18px] text-left transition-all hover:-translate-y-1 hover:border-primary-60 hover:shadow-[0_12px_32px_rgba(0,201,126,0.18)]"
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g filter="url(#filter0_d_194_796)">
                  <rect
                    x="4"
                    y="1"
                    width="40"
                    height="40"
                    rx="5"
                    fill="var(--neutral-0)"
                  />
                </g>
                <path
                  d="M33 21C33 21 29.3431 21 27 21M30 24V17.5M25 16C25 18.2091 23.2091 20 21 20C18.7909 20 17 18.2091 17 16C17 13.7909 18.7909 12 21 12C23.2091 12 25 13.7909 25 16ZM15 29C15 25.6863 17.6863 23 21 23C24.3137 23 27 25.6863 27 29V30H15V29Z"
                  stroke="var(--primary-80)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <filter
                    id="filter0_d_194_796"
                    x="0"
                    y="0"
                    width="48"
                    height="48"
                    filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB"
                  >
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="3" />
                    <feGaussianBlur stdDeviation="2" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0.0352941 0 0 0 0 0.117647 0 0 0 0 0.258824 0 0 0 0.1 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_194_796"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_dropShadow_194_796"
                      result="shape"
                    />
                  </filter>
                </defs>
              </svg>

              <div className="mt-3 text-[16px] font-semibold text-primary-80">
                새 고객 정보 추가
              </div>
              <div className="mt-1 text-[14px] text-neutral-60">
                새로운 고객 정보를 입력하여 등록합니다.
              </div>
            </button>

            <button
              onClick={() => onSelect("existing")}
              className="group h-[156px] max-w-[186px] rounded-[14px] border border-neutral-30 bg-secondary-10 p-[18px] text-left transition-all hover:-translate-y-1 hover:border-secondary-40 hover:shadow-[0_12px_32px_rgba(77,130,243,0.18)]"
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g filter="url(#filter0_d_194_803)">
                  <rect
                    x="4"
                    y="1"
                    width="40"
                    height="40"
                    rx="5"
                    fill="var(--neutral-0)"
                  />
                </g>
                <path
                  d="M25.8284 19.1716C24.2663 17.6095 21.7337 17.6095 20.1716 19.1716L16.1716 23.1716C14.6095 24.7337 14.6095 27.2663 16.1716 28.8284C17.7337 30.3905 20.2663 30.3905 21.8284 28.8284L22.93 27.7269M22.1716 22.8284C23.7337 24.3905 26.2663 24.3905 27.8284 22.8284L31.8284 18.8284C33.3905 17.2663 33.3905 14.7337 31.8284 13.1716C30.2663 11.6095 27.7337 11.6095 26.1716 13.1716L25.072 14.2712"
                  stroke="var(--secondary-60)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <filter
                    id="filter0_d_194_803"
                    x="0"
                    y="0"
                    width="48"
                    height="48"
                    filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB"
                  >
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="3" />
                    <feGaussianBlur stdDeviation="2" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0.0352941 0 0 0 0 0.117647 0 0 0 0 0.258824 0 0 0 0.1 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_194_803"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_dropShadow_194_803"
                      result="shape"
                    />
                  </filter>
                </defs>
              </svg>

              <div className="mt-3 text-[16px] font-semibold text-secondary-60">
                기존 고객과 연동
              </div>
              <div className="mt-1 text-[14px] text-neutral-60">
                이미 등록된 고객과 채팅을 연결합니다.
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
