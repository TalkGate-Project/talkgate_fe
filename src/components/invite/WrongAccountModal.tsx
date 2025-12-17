"use client";

type WrongAccountModalProps = {
  loggedInEmail: string | null;
  inviteEmail: string | null;
  onCancel: () => void;
  onLogout: () => void;
};

export function WrongAccountModal({
  loggedInEmail,
  inviteEmail,
  onCancel,
  onLogout,
}: WrongAccountModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#1C1C1C] rounded-[12px] p-8 max-w-[400px] w-full mx-4 shadow-2xl border border-[#333]">
        <div className="text-center">
          {/* 경고 아이콘 */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FF5A5A]/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#FF5A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h2 className="text-[18px] font-semibold text-white mb-3">
            다른 계정으로 로그인되어 있어요
          </h2>
          <p className="text-[14px] text-[#B9B9B9] mb-2">
            현재 <span className="text-white font-medium">{loggedInEmail}</span>로 로그인되어 있습니다.
          </p>
          <p className="text-[14px] text-[#B9B9B9] mb-6">
            초대받은 이메일 <span className="text-white font-medium">{inviteEmail}</span>로 로그인해주세요.
          </p>
          
          <div className="flex gap-3">
            <button
              className="cursor-pointer flex-1 h-[40px] rounded-[6px] border border-[#555] text-[#D0D0D0] text-[14px] font-medium hover:bg-[#2a2a2a] transition-colors"
              onClick={onCancel}
            >
              취소
            </button>
            <button
              className="cursor-pointer flex-1 h-[40px] rounded-[6px] bg-[#FF5A5A] text-white text-[14px] font-semibold hover:bg-[#e54a4a] transition-colors"
              onClick={onLogout}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

