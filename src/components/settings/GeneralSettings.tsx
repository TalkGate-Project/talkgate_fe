"use client";

import { useState } from "react";

export default function GeneralSettings() {
  const [serviceName, setServiceName] = useState("거래소 텔레마케팅 관리");
  const [newStatusName, setNewStatusName] = useState("");
  const [statuses, setStatuses] = useState([
    "일반",
    "부재", 
    "재상담",
    "재상담",
    "결제유력"
  ]);
  const [isAttendanceEnabled, setIsAttendanceEnabled] = useState(true);

  const handleAddStatus = () => {
    if (newStatusName.trim()) {
      setStatuses([...statuses, newStatusName.trim()]);
      setNewStatusName("");
    }
  };

  const handleDeleteStatus = (index: number) => {
    setStatuses(statuses.filter((_, i) => i !== index));
  };

  const handleModifyStatus = (index: number) => {
    const newName = prompt("새로운 상태 이름을 입력하세요:", statuses[index]);
    if (newName && newName.trim()) {
      const newStatuses = [...statuses];
      newStatuses[index] = newName.trim();
      setStatuses(newStatuses);
    }
  };

  return (
    <div className="bg-white rounded-[14px] shadow-sm p-6">
      <h1 className="text-[24px] font-bold text-[#252525] mb-8">일반설정</h1>

      {/* 서비스 이름 */}
      <div className="mb-8">
        <h3 className="text-[16px] font-semibold text-[#252525] mb-4">서비스 이름</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            className="flex-1 px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#252525] focus:outline-none focus:border-[#252525]"
            placeholder="이름"
          />
          <button className="px-4 py-2 bg-[#252525] text-white text-[14px] font-medium rounded-[5px] hover:bg-[#404040] transition-colors">
            이름변경
          </button>
        </div>
      </div>

      {/* 처리상태 관리 */}
      <div className="mb-8">
        <h3 className="text-[16px] font-semibold text-[#252525] mb-2">처리상태 관리</h3>
        <p className="text-[14px] text-[#808080] mb-4">고객 상담에서 사용될 처리상태를 관리합니다.</p>
        
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddStatus()}
            className="flex-1 px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#252525] focus:outline-none focus:border-[#252525]"
            placeholder="새 상태 이름을 입력하세요"
          />
          <button 
            onClick={handleAddStatus}
            className="px-4 py-2 bg-[#252525] text-white text-[14px] font-medium rounded-[5px] hover:bg-[#404040] transition-colors"
          >
            추가
          </button>
        </div>

        {/* 상태 목록 */}
        <div className="space-y-2">
          {statuses.map((status, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 bg-[#F8F8F8] rounded-[5px]">
              <span className="text-[14px] text-[#252525]">{status}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleModifyStatus(index)}
                  className="px-3 py-1 text-[12px] text-[#808080] hover:text-[#252525] transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDeleteStatus(index)}
                  className="px-3 py-1 text-[12px] text-[#808080] hover:text-[#FF4444] transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 서비스 기능 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-[16px] font-semibold text-[#252525]">서비스 기능</h3>
          <span className="px-2 py-1 bg-[#E8F5E8] text-[12px] font-medium text-[#00C851] rounded-[4px]">
            관리자 전용
          </span>
        </div>
        <p className="text-[14px] text-[#808080] mb-4">출퇴근 기능 및 근태메뉴를 활성화 합니다.</p>
        
        <div className="flex items-center justify-between py-3 px-4 bg-[#F8F8F8] rounded-[5px]">
          <span className="text-[14px] text-[#252525]">근태 메뉴 사용</span>
          <button
            onClick={() => setIsAttendanceEnabled(!isAttendanceEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isAttendanceEnabled ? "bg-[#00C851]" : "bg-[#E2E2E2]"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                isAttendanceEnabled ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 서비스 삭제 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-[16px] font-semibold text-[#252525]">서비스 삭제</h3>
          <span className="px-2 py-1 bg-[#FFE8E8] text-[12px] font-medium text-[#FF4444] rounded-[4px]">
            주의
          </span>
        </div>
        <p className="text-[14px] text-[#FF4444] mb-4">
          서비스를 삭제하면 모든 데이터가 영구적으로 삭제되며 복수할 수 없습니다.
        </p>
        <button className="px-4 py-2 bg-[#FF4444] text-white text-[14px] font-medium rounded-[5px] hover:bg-[#E03E3E] transition-colors">
          서비스 삭제
        </button>
      </div>
    </div>
  );
}
