"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectsService } from "@/services/projects";

export default function ProjectsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<any[]>([]);
	const [showCreate, setShowCreate] = useState(false);
	const [creating, setCreating] = useState(false);
	const [formName, setFormName] = useState("");
	const [formAttendance, setFormAttendance] = useState(false);

    useEffect(() => {
        let mounted = true;
        ProjectsService.list()
            .then((res) => {
                if (!mounted) return;
                const payload: any = (res as any)?.data;
                const list = Array.isArray(payload) ? payload : payload?.data;
                setProjects(Array.isArray(list) ? list : []);
            })
            .catch(() => {
                if (!mounted) return;
                setProjects([]);
            })
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false; };
    }, []);

    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-[1200px] mx-auto px-6 pt-24 pb-24">
                <h1 className="text-[32px] leading-[38px] font-bold text-[#252525] text-center">프로젝트 선택</h1>
                <p className="text-[18px] leading-[21px] text-[#808080] text-center mt-4">
                    관리할 서비스를 선택하거나 새로운 서비스를 생성하세요
                </p>

                {/* Projects row */}
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {loading && (
                        <div className="col-span-full text-center text-[#808080]">불러오는 중...</div>
                    )}
                    {!loading && projects.length === 0 && (
                        <div className="col-span-full text-center text-[#808080]">표시할 프로젝트가 없습니다.</div>
                    )}
                    {projects.map((p: any) => (
                        <div key={p.id} className="rounded-[14px] shadow-[0_13px_61px_rgba(169,169,169,0.37)] bg-white p-6 border border-transparent hover:border-[#00E272] transition-colors duration-200">
                            <div className="flex items-center justify-between">
                                <div className="text-[18px] font-semibold text-[#000]">{p.name}</div>
                                <span className="text-[12px] text-[#808080]">멤버 12명</span>
                            </div>
                            <div className="grid grid-cols-2 gap-6 mt-5">
                                <div className="rounded-[14px] bg-white shadow-[6px_6px_54px_rgba(0,0,0,0.05)] p-5">
                                    <div className="text-[16px] font-semibold text-[#252525]">나에게 할당된 고객</div>
                                    <div className="mt-2 text-[28px] font-bold tracking-[1px] text-[#252525]">{p.myCustomers ?? 0}건</div>
                                </div>
                                <div className="rounded-[14px] bg-white shadow-[6px_6px_54px_rgba(0,0,0,0.05)] p-5">
                                    <div className="text-[16px] font-semibold text-[#252525]">오늘 예약 일정</div>
                                    <div className="mt-2 text-[28px] font-bold tracking-[1px] text-[#252525]">{p.todaySchedules ?? 0}건</div>
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
				<div className="rounded-[14px] border-2 border-dashed border-[#E2E2E2] hover:border-[#00E272] transition-colors duration-200 bg-white p-12 flex flex-col items-center justify-center min-h-[225px] cursor-pointer" onClick={() => setShowCreate(true)}>
                        <div className="w-12 h-12 rounded-full grid place-items-center">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="24" cy="24" r="24" fill="#EDEDED" />
                                <path d="M24 16V32M32 24L16 24" stroke="#808080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="mt-5 text-[16px] font-medium text-[#252525]">새 서비스 생성</div>
                        <div className="mt-2 text-[16px] text-[#808080]">새로운 고객관리 서비스를 만들어보세요</div>
                    </div>
                </div>
            </div>

		{/* Create Modal */}
		{showCreate && (
			<div className="fixed inset-0 z-50 flex items-center justify-center">
				<div className="absolute inset-0 bg-black/50" onClick={() => !creating && setShowCreate(false)} />
				<div className="relative bg-white rounded-[12px] shadow-[0_13px_61px_rgba(0,0,0,0.25)] w-[420px] p-6">
					<h2 className="text-[18px] font-semibold text-[#252525]">새 서비스 생성</h2>
					<form
						className="mt-4 space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
							setCreating(true);
							ProjectsService.create({ name: formName, useAttendanceMenu: formAttendance })
								.then(() => {
									// refresh list
									return ProjectsService.list().then((res) => {
										const payload: any = (res as any)?.data;
										const list = Array.isArray(payload) ? payload : payload?.data;
										setProjects(Array.isArray(list) ? list : []);
									});
								})
								.then(() => {
									setShowCreate(false);
									setFormName("");
									setFormAttendance(false);
								})
								.catch(() => alert("생성에 실패했습니다."))
								.finally(() => setCreating(false));
						}}
					>
						<label className="block">
							<span className="block text-[12px] text-[#6B7280] mb-1">프로젝트 이름</span>
							<input
								required
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
								placeholder="예: 거래소 텔레마케팅 관리"
								className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-3 text-[#111827]"
							/>
						</label>
						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={formAttendance}
								onChange={(e) => setFormAttendance(e.target.checked)}
								className="w-4 h-4"
							/>
							<span className="text-[14px] text-[#111827]">근태 메뉴 사용</span>
						</label>
						<div className="mt-6 flex justify-end gap-2">
							<button type="button" disabled={creating} className="h-[36px] px-4 rounded-[8px] border border-[#D1D5DB] text-[#374151]" onClick={() => setShowCreate(false)}>
								취소
							</button>
							<button type="submit" disabled={creating || !formName.trim()} className="h-[36px] px-4 rounded-[8px] bg-[#252525] text-[#D0D0D0] font-semibold">
								{creating ? "생성 중..." : "생성"}
							</button>
						</div>
					</form>
				</div>
			</div>
		)}
        </main>
    );
}


