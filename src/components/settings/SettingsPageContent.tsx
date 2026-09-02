"use client";

import { Suspense } from "react";
import SettingsClient from "@/components/settings/SettingsClient";

export default function SettingsPageContent() {
  return (
    <main className="bg-neutral-0 md:bg-background md:pt-9 md:pb-12">
      <div className="container mx-auto max-w-[1324px] px-0 md:px-6 lg:px-0">
        <Suspense fallback={
          <div className="flex gap-8">
            <div className="hidden min-h-[552px] w-20 rounded-[14px] bg-card p-3 shadow-sm md:block lg:min-h-0 lg:w-[280px] lg:p-6">
              <div className="animate-pulse lg:hidden">
                <div className="mx-auto mb-6 mt-3 h-7 w-7 rounded-full bg-neutral-20" />
                <div className="mb-2 h-px bg-neutral-20" />
                <div className="space-y-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex h-[52px] items-center justify-center">
                      <div className="h-6 w-6 rounded bg-neutral-20" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden animate-pulse lg:block">
                <div className="h-6 bg-neutral-20 rounded mb-2"></div>
                <div className="h-4 bg-neutral-20 rounded mb-8"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="h-12 bg-neutral-20 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0 md:overflow-x-auto lg:overflow-x-visible">
              <div className="md:min-w-max lg:min-w-0 bg-card rounded-[14px] shadow-sm p-6">
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
          </div>
        }>
          <SettingsClient />
        </Suspense>
      </div>
    </main>
  );
}




