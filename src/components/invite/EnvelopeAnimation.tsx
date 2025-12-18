"use client";

import { motion, easeInOut } from "framer-motion";
import Image from "next/image";

type EnvelopeAnimationProps = {
  isOpen: boolean;
  inviteInfo: {
    projectName?: string;
  } | null;
  onAccept: () => void;
  onDecline: () => void;
};

/**
 * 봉투 이미지 매핑:
 * - envelope-base.png: 봉투 바닥 배경 (회색 노이즈 텍스처)
 * - envelope-cover.png: 뚜껑 앞면 (역삼각형, Talkgate 로고)
 * - envelope-inner.png: 카드 배경 (검정색)
 * - envelope-outer.png: 봉투 앞면 V자 (흰 배경에 V자 모양)
 */

// 3D 봉투 애니메이션 컴포넌트
export function EnvelopeAnimation({
  isOpen,
  inviteInfo,
  onAccept,
  onDecline,
}: EnvelopeAnimationProps) {
  /**
   * 레이어 순서 (z-index):
   * 1. 봉투 바닥 (base): 10
   * 2. 열린 뚜껑: 11 (뒤로 접힌 상태)
   * 3. 카드: 20
   * 4. 봉투 앞면 (outer): 30 - 카드보다 앞, V자 움푹 파인 부분은 투명
   * 5. 닫힌 뚜껑: 40
   */

  return (
    <div className="relative" style={{ perspective: "1200px" }}>
      {/* 봉투 컨테이너 - 이미 열린 상태 (아래로 이동된 상태) */}
      <motion.div
        className="relative w-[622px] h-[370px] mx-auto mt-[120px]"
        style={{ clipPath: "inset(-500px -50px 0px -50px)" }}
        initial={{ y: 80 }}
        animate={{ y: 80 }}
      >
        {/* 1. 봉투 바닥 (Back) - envelope-base.png */}
        <div
          className="absolute bottom-0 left-0 w-full h-full rounded-[12px] shadow-2xl overflow-hidden"
          style={{ zIndex: 10 }}
        >
          <Image
            src="/envelope-base.png"
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
            width={672}
            height={370}
          />
        </div>

        {/* 2. 뚜껑 - 이미 열린 상태 (180도 회전된 상태) */}
        <div
          className="absolute top-0 left-0 w-full"
          style={{
            transformOrigin: "top center",
            height: "200px",
            clipPath: "polygon(0 0, 100% 0, 50% 100%)", // 역삼각형
            transform: "rotateX(180deg)", // 이미 열린 상태
            zIndex: 11, // 바닥 위
          }}
        >
          <Image
            src="/envelope-cover.png"
            alt=""
            className="w-full h-full object-fill"
            draggable={false}
            width={672}
            height={252}
          />
        </div>

        {/* 3. 카드 (초대장) - 페이지 로드 시 자동으로 올라오는 애니메이션 */}
        <motion.div
          className="absolute left-0 right-0 mx-auto w-[572px]"
          style={{
            bottom: "10px",
            zIndex: 20, // outer(30)보다 뒤
          }}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: -180, opacity: 1 }}
          transition={{
            y: { delay: 0.3, duration: 0.8, ease: easeInOut },
            opacity: { delay: 0.3, duration: 0.3 },
          }}
        >
          <div
            className="w-full h-[418px] px-10 py-9 flex flex-col items-center text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(270deg, #000000 0%, #252525 100%)",
              boxShadow:
                "0px 3px 4px rgba(9, 30, 66, 0.1), 0 10px 40px rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* 카드 내용 */}
            <div className="relative z-10 flex flex-col items-center w-full h-full">
              {/* 로고와 문구 영역 */}
              <div className="flex-1 flex flex-col items-center justify-center">
                {/* SVG 로고 */}
                <svg
                  width="306"
                  height="52"
                  viewBox="0 0 306 72"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M183.407 12.8239V54.4197C183.407 62.4515 175.186 72.9999 166.811 72.9999H152.518V63.3L153.01 62.8757C153.145 62.8661 153.26 63.1361 153.337 63.1361H172.728L173.22 62.6443V23.1794L172.728 22.6877H148.904V45.3754H169.442L169.934 45.8672V55.0753L169.442 55.5671H157.607C136.548 55.5671 130.968 22.5913 150.552 14.3087C151.506 13.9038 154.455 12.8142 155.303 12.8142H183.407V12.8239Z"
                    fill="white"
                  />
                  <path
                    d="M76.2542 28.2801C76.3313 26.6698 76.3795 24.8571 75.1169 23.6712C74.9435 23.5072 73.5653 22.6973 73.4689 22.6973H50.2997V12.8335H73.4689C79.5118 12.8335 86.451 21.2896 86.451 27.1327V55.085C86.451 55.9142 84.5138 55.2489 84.003 55.2296C75.0302 54.9886 64.4094 56.107 55.7257 55.2393C44.9507 54.169 40.5559 39.2817 48.1504 31.8766C49.5575 30.5074 53.4801 28.2704 55.398 28.2704H76.2735L76.2542 28.2801ZM76.2542 38.1439H55.3788C52.1308 38.1439 52.632 45.3272 55.4366 45.3272C57.2581 45.3272 59.07 45.3658 60.6314 45.3658C63.8118 45.3658 67.0212 45.3658 70.192 45.3658C72.1389 45.3658 74.5001 45.2212 76.2542 45.2212V38.1535V38.1439Z"
                    fill="white"
                  />
                  <path
                    d="M215.453 12.8239C220.995 13.5759 228.107 20.4314 228.107 26.1395V55.0753C227.866 55.4128 227.818 55.4321 227.433 55.4321C217.429 55.461 207.386 55.0078 197.373 55.2393C184.949 53.1855 182.058 34.7113 193.701 29.5335C194.587 29.1382 196.852 28.2704 197.7 28.2704H218.238C218.556 26.6795 217.313 22.678 215.443 22.678H192.274V12.8142H215.443L215.453 12.8239ZM218.238 38.1439H197.363C196.071 38.1439 195.715 43.8423 196.948 44.9608C197.055 45.0572 198.577 45.7033 198.674 45.7033H217.737L218.229 45.2115V38.1439H218.238Z"
                    fill="white"
                  />
                  <path
                    d="M306 39.1274H273.954L273.463 38.6356V29.2636H295.485V22.6877H270.668C270.196 22.9769 270.215 23.3433 270.157 23.8254C269.598 28.5886 270.273 35.4055 270.514 40.2651C270.6 41.9621 270.427 43.6881 270.494 45.3754L301.065 45.8672V55.0753C300.612 55.8081 300.015 55.191 299.273 55.2296C283.987 56.0106 263.401 58.3922 260.057 38.2307C256.712 18.0691 275.246 7.91605 292.362 13.8073C298.637 15.9672 305.99 24.2401 305.99 31.0859V39.1467L306 39.1274Z"
                    fill="white"
                  />
                  <path
                    d="M114.71 0V27.6245L115.702 27.1327L129.995 12.8239H143.96L123.239 34.0364L143.796 54.9115L143.459 55.5768L129.831 55.0754L115.702 40.9402L114.71 40.4484V55.2393H104.522V0.491745L105.014 0H114.71Z"
                    fill="white"
                  />
                  <path
                    d="M50.2899 0V9.69991L49.7984 10.1917H30.571V55.0754L30.0217 55.519L20.8562 55.49L20.3743 55.0754V10.1917H0.491527L0 9.69991V0.491745L0.491527 0H50.2899Z"
                    fill="white"
                  />
                  <path
                    d="M241.909 3.61572V12.8239H258.669V22.6877H241.909V45.3755H258.177L258.669 45.8672V55.0754C257.667 56.1649 256.134 55.2682 254.901 55.2296C249.079 55.0464 245.658 55.6539 240.492 52.2213C236.444 49.5312 231.722 42.965 231.722 37.98V3.61572H241.909Z"
                    fill="white"
                  />
                  <path
                    d="M100.58 0V55.0754L100.088 55.4997C99.9533 55.5093 99.8376 55.2393 99.7605 55.2393H90.3926V0H100.58Z"
                    fill="white"
                  />
                </svg>

                <div className="text-center mt-10">
                  <div className="text-[18px] mb-3 text-[#FDFDFD]">
                    <span className="font-semibold">
                      "{inviteInfo?.projectName || "프로젝트"}"
                    </span>{" "}
                    프로젝트에 초대되었습니다.
                  </div>
                  <div className="text-[14px] text-[#B9B9B9] mb-2">
                    {new Date().toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-[14px] text-[#B9B9B9]">
                    본 초대는 7일 후 자동 만료됩니다.
                  </div>
                </div>
              </div>

              {/* 버튼 영역 */}
              <div className="flex flex-col items-center gap-3 w-full max-w-[280px] pb-16">
                <button
                  className="cursor-pointer w-[122px] h-[34px] rounded-[6px] text-[#D0D0D0] text-[14px] font-semibold transition-colors border border-[#E2E2E2]"
                  onClick={onAccept}
                >
                  프로젝트 가입하기
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4. 봉투 앞면 (V자 포켓) - envelope-outer.png 
            V자 위쪽 움푹 파인 부분은 투명 (흰색)
            카드보다 앞에 있어서 카드의 하단을 감싸듯이 보임 */}
        <div
          className="absolute bottom-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-b-[12px]"
          style={{ zIndex: 30 }}
        >
          <Image
            src="/envelope-outer.png"
            alt=""
            className="w-full h-full object-fill"
            draggable={false}
            width={674}
            height={370}
          />
        </div>
      </motion.div>
    </div>
  );
}

