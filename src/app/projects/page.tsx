"use client";

import { useRouter } from "next/navigation";

export default function ProjectsPage() {
    const router = useRouter();

    const projects = [
        {
            id: "svc-1",
            name: "거래소 텔레마케팅 관리",
            myCustomers: 23,
            todaySchedules: 23,
        },
        {
            id: "svc-2",
            name: "대출 컨설팅 영업관리",
            myCustomers: 15,
            todaySchedules: 23,
        },
    ];

    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-[1200px] mx-auto px-6 pt-24 pb-24">
                <h1 className="text-[32px] leading-[38px] font-bold text-[#252525] text-center">프로젝트 선택</h1>
                <p className="text-[18px] leading-[21px] text-[#808080] text-center mt-4">
                    관리할 서비스를 선택하거나 새로운 서비스를 생성하세요
                </p>

                {/* Projects row */}
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {projects.map((p) => (
                        <div key={p.id} className="rounded-[14px] shadow-[0_13px_61px_rgba(169,169,169,0.37)] bg-white p-6 border border-transparent hover:border-[#00E272] transition-colors duration-200">
                            <div className="flex items-center justify-between">
                                <div className="text-[18px] font-semibold text-[#000]">{p.name}</div>
                                <span className="text-[12px] text-[#808080]">멤버 12명</span>
                            </div>
                            <div className="grid grid-cols-2 gap-6 mt-5">
                                <div className="rounded-[14px] bg-white shadow-[6px_6px_54px_rgba(0,0,0,0.05)] p-5">
                                    <div className="text-[16px] font-semibold text-[#252525]">나에게 할당된 고객</div>
                                    <div className="mt-2 text-[28px] font-bold tracking-[1px] text-[#252525]">{p.myCustomers}건</div>
                                </div>
                                <div className="rounded-[14px] bg-white shadow-[6px_6px_54px_rgba(0,0,0,0.05)] p-5">
                                    <div className="text-[16px] font-semibold text-[#252525]">오늘 예약 일정</div>
                                    <div className="mt-2 text-[28px] font-bold tracking-[1px] text-[#252525]">{p.todaySchedules}건</div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button
                                    className="h-[40px] px-4 rounded-[8px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold"
                                    onClick={() => router.push("/dashboard")}
                                >
                                    선택
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Create new service */}
                    <div className="rounded-[14px] border-2 border-dashed border-[#E2E2E2] hover:border-[#00E272] transition-colors duration-200 bg-white p-12 flex flex-col items-center justify-center min-h-[225px]">
                        <div className="w-12 h-12 rounded-full grid place-items-center">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="24" cy="24" r="24" fill="#EDEDED" />
                                <path d="M24 16V32M32 24L16 24" stroke="#808080" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <div className="mt-5 text-[16px] font-medium text-[#252525]">새 서비스 생성</div>
                        <div className="mt-2 text-[16px] text-[#808080]">새로운 고객관리 서비스를 만들어보세요</div>
                    </div>
                </div>
            </div>
        </main>
    );
}


