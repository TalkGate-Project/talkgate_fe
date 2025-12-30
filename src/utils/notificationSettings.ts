/**
 * 알림 설정 관리 유틸리티
 * 로컬 스토리지를 사용하여 프로젝트별 알림 설정 상태를 저장/불러오기
 */

import { getSelectedProjectId } from "@/lib/project";

const STORAGE_KEY = "talkgate_notification_settings";

export interface NotificationSettings {
  consultationChat: boolean; // 상담 채팅 알림
  news: boolean; // 새로운 소식 알림
}

type ProjectNotificationSettings = Record<string, NotificationSettings>;

const DEFAULT_SETTINGS: NotificationSettings = {
  consultationChat: true,
  news: true,
};

/**
 * 모든 프로젝트의 알림 설정 불러오기
 */
function getAllProjectSettings(): ProjectNotificationSettings {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {};
    }

    return JSON.parse(stored) as ProjectNotificationSettings;
  } catch (error) {
    console.error("Failed to load notification settings:", error);
    return {};
  }
}

/**
 * 모든 프로젝트의 알림 설정 저장하기
 */
function saveAllProjectSettings(settings: ProjectNotificationSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save notification settings:", error);
  }
}

/**
 * 현재 프로젝트의 알림 설정 불러오기
 * @param projectId 프로젝트 ID (없으면 현재 선택된 프로젝트 ID 사용)
 */
export function getNotificationSettings(projectId?: string | null): NotificationSettings {
  const currentProjectId = projectId ?? getSelectedProjectId();
  
  if (!currentProjectId) {
    return DEFAULT_SETTINGS;
  }

  const allSettings = getAllProjectSettings();
  return allSettings[currentProjectId] ?? DEFAULT_SETTINGS;
}

/**
 * 현재 프로젝트의 알림 설정 저장하기
 * @param settings 저장할 설정
 * @param projectId 프로젝트 ID (없으면 현재 선택된 프로젝트 ID 사용)
 */
export function saveNotificationSettings(
  settings: NotificationSettings,
  projectId?: string | null
): void {
  const currentProjectId = projectId ?? getSelectedProjectId();
  
  if (!currentProjectId) {
    console.warn("Cannot save notification settings: no project ID");
    return;
  }

  const allSettings = getAllProjectSettings();
  allSettings[currentProjectId] = settings;
  saveAllProjectSettings(allSettings);
}

/**
 * 특정 알림 타입의 설정 값 가져오기
 * @param type 알림 타입
 * @param projectId 프로젝트 ID (없으면 현재 선택된 프로젝트 ID 사용)
 */
export function isNotificationEnabled(
  type: "consultationChat" | "news",
  projectId?: string | null
): boolean {
  const settings = getNotificationSettings(projectId);
  return settings[type];
}

