interface FailureDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  uploadTime: string;
  failureCount: number;
  failures: Array<{ category: string; count: number }>;
}

interface FailureCardProps {
  category: string;
  count: number;
}

function FailureCard({ category, count }: FailureCardProps) {
  return (
    <div className="flex flex-col items-start p-3 gap-2.5 border border-[#E2E2E2] rounded-[5px] h-[68px]">
      <div className="text-[14px] font-semibold leading-5 text-[#D83232]">
        {category}
      </div>
      <div className="text-[14px] font-medium leading-5 text-[#808080]">
        {count}행
      </div>
    </div>
  );
}

export default function FailureDetailModal({
  isOpen,
  onClose,
  fileName,
  uploadTime,
  failureCount,
  failures,
}: FailureDetailModalProps) {
  if (!isOpen) return null;

  // 그리드를 4열로 배치
  const gridCols = 4;
  const rows = [];
  for (let i = 0; i < failures.length; i += gridCols) {
    rows.push(failures.slice(i, i + gridCols));
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
      {/* Modal */}
      <div className="relative w-[848px] h-[668px] bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.366013)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E2E266]">
          <h2 className="text-[18px] font-semibold leading-5 text-[#000000]">
            실패 내역 상세보기
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6l12 12" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* File Information */}
          <div className="bg-[#F8F8F8] rounded-[12px] p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[16px] font-semibold leading-5 text-[#000000] mb-1">
                  {fileName}
                </div>
                <div className="text-[14px] font-medium leading-5 text-[#808080]">
                  업로드 시간 : {uploadTime}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[14px] font-medium leading-5 text-[#808080] mb-1">
                  총 {failureCount}건의 실패 항목
                </div>
                <div className="text-[14px] font-medium leading-5 text-[#B0B0B0]">
                  *최대 20개 항목까지 표시됩니다.
                </div>
              </div>
            </div>
          </div>

          {/* Failure Grid */}
          <div className="mb-6 overflow-y-auto max-h-[320px] pr-2">
            <div className="grid grid-cols-4 gap-3">
              {failures.map((failure, index) => (
                <FailureCard
                  key={index}
                  category={failure.category}
                  count={failure.count}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-[#E2E2E266] mb-6"></div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] font-semibold leading-4 text-[#000000] hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => {
                console.log("배정하기");
                // TODO: Implement assignment logic
              }}
              className="px-3 py-2 bg-[#252525] rounded-[5px] text-[14px] font-semibold leading-4 text-[#D0D0D0] hover:bg-[#404040] transition-colors"
            >
              배정하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

