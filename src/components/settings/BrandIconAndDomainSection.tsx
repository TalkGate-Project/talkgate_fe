"use client";

type Props = {
  subdomain: string;
  setSubdomain: (subdomain: string) => void;
  originalSubdomain: string;
  brandIcon: string | null;
  isSaving: boolean;
  onUpdateSubdomain: () => void;
  onBrandIconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveBrandIcon: () => void;
};

/**
 * 브랜드 아이콘 및 도메인 설정 섹션 컴포넌트
 */
export default function BrandIconAndDomainSection({
  subdomain,
  setSubdomain,
  originalSubdomain,
  brandIcon,
  isSaving,
  onUpdateSubdomain,
  onBrandIconUpload,
  onRemoveBrandIcon,
}: Props) {
  return (
    <div className="md:bg-card md:rounded-[14px] md:shadow-sm px-6 md:px-7 md:py-[30px]">
      <h3 className="text-[16px] font-semibold text-foreground mb-2 tracking-[0.2px] leading-[1]">브랜드 아이콘 및 도메인</h3>
      <p className="hidden md:block text-[14px] text-neutral-60 font-medium mb-3 tracking-[0.2px]">브랜드 아이콘과 도메인을 설정합니다.</p>
      
      <div className="border-t border-neutral-30 mb-3"></div>

      {/* 서브 도메인 */}
      <div className="mb-3">
        <label className="text-[14px] text-ink font-medium mb-2 block tracking-[0.2px]">서브 도메인</label>
        <div className="flex gap-3 mb-2 max-h-[34px]">
          <div className="flex-1 relative items-center px-3 border border-neutral-30 rounded-[5px] bg-card">
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              className="text-[14px] leading-[34px] text-ink bg-transparent focus:outline-none tracking-[-0.02em] w-full max-w-[120px] md:max-w-[500px] lg:max-w-[700px]"
              placeholder="myservice"
              disabled={isSaving}
            />
            <span className="text-[14px] text-ink font-medium absolute right-0 top-1.5 my-auto mr-2 tracking-[-0.02em] pointer-events-none">.app.talkgate.im</span>
          </div>
          <button 
            onClick={onUpdateSubdomain}
            disabled={isSaving || subdomain === originalSubdomain}
            className="w-[48px] md:w-[72px] py-2 bg-neutral-90 text-neutral-20 text-[14px] font-semibold rounded-[5px] hover:opacity-90 transition-colors tracking-[-0.02em] leading-[17px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              "변경중..."
            ) : (
              <>
                <span className="md:hidden">변경</span>
                <span className="hidden md:inline">이름변경</span>
              </>
            )}
          </button>
        </div>
        <ul className="text-[14px] text-neutral-60 font-medium space-y-1 leading-6">
          <li>• 영문 소문자, 숫자, 하이픈(-) 사용 가능 (3-30자)</li>
          <li>• 하이픈(-)으로 시작하거나 끝날 수 없습니다.</li>
        </ul>
      </div>

      {/* 브랜드 아이콘 */}
      <div>
        <label className="text-[14px] text-ink mb-3 block font-medium tracking-[0.2px]">브랜드 아이콘</label>
        <div className="flex items-center justify-center">
          <div className="relative">
            <label 
              htmlFor="brand-icon-upload"
              className={`block w-20 h-20 border border-dashed border-neutral-30 rounded-xl cursor-pointer overflow-hidden bg-card hover:bg-neutral-10 transition-colors ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {brandIcon ? (
                <img src={brandIcon} alt="Brand Icon" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-40">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
            </label>
            <input
              id="brand-icon-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onBrandIconUpload}
              className="hidden"
              disabled={isSaving}
            />
            {brandIcon && !isSaving && (
              <button
                onClick={onRemoveBrandIcon}
                className="cursor-pointer absolute -top-2 -right-2 w-5 h-5 bg-foreground border-2 border-neutral-30 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3L9 9M9 3L3 9" stroke="white" className="dark:stroke-black" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        <p className="text-[14px] text-neutral-60 font-medium text-center mt-2 leading-6">
          • PNG, JPG, WEBP파일 (최대 5MB)<br className="block md:hidden" />
          • 정사각형 이미지 권장
        </p>
      </div>
    </div>
  );
}
