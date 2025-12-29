"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useMe } from "@/hooks/useMe";
import { useAttendanceMenu } from "@/hooks/useAttendanceMenu";
import { useMyMember } from "@/hooks/useMyMember";

// 아이콘 컴포넌트들
import {
  DashboardIcon,
  ConsultIcon,
  CustomerListIcon,
  StatsIcon,
  AttendanceIcon,
  NoticeIcon,
  SettingsIcon,
  CloseIcon,
} from "@/components/icons";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const { user } = useMe();
  const [showAttendanceMenu, attendanceReady] = useAttendanceMenu();
  const { isAdminOrSubAdmin } = useMyMember();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const MENU_ITEMS = [
    { label: "대시보드", href: "/dashboard", icon: <DashboardIcon /> },
    { label: "상담", href: "/consult", icon: <ConsultIcon /> },
    { label: "고객목록", href: "/customers", icon: <CustomerListIcon /> },
    { label: "통계", href: "/stats", icon: <StatsIcon /> },
    // useAttendanceMenu가 true여도 admin이나 subAdmin이 아니면 근태 메뉴는 사용할 수 없음
    ...(attendanceReady && showAttendanceMenu && isAdminOrSubAdmin 
      ? [{ label: "근태", href: "/attendance", icon: <AttendanceIcon /> }] 
      : []),
    { label: "공지사항", href: "/notices", icon: <NoticeIcon /> },
    { label: "설정", href: "/settings", icon: <SettingsIcon /> },
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
            className="fixed inset-0 bg-black/30 dark:bg-black/50 z-[60]"
            style={{ zoom: 1 }}
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-[54px] left-0 bottom-0 w-[336px] bg-neutral-0 dark:bg-neutral-10 z-[61] rounded-tr-[12px] shadow-lg overflow-y-auto"
            style={{ zoom: 1 }}
          >
            {/* Header Area inside Drawer */}
            <div className="p-[23px] pb-4">
              <div className="flex justify-between items-center mb-6">
                {/* Logo Area */}
                <div className="flex items-center">
                  {/* 라이트 모드 로고 */}
                  <Image 
                    src="/main_logo_dark.png" 
                    alt="Talkgate" 
                    width={102} 
                    height={24} 
                    className="h-6 w-auto dark:hidden" 
                  />
                  {/* 다크 모드 로고 */}
                  <Image 
                    src="/main_logo.png" 
                    alt="Talkgate" 
                    width={102} 
                    height={24} 
                    className="h-6 w-auto hidden dark:block" 
                  />
                </div>
                 
                <button onClick={onClose} className="p-1 text-neutral-90 dark:text-neutral-70">
                  <CloseIcon />
                </button>
              </div>

              {/* Total User Info */}
              <div className="flex items-center gap-2 mb-8">
                <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-neutral-30 overflow-hidden">
                  <div className="w-full h-full bg-primary-40" /> 
                </div>
                <span className="text-[14px] font-medium text-neutral-90 dark:text-neutral-70">Total User</span>
              </div>
               
              <div className="w-full h-[1px] bg-neutral-30 dark:bg-neutral-30 opacity-50 mb-6" />

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
                        isActive 
                          ? "bg-primary-10/30 dark:bg-primary-10/10 text-primary-60" 
                          : "text-neutral-60 dark:text-neutral-50 hover:bg-neutral-10 dark:hover:bg-neutral-20"
                      }`}
                    >
                      <div className={`${isActive ? "text-primary-60" : "text-neutral-50 dark:text-neutral-50"}`}>
                        {item.icon}
                      </div>
                      <span className={`text-[16px] font-medium ${isActive ? "font-bold text-primary-60" : "text-neutral-60 dark:text-neutral-60"}`}>
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
