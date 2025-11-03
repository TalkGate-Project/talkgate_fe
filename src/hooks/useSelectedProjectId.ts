"use client";

import { useEffect, useState } from "react";

import { getSelectedProjectId } from "@/lib/project";

type ProjectState = {
  projectId: string | null;
  ready: boolean;
};

export function useSelectedProjectId() {
  const [{ projectId, ready }, setState] = useState<ProjectState>({ projectId: null, ready: false });

  useEffect(() => {
    const updateFromCookie = () => {
      setState({ projectId: getSelectedProjectId(), ready: true });
    };

    updateFromCookie();

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ projectId: string | null }>).detail;
      if (detail && "projectId" in detail) {
        setState({ projectId: detail.projectId, ready: true });
      } else {
        updateFromCookie();
      }
    };

    window.addEventListener("tg:selected-project-change", handler);
    window.addEventListener("focus", updateFromCookie);

    return () => {
      window.removeEventListener("tg:selected-project-change", handler);
      window.removeEventListener("focus", updateFromCookie);
    };
  }, []);

  return [projectId, ready] as const;
}

