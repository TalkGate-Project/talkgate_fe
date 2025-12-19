import type { Metadata } from "next";
import MySettingsPageContent from "@/components/my-settings/MySettingsPageContent";

export const metadata: Metadata = {
  title: "TalkGate - 마이페이지",
};

export default function MySettingsPage() {
  return <MySettingsPageContent />;
}
