import type { Metadata } from "next";
import CustomersPageContent from "@/components/customers/CustomersPageContent";

export const metadata: Metadata = {
  title: "TalkGate - 고객목록",
};

export default function CustomersPage() {
  return <CustomersPageContent />;
}
