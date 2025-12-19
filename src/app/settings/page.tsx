import type { Metadata } from "next";
import SettingsPageContent from "@/components/settings/SettingsPageContent";

export const metadata: Metadata = {
  title: "TalkGate - 설정",
};

export default function SettingsPage() {
  return <SettingsPageContent />;
}
