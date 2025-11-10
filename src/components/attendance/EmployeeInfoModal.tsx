"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AttendanceRecord } from "@/data/mockAttendanceData";
import DatePicker from "@/components/common/DatePicker";
import MailIcon from "@/components/common/icons/MailIcon";
import PhoneIcon from "@/components/common/icons/PhoneIcon";
import LockClosedDangerIcon from "@/components/common/icons/LockClosedDangerIcon";
import CalendarInlineIcon from "@/components/common/icons/CalendarInlineIcon";
import TrashIcon from "@/components/common/icons/TrashIcon";

type Props = {
    open: boolean;
    onClose: () => void;
    employee: AttendanceRecord | null;
};

export default function EmployeeInfoModal({ open, onClose, employee }: Props) {
    const [formData, setFormData] = useState({
        realName: "",
        birthDate: null as Date | null,
        address: "",
        specialNote: ""
    });

    useEffect(() => {
        if (employee) {
            setFormData({
                realName: employee.name,
                birthDate: new Date(1985, 2, 15),
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
                                            <div className="w-px h-4 bg-neutral-60/50" aria-hidden />
                                            <span className="px-3 py-1 bg-neutral-20 rounded-[30px] text-[12px] font-medium text-neutral-70">
                                                {employee.position}
                                            </span>
                                        </div>

                                        {/* 연락처 정보 - 한 줄로 표시 */}
                                        <div className="flex items-center gap-6 mb-3">
                                            <div className="flex items-center gap-2">
                                                <MailIcon />
                                                <span className="text-[14px] text-neutral-60">kim.sales@company.com</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <PhoneIcon />
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
                            <LockClosedDangerIcon />
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
                                            <div className="relative cursor-pointer">
                                                <DatePicker
                                                    value={formData.birthDate}
                                                    onChange={(d) => setFormData(prev => ({ ...prev, birthDate: d }))}
                                                    className="cursor-pointer pr-10"
                                                />
                                                <CalendarInlineIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" />
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
                                        <button className="w-5 h-5 cursor-pointer">
                                            <TrashIcon />
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
                                    <button className="cursor-pointer h-[34px] px-3 bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold">
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
                        className="h-[34px] px-4 rounded-[5px] border border-border text-foreground bg-card text-[14px]"
                        onClick={() => {
                            setFormData({
                                realName: employee.name,
                                birthDate: new Date(1985, 2, 15),
                                address: "서울시 마포구",
                                specialNote: ""
                            });
                        }}
                    >
                        초기화
                    </button>
                    <button
                        className="h-[34px] px-4 rounded-[5px] bg-neutral-90 text-neutral-0 text-[14px]"
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
