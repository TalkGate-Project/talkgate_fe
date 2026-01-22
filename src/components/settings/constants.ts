import { isAdmin } from "@/utils/permissions";
import type { MemberRole } from "@/types/members";

export type SettingsTab =
  | "general"
  | "profile"
  | "consultation-channel"
  | "sender-numbers"
  | "member"
  | "invited-member"
  | "customer-api"
  | "team-management"
  | "batch-registration"
  | "sms-history";

export type SettingsSidebarItem = {
  key: SettingsTab | null; // null이면 부모 항목 (토글만)
  label: string;
  icon: React.ComponentType<{ isActive: boolean }>;
  /** 탭 접근 권한 체크 함수 - 반환값이 true면 표시 */
  canAccess?: (params: { role: MemberRole | undefined; isLoading: boolean }) => boolean;
  /** 하위 항목들 */
  children?: SettingsSidebarItem[];
  /** 부모 항목인지 (토글만 하고 페이지 이동 안 함) */
  isParent?: boolean;
};

// Settings 아이콘들
import GeneralIcon from "./icons/GeneralIcon";
import ProfileIcon from "./icons/ProfileIcon";
import ConsultationChannelIcon from "./icons/ConsultationChannelIcon";
import MemberIcon from "./icons/MemberIcon";
import InvitedMemberIcon from "./icons/InvitedMemberIcon";
import TeamIcon from "./icons/TeamIcon";
import OrganizationManagementIcon from "./icons/OrganizationManagementIcon";
import CustomerApiIcon from "./icons/CustomerApiIcon";
import BatchRegistrationIcon from "./icons/BatchRegistrationIcon";
import SenderNumberIcon from "./icons/SenderNumberIcon";
import SmsHistoryIcon from "./icons/SmsHistoryIcon";
import SmsIcon from "./icons/SmsIcon";

export const SETTINGS_ITEMS: SettingsSidebarItem[] = [
  {
    key: "general",
    label: "일반",
    icon: GeneralIcon,
    // 일반 탭은 **총관리자(admin)**만, my API 데이터 기준으로 엄격하게 제한
    canAccess: ({ role, isLoading }) => {
      if (isLoading) return false;
      return isAdmin(role);
    },
  },
  {
    key: "profile",
    label: "프로필",
    icon: ProfileIcon,
    // 모든 사용자 접근 가능
  },
  {
    key: "consultation-channel",
    label: "상담채널",
    icon: ConsultationChannelIcon,
    // 모든 사용자 접근 가능
  },
  {
    key: null,
    label: "조직관리",
    icon: OrganizationManagementIcon,
    isParent: true,
    // 모든 사용자 접근 가능
    children: [
      {
        key: "team-management",
        label: "팀",
        icon: TeamIcon,
        // 모든 사용자 접근 가능
      },
      {
        key: "member",
        label: "멤버",
        icon: MemberIcon,
        // 모든 사용자 접근 가능
      },
      {
        key: "invited-member",
        label: "멤버 초대",
        icon: InvitedMemberIcon,
        // 모든 사용자 접근 가능
      },
    ],
  },
  {
    key: null,
    label: "문자",
    icon: SmsIcon,
    isParent: true,
    // 모든 사용자 접근 가능
    children: [
      {
        key: "sender-numbers",
        label: "발신번호 등록",
        icon: SenderNumberIcon,
        // 모든 사용자 접근 가능
      },
      {
        key: "sms-history",
        label: "문자 발송 이력",
        icon: SmsHistoryIcon,
        // 모든 사용자 접근 가능
      },
    ],
  },
  {
    key: "batch-registration",
    label: "일괄 등록 이력",
    icon: BatchRegistrationIcon,
    // 모든 사용자 접근 가능
  },
  {
    key: "customer-api",
    label: "고객등록 API",
    icon: CustomerApiIcon,
    // 어드민만 접근 가능
    canAccess: ({ role, isLoading }) => {
      if (isLoading) return false;
      return isAdmin(role);
    },
  },
];

