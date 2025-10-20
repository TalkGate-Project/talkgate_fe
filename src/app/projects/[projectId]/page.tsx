"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { setSelectedProjectId } from "@/lib/project";

export default function ProjectScopedLandingRedirect() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();

  useEffect(() => {
    const id = params?.projectId;
    if (id) setSelectedProjectId(id);
    router.replace("/dashboard");
  }, [params, router]);

  return null;
}


