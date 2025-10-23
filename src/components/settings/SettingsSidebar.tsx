import GeneralIcon from "./icons/GeneralIcon";
import ProfileIcon from "./icons/ProfileIcon";
import ConsultationChannelIcon from "./icons/ConsultationChannelIcon";
import MemberIcon from "./icons/MemberIcon";
import InvitedMemberIcon from "./icons/InvitedMemberIcon";
import TeamManagementIcon from "./icons/TeamManagementIcon";
import BatchRegistrationIcon from "./icons/BatchRegistrationIcon";

type SettingsTab = "general" | "profile" | "consultation-channel" | "member" | "invited-member" | "team-management" | "batch-registration";

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
    <div className="w-[280px] max-h-[530px] bg-white rounded-[14px] shadow-sm p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h2 className="text-[18px] font-bold text-[#252525] mb-1">서비스 설정</h2>
        <p className="text-[14px] text-[#808080]">거래소 텔레마케팅 관리</p>
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
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-[8px] text-left transition-colors ${
                isActive
                  ? "bg-[#E8F5E8] text-[#00C851]"
                  : "text-[#595959] hover:bg-[#F5F5F5]"
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
