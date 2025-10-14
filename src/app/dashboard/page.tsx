import Panel from "@/components/Panel";
import KpiCard from "@/components/KpiCard";
import GreetingBanner from "@/components/GreetingBanner";
import AssignedCustomersTable from "@/components/AssignedCustomersTable";
import SalesRanking from "@/components/SalesRanking";
import CalendarSection from "@/components/CalendarSection";
import NoticeSection from "@/components/NoticeSection";
import StatsSection from "@/components/StatsSection";

export default function DashboardPage() {
  return (
    <main className="min-h-[calc(100vh-54px)] text-foreground">
      <div className="mx-auto max-w-[1324px] w-full px-0 py-8">
        {/* Greeting Banner */}
        <GreetingBanner />

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard label="오늘 방문한 고객" value="40,689" />
          <KpiCard label="전체 상담한 고객" value="10,293" />
          <KpiCard label="결제율" value="89%" />
          <KpiCard label="결제 누적" value="2040만원" />
        </div>

        {/* Tables and ranking */}
        <div className="mt-6 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-9">
            <AssignedCustomersTable />
          </div>
          <div className="col-span-12 lg:col-span-3">
            <SalesRanking />
          </div>
        </div>

        {/* Calendar & schedule */}
        <div className="mt-6 grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <CalendarSection />
          </div>
        </div>

        {/* Notice & chart */}
        <div className="mt-6 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-6">
            <NoticeSection />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <StatsSection />
          </div>
        </div>
      </div>
    </main>
  );
}


