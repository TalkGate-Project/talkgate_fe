import { Suspense } from "react";
import SettingsClient from "@/components/settings/SettingsClient";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] dark:bg-[#1E1E1E] pt-[90px] pb-12">
      <div className="container mx-auto max-w-[1324px] px-4">
        <Suspense fallback={
          <div className="flex gap-6">
            <div className="w-[280px] bg-white rounded-[14px] shadow-sm p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-8"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-[14px] shadow-sm p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        }>
          <SettingsClient />
        </Suspense>
      </div>
    </main>
  );
}
