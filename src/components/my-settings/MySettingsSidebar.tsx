import ProfileIcon from "./icons/ProfileIcon";
import NotificationIcon from "./icons/NotificationIcon";
import SecurityIcon from "./icons/SecurityIcon";

type MySettingsTab = "profile" | "notification" | "security";

interface MySettingsSidebarProps {
  activeTab: MySettingsTab;
  onTabChange: (tab: MySettingsTab) => void;
}

const SIDEBAR_ITEMS = [
  {
    key: "profile" as const,
    label: "프로필",
    icon: ProfileIcon,
  },
  {
    key: "notification" as const,
    label: "알림",
    icon: NotificationIcon,
  },
  {
    key: "security" as const,
    label: "보안",
    icon: SecurityIcon,
  },
];

export default function MySettingsSidebar({ activeTab, onTabChange }: MySettingsSidebarProps) {
  return (
    <div className="w-[280px] max-h-[530px] bg-card rounded-[14px] shadow-sm p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h2 className="text-[18px] font-bold text-foreground mb-1">개인 설정</h2>
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
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-[8px] text-left transition-colors ${
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

