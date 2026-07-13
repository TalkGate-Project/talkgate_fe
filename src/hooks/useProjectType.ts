"use client";

import { useEffect, useState } from "react";
import {
  getProjectType,
  getSelectedProjectId,
  isDebtReliefProjectType,
  setProjectType,
} from "@/lib/project";
import { ProjectsService } from "@/services/projects";
import type { ProjectType } from "@/types/projects";

type UseProjectTypeResult = {
  projectType: ProjectType | null;
  ready: boolean;
  /** 영업점(회생·파산 분석) */
  isAnalysis: boolean;
  /** 변호사사무실 */
  isLawyer: boolean;
  /** analysis | lawyer */
  isDebtRelief: boolean;
};

/**
 * 현재 선택 프로젝트의 type을 구독합니다.
 * Hydration·깜빡임 방지를 위해 초기값은 null/false, ready 이후에만 분기하세요.
 */
export function useProjectType(): UseProjectTypeResult {
  const [projectType, setProjectTypeState] = useState<ProjectType | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const applyType = (type: ProjectType | null) => {
      if (cancelled) return;
      setProjectTypeState(type);
      setReady(true);
    };

    const hydrateFromApiIfNeeded = async () => {
      const stored = getProjectType();
      if (stored) {
        applyType(stored);
        return;
      }

      const projectId = getSelectedProjectId();
      if (!projectId) {
        applyType(null);
        return;
      }

      try {
        const res = await ProjectsService.detailById({
          "x-project-id": projectId,
        });
        const type = res.data?.data?.type ?? null;
        if (type) {
          setProjectType(type);
        }
        if (!cancelled) {
          applyType(type);
        }
      } catch (error) {
        console.error("Failed to hydrate project type:", error);
        if (!cancelled) {
          applyType(null);
        }
      }
    };

    void hydrateFromApiIfNeeded();

    const handleTypeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ projectType: ProjectType }>).detail;
      if (detail && "projectType" in detail) {
        setProjectTypeState(detail.projectType);
        setReady(true);
      }
    };

    const handleProjectChange = () => {
      void hydrateFromApiIfNeeded();
    };

    window.addEventListener("tg:project-type-change", handleTypeChange);
    window.addEventListener("tg:selected-project-change", handleProjectChange);

    return () => {
      cancelled = true;
      window.removeEventListener("tg:project-type-change", handleTypeChange);
      window.removeEventListener("tg:selected-project-change", handleProjectChange);
    };
  }, []);

  return {
    projectType,
    ready,
    isAnalysis: projectType === "analysis",
    isLawyer: projectType === "lawyer",
    isDebtRelief: isDebtReliefProjectType(projectType),
  };
}
