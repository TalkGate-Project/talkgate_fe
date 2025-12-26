"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useMe } from "@/hooks/useMe";
import { useAttendanceMenu } from "@/hooks/useAttendanceMenu";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const { user } = useMe();
  const [showAttendanceMenu, attendanceReady] = useAttendanceMenu();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const MENU_ITEMS = [
    { label: "대시보드", href: "/dashboard", icon: <HomeIcon /> },
    { label: "상담", href: "/consult", icon: <ChatIcon /> },
    { label: "고객목록", href: "/customers", icon: <ClipboardListIcon /> },
    { label: "통계", href: "/stats", icon: <ChartBarIcon /> },
    ...(attendanceReady && showAttendanceMenu 
      ? [{ label: "근태", href: "/attendance", icon: <ViewGridIcon /> }] 
      : []),
    { label: "공지사항", href: "/notices", icon: <SpeakerphoneIcon /> },
    { label: "설정", href: "/settings", icon: <CogIcon /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dimmed Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-[60]"
            style={{ zoom: 1 }}
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-[54px] left-0 bottom-0 w-[336px] bg-white z-[61] rounded-tr-[12px] shadow-lg overflow-y-auto"
            style={{ zoom: 1 }}
          >
            {/* Header Area inside Drawer */}
            <div className="p-[23px] pb-4">
              <div className="flex justify-between items-center mb-6">
                 {/* Logo Area - Reusing the vector logic from figma or just Image */}
                 <div className="flex items-center">
                    <Image src="/main_logo_dark.png" alt="Talkgate" width={102} height={24} className="h-6 w-auto" onError={(e) => {
                        // Fallback if dark logo doesn't exist, generic text or light logo with filter
                        e.currentTarget.style.display = 'none';
                    }}/>
                    <span className="text-[18px] font-bold text-[#252525] ml-0">Talkgate</span>
                 </div>
                 
                 <button onClick={onClose} className="p-1">
                   <XIcon />
                 </button>
              </div>

              {/* Total User Info (Mock for now or real if available) */}
               <div className="flex items-center gap-2 mb-8">
                 <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden">
                    {/* Placeholder for Total User Icon */}
                    <div className="w-full h-full bg-[#51F8A5]" /> 
                 </div>
                 <span className="text-[14px] font-medium text-[#252525]">Total User</span>
               </div>
               
               <div className="w-full h-[1px] bg-[#E2E2E2] opacity-50 mb-6" />

               {/* Menu Items */}
               <nav className="flex flex-col gap-1">
                 {MENU_ITEMS.map((item) => {
                   const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                   
                   return (
                     <Link
                       key={item.href}
                       href={item.href}
                       onClick={onClose}
                       className={`flex items-center gap-4 px-5 py-3 rounded-[4px] transition-colors ${
                         isActive ? "bg-[#D6FAE8]/30 text-[#00E272]" : "text-[#808080] hover:bg-gray-50"
                       }`}
                     >
                       <div className={`${isActive ? "text-[#00E272]" : "text-[#B0B0B0]"}`}>
                         {item.icon}
                       </div>
                       <span className={`text-[16px] font-medium ${isActive ? "font-bold" : ""}`}>
                         {item.label}
                       </span>
                     </Link>
                   );
                 })}
               </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Icons (Simple SVG implementations based on Lucide/Heroicons style to match requirement)

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ClipboardListIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

function ChartBarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ViewGridIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function SpeakerphoneIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path d="M12 14l0 6" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

