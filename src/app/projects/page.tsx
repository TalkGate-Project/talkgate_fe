import { Suspense } from "react";
import { Metadata } from "next";
import ProjectsContent from "@/components/projects/ProjectsContent";

export const metadata: Metadata = {
  title: "TalkGate - 프로젝트",
};

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}
