import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter, Roboto_Mono, Montserrat } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import "react-datepicker/dist/react-datepicker.css";
import ConditionalHeader from "../components/common/ConditionalHeader";
import TermsGuard from "../components/common/TermsGuard";
import AuthSessionWatcher from "../components/common/AuthSessionWatcher";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import ErrorFeedbackModalProvider from "@/providers/ErrorFeedbackModalProvider";
import ConfirmModalProvider from "@/providers/ConfirmModalProvider";
import PersistentModalProvider from "@/providers/PersistentModalProvider";
import NotificationProvider from "@/providers/NotificationProvider";
import CustomerModalProvider from "@/providers/CustomerModalProvider";
import ChatProvider from "@/providers/ChatProvider";
import TeamChatProvider from "@/providers/TeamChatProvider";
import TeamChatWindowProvider from "@/providers/TeamChatWindowProvider";
import UiScaleToggle from "@/components/layout/UiScaleToggle";
import GlobalStaffChatModal from "@/components/layout/GlobalStaffChatModal";
import { DemoModeProvider } from "@/contexts/DemoModeContext";

/* Load primary body and mono fonts. Pretendard is referenced via CSS stack. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TalkGate",
  description: "TalkGate 고객 관리 시스템",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Middleware에서 설정한 zoom 모드 확인
  const headersList = await headers();
  const uiZoomMode = headersList.get("x-ui-zoom") || "compact";
  const initialZoom = uiZoomMode === "normal" ? 1 : 0.8;

  return (
    <html lang="ko" data-theme="light">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
        <meta name="robots" content="noindex, nofollow" />
      </head>
      {/* 
          Middleware에서 전달된 초기 zoom 값을 body 스타일에 바로 적용하여 
          초기 로딩 시 깜빡임(FOUC) 방지 및 로그아웃 리다이렉트 시 정확한 zoom 적용 보장
      */}
      <body 
        className={`${inter.variable} ${robotoMono.variable} ${montserrat.variable} antialiased`}
        style={{ zoom: initialZoom } as any}
      >
        <ErrorFeedbackModalProvider>
          <ConfirmModalProvider>
            <PersistentModalProvider>
              <ReactQueryProvider>
                <DemoModeProvider>
                  <CustomerModalProvider>
                    <NotificationProvider>
                      <ChatProvider>
                        <TeamChatProvider>
                          <TeamChatWindowProvider>
                            <ConditionalHeader />
                            <GlobalStaffChatModal />
                            <AuthSessionWatcher />
                            <TermsGuard />
                            {/* 화면 크기 체험용 토글 (기존 / 컴팩트) */}
                            <Suspense fallback={null}>
                              <UiScaleToggle initialZoom={uiZoomMode as "normal" | "compact"} />
                            </Suspense>
                            {/* No fixed padding; header component inserts spacer only when visible */}
                            <div>{children}</div>
                          </TeamChatWindowProvider>
                        </TeamChatProvider>
                      </ChatProvider>
                    </NotificationProvider>
                  </CustomerModalProvider>
                </DemoModeProvider>
              </ReactQueryProvider>
            </PersistentModalProvider>
          </ConfirmModalProvider>
        </ErrorFeedbackModalProvider>
      </body>
    </html>
  );
}
