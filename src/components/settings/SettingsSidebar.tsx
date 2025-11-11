import GeneralIcon from "./icons/GeneralIcon";
import ProfileIcon from "./icons/ProfileIcon";
import ConsultationChannelIcon from "./icons/ConsultationChannelIcon";
import MemberIcon from "./icons/MemberIcon";
import InvitedMemberIcon from "./icons/InvitedMemberIcon";
import TeamManagementIcon from "./icons/TeamManagementIcon";
import CustomerApiIcon from "./icons/CustomerApiIcon";
import BatchRegistrationIcon from "./icons/BatchRegistrationIcon";

type SettingsTab =
  | "general"
  | "profile"
  | "consultation-channel"
  | "member"
  | "invited-member"
  | "customer-api"
  | "team-management"
  | "batch-registration";

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

const SIDEBAR_ITEMS = [
  {
    key: "general" as const,
    label: "일반",
    icon: GeneralIcon,
  },
  {
    key: "profile" as const,
    label: "프로필",
    icon: ProfileIcon,
  },
  {
    key: "consultation-channel" as const,
    label: "상담채널",
    icon: ConsultationChannelIcon,
  },
  {
    key: "member" as const,
    label: "멤버",
    icon: MemberIcon,
  },
  {
    key: "customer-api" as const,
    label: "고객등록 API",
    icon: CustomerApiIcon,
  },
  {
    key: "invited-member" as const,
    label: "초대중인 멤버",
    icon: InvitedMemberIcon,
  },
  {
    key: "team-management" as const,
    label: "팀관리",
    icon: TeamManagementIcon,
  },
  {
    key: "batch-registration" as const,
    label: "일괄 등록 이력",
    icon: BatchRegistrationIcon,
  },
];

export default function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <div className="w-[280px] max-h-[530px] bg-card rounded-[14px] shadow-sm py-6">
      {/* 헤더 */}
      <div className="px-7 pb-8 mb-1 border-b border-[#E2E2E266]">
        <h2 className="text-[18px] font-bold text-foreground mb-1">프로젝트 설정</h2>
        <p className="text-[14px] text-neutral-60">거래소 텔레마케팅 관리</p>
      </div>

      {/* 탭 목록 */}
      <nav className="space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.key;
          
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`cursor-pointer w-full flex items-center gap-3 px-8 py-3 text-left transition-colors ${
                isActive
                  ? "bg-primary-10 text-primary-80"
                  : "text-neutral-70 hover:bg-neutral-10"
              }`}
            >
              <IconComponent isActive={isActive} />
              <span className="text-[14px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
