import type { Metadata } from "next";
import InstagramCallbackContent from "@/components/instagram/InstagramCallbackContent";

export const metadata: Metadata = {
  title: "TalkGate - 인스타그램 연동",
};

export default function InstagramCallbackPage() {
  return <InstagramCallbackContent />;
}
