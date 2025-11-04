import type { Metadata } from "next";
import { Inter, Roboto_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import "react-datepicker/dist/react-datepicker.css";
import ConditionalHeader from "../components/common/ConditionalHeader";
import ConditionalContentScale from "../components/common/ConditionalContentScale";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import ErrorFeedbackModalProvider from "@/providers/ErrorFeedbackModalProvider";
import NotificationProvider from "@/providers/NotificationProvider";

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
  weight: ["400", "500", "600", "700"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="light">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className={`${inter.variable} ${robotoMono.variable} ${montserrat.variable} antialiased`}>
        <ErrorFeedbackModalProvider>
          <ReactQueryProvider>
            <NotificationProvider>
              <ConditionalHeader />
              {/* No fixed padding; header component inserts spacer only when visible */}
              <ConditionalContentScale>
                <div>{children}</div>
              </ConditionalContentScale>
            </NotificationProvider>
          </ReactQueryProvider>
        </ErrorFeedbackModalProvider>
      </body>
    </html>
  );
}
