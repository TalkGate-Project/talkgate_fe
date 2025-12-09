import ProfileIcon from "./icons/ProfileIcon";
import NotificationIcon from "./icons/NotificationIcon";
import BillingIcon from "./icons/BillingIcon";
import SecurityIcon from "./icons/SecurityIcon";

type MySettingsTab = "profile" | "notification" | "billing" | "security";

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
    key: "billing" as const,
    label: "구독관리",
    icon: BillingIcon,
  },
  {
    key: "security" as const,
    label: "보안",
    icon: SecurityIcon,
  },
];

export default function MySettingsSidebar({ activeTab, onTabChange }: MySettingsSidebarProps) {
  return (
    <div className="w-[280px] max-h-[362px] bg-card rounded-[14px]">
      {/* 헤더 */}
      <div className="mb-2 border-b border-border opacity-70 p-7">
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
              className={`cursor-pointer w-full flex items-center gap-3 px-[30px] py-[14px] text-left transition-colors ${
                isActive
                  ? "bg-primary-10/30 text-primary-60"
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

