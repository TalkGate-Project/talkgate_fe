"use client";

import { Suspense, useEffect } from "react";
import SettingsClient from "@/components/settings/SettingsClient";

export default function SettingsPage() {
  useEffect(() => {
    document.title = "TalkGate - 설정";
  }, []);

  return (
    <main className="min-h-screen bg-background pt-6 pb-12">
      <div className="container mx-auto max-w-[1324px] px-4">
        <Suspense fallback={
          <div className="flex gap-6">
            <div className="w-[280px] bg-card rounded-[14px] shadow-sm p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-neutral-20 rounded mb-2"></div>
                <div className="h-4 bg-neutral-20 rounded mb-8"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="h-12 bg-neutral-20 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 bg-card rounded-[14px] shadow-sm p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-neutral-20 rounded mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-neutral-20 rounded w-1/3"></div>
                  <div className="h-4 bg-neutral-20 rounded w-1/2"></div>
                  <div className="h-32 bg-neutral-20 rounded"></div>
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
