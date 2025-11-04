"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AttendanceRecord } from "@/data/mockAttendanceData";

type Props = {
    open: boolean;
    onClose: () => void;
    employee: AttendanceRecord | null;
};

export default function EmployeeInfoModal({ open, onClose, employee }: Props) {
    const [formData, setFormData] = useState({
        realName: "",
        birthDate: "",
        address: "",
        specialNote: ""
    });

    useEffect(() => {
        if (employee) {
            setFormData({
                realName: employee.name,
                birthDate: "1985. 03. 15",
                address: "서울시 마포구",
                specialNote: ""
            });
        }
    }, [employee]);

    if (!open || !employee || typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div
                className="absolute left-1/2 top-1/2 bg-card rounded-[14px] shadow-[0_13px_61px_rgba(169,169,169,0.37)] overflow-hidden flex flex-col"
                style={{
                    width: 904,
                    height: 546,
                    transform: 'translate(-50%, -50%)'
                }}
            >
                {/* 헤더 */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-border flex-shrink-0">
                    <div className="text-[18px] font-semibold text-foreground">직원정보</div>
                    <button onClick={onClose} aria-label="close" className="w-6 h-6 grid place-items-center rounded hover:bg-neutral-10">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 18L18 6M6 6L18 18" stroke="var(--neutral-50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* 스크롤 가능한 콘텐츠 */}
                <div className="overflow-y-auto flex-1">
                    <div className="px-6 py-4 space-y-6">
                        {/* 기본 정보 */}
                        <div>
                            <div className="text-[16px] font-semibold text-foreground mb-4">기본 정보</div>
                            <div className="bg-neutral-10 rounded-[12px] p-4">
                                <div className="flex items-start gap-4">
                                    {/* 아바타 */}
                                    <div className="w-12 h-12 bg-neutral-60 rounded-full flex items-center justify-center">
                                        <span className="text-neutral-0 text-[18px] font-semibold">
                                            {employee.name.charAt(0)}
                                        </span>
                                    </div>

                                    {/* 직원 상세 정보 */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[16px] font-semibold text-foreground">{employee.name}</span>
                                            <span className="px-3 py-1 bg-neutral-20 rounded-[30px] text-[12px] font-medium text-neutral-70">
                                                {employee.position}
                                            </span>
                                        </div>

                                        {/* 연락처 정보 - 한 줄로 표시 */}
                                        <div className="flex items-center gap-6 mb-3">
                                            <div className="flex items-center gap-2">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="var(--neutral-50)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M22 6L12 13L2 6" stroke="var(--neutral-50)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <span className="text-[14px] text-neutral-60">kim.sales@company.com</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M22 16.92V19.92C22 20.52 21.52 21 20.92 21C10.93 21 3 13.07 3 3.08C3 2.48 3.48 2 4.08 2H7.1C7.65 2 8.1 2.45 8.1 3C8.1 4.28 8.1 5.56 8.64 6.78C8.8 7.31 8.7 7.89 8.35 8.35L6.62 10.08C8.06 13.62 10.38 15.94 13.92 17.38L15.65 15.65C16.11 15.3 16.69 15.2 17.22 15.36C18.44 15.72 19.72 15.9 21 15.9C21.55 15.9 22 16.35 22 16.92Z" stroke="var(--neutral-50)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <span className="text-[14px] text-neutral-60">010-1234-5678</span>
                                            </div>
                                        </div>

                                        {/* 지점 태그 */}
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-secondary-10 rounded-[30px] text-[12px] font-medium text-secondary-40">
                                                영업1지점
                                            </span>
                                            <span className="px-3 py-1 bg-secondary-10 rounded-[30px] text-[12px] font-medium text-secondary-40">
                                                영업2지점
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 구분선 */}
                        <div className="border-t border-border opacity-50" />

                        <div className="flex items-center gap-2 mb-4">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="var(--danger-40)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M9 12L11 14L15 10" stroke="var(--danger-40)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-[16px] font-semibold text-danger-40">관리자 정보</span>
                        </div>

                        {/* 관리자 정보, 팀 변경 이력, 특이사항을 감싸는 래퍼 */}
                        <div className="border border-border rounded-[12px] p-4 space-y-6">

                            {/* 관리자 정보 */}
                            <div>

                                <div className="space-y-4">
                                    {/* 실명과 생년월일 - 한 줄에 2개 */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[14px] text-neutral-60 mb-2">실명</label>
                                            <input
                                                type="text"
                                                value={formData.realName}
                                                onChange={(e) => setFormData(prev => ({ ...prev, realName: e.target.value }))}
                                                className="w-full h-[34px] px-3 border border-border rounded-[5px] text-[14px] text-foreground bg-card"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[14px] text-neutral-60 mb-2">생년월일</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={formData.birthDate}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                                                    className="w-full h-[34px] px-3 pr-10 border border-border rounded-[5px] text-[14px] text-foreground bg-card"
                                                />
                                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="var(--neutral-50)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 주소 */}
                                    <div>
                                        <label className="block text-[14px] text-neutral-60 mb-2">주소</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                                className="flex-1 h-[34px] px-3 border border-border rounded-[5px] text-[14px] text-foreground bg-card"
                                            />
                                            <button className="h-[34px] px-3 bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold">
                                                저장
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 구분선 */}
                            <div className="border-t border-border opacity-50" />

                            {/* 팀 변경 이력 */}
                            <div>
                                <div className="text-[16px] font-semibold text-foreground mb-4">팀 변경 이력</div>
                                <div className="space-y-3">
                                    <div className="bg-neutral-10 rounded-[12px] p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[14px] text-neutral-60">2025. 10. 31</span>
                                                <span className="px-3 py-1 bg-primary-10 rounded-[30px] text-[12px] font-medium text-primary-80">
                                                    A팀
                                                </span>
                                                <span className="text-[14px] text-foreground">팀장</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-neutral-10 rounded-[12px] p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[14px] text-neutral-60">2025. 08. 31</span>
                                                <span className="px-3 py-1 bg-primary-10 rounded-[30px] text-[12px] font-medium text-primary-80">
                                                    B팀
                                                </span>
                                                <span className="text-[14px] text-foreground">팀원</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 구분선 */}
                            <div className="border-t border-border opacity-50" />

                            {/* 특이사항 */}
                            <div>
                                <div className="text-[16px] font-semibold text-foreground mb-4">특이사항</div>

                                {/* 기존 특이사항 */}
                                <div className="bg-neutral-10 rounded-[12px] p-4 mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[14px] text-foreground">김직원</span>
                                            <span className="text-[14px] text-neutral-60">2025. 08. 31 13:01:41</span>
                                        </div>
                                        <button className="w-5 h-5">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="var(--neutral-50)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-[14px] text-foreground">특이사항 있음. 참고부탁</p>
                                </div>

                                {/* 새 특이사항 입력 */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="특이사항을 입력하세요"
                                        value={formData.specialNote}
                                        onChange={(e) => setFormData(prev => ({ ...prev, specialNote: e.target.value }))}
                                        className="flex-1 h-[34px] px-3 border border-border rounded-[5px] text-[14px] text-foreground placeholder:text-neutral-60 bg-card"
                                    />
                                    <button className="h-[34px] px-3 bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold">
                                        저장
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 푸터 */}
                <div className="px-6 py-3 flex justify-end gap-3 border-t border-border flex-shrink-0">
                    <button
                        className="h-[34px] px-4 rounded-[5px] border border-border text-foreground bg-card"
                        onClick={() => {
                            setFormData({
                                realName: employee.name,
                                birthDate: "1985. 03. 15",
                                address: "서울시 마포구",
                                specialNote: ""
                            });
                        }}
                    >
                        초기화
                    </button>
                    <button
                        className="h-[34px] px-4 rounded-[5px] bg-neutral-90 text-neutral-0"
                        onClick={onClose}
                    >
                        적용완료
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
