"use client";

import { useState } from "react";

interface ServiceDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  serviceName?: string;
}

export default function ServiceDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  serviceName = "거래소 텔레마케팅 관리",
}: ServiceDeleteModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsConfirmed(value === serviceName);
  };

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      handleClose();
    }
  };

  const handleClose = () => {
    setInputValue("");
    setIsConfirmed(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-[848px] bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.37)]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 w-6 h-6 flex items-center justify-center"
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
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="p-8 h-full flex flex-col">
          {/* Header */}
          <div className="text-[#D83232] text-[18px] font-semibold mb-8">
            프로젝트 삭제확인
          </div>

          {/* Warning Icon */}
          <div className="cursor-pointer flex justify-center mb-4">
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

          {/* Main Warning */}
          <div className="text-center mb-8">
            <div className="text-[#D83232] text-[18px] font-semibold mb-2">
              정말로 프로젝트를 삭제하시겠습니까?
            </div>
            <div className="text-[#000000] text-[14px] font-medium">
              이 작업은 되돌릴 수 없으며, 다음 데이터가 영구적으로 삭제됩니다
            </div>
          </div>

          {/* Data to be Deleted List */}
          <div className="bg-[#F8F8F8] rounded-[5px] p-6 mb-6">
            <div className="text-[#000000] text-[14px] font-medium leading-6">
              • 모든 상담 기록 및 메시지
              <br />
              • 고객 정보 및 상담 내역
              <br />
              • 멤버 및 팀 설정
              <br />
              • 채널 설정 및 연동 정보
              <br />• 통계 데이터 및 보고서
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="bg-[#F8F8F8] rounded-[5px] p-6 mb-6">
            <div className="text-[#000000] text-[14px] font-medium mb-3">
              프로젝트 삭제를 확인하려면 아래에 이름 "{serviceName}"을 정확히
              입력하세요.
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={serviceName}
              className="w-full px-3 py-2 bg-white border border-[#E2E2E2] rounded-[5px] text-[14px] font-medium text-foreground focus:outline-none focus:border-[#D83232]"
            />
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-[#E2E2E266] mb-6"></div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="cursor-pointer px-3 py-1.5 bg-white border border-[#E2E2E2] rounded-[5px] text-[14px] font-semibold text-[#000000] hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isConfirmed}
              className={`cursor-pointer px-3 py-1.5 rounded-[5px] text-[14px] font-semibold transition-colors ${
                isConfirmed
                  ? "bg-[#D83232] text-white hover:bg-[#C02828] cursor-pointer"
                  : "bg-[#B0B0B0] text-[#808080] cursor-not-allowed"
              }`}
            >
              프로젝트 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
