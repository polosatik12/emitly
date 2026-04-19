import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Newspaper, Calendar, MessageCircle, User, Bookmark, Settings, HelpCircle, FileText, DollarSign, Shield } from "lucide-react";
import RequisitesModal from "@/components/RequisitesModal";
import NotificationsBell from "@/components/NotificationsBell";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type NavItem = {
  path?: string;
  label: string;
  icon: typeof Newspaper;
  onClick?: () => void;
  badge?: string;
};

export default function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showRequisites, setShowRequisites] = useState(false);
  const { isAdmin } = useIsAdmin();

  const topNav: NavItem[] = [
    { path: "/news", label: "Главная", icon: Newspaper },
    { path: "/calendar", label: "Календарь", icon: Calendar, badge: "Beta" },
    { path: "/saved-news", label: "Сохранённые", icon: Bookmark },
  ];

  const middleNav: NavItem[] = [
    { path: "/service-catalog", label: "Каталог услуг", icon: FileText },
    ...(isAdmin
      ? [{ path: "/admin/sources", label: "Админ: источники", icon: Shield } as NavItem]
      : []),
  ];

  const bottomNav: NavItem[] = [
    { path: "/chat", label: "Чат", icon: MessageCircle },
    { label: "Поддержка", icon: HelpCircle, onClick: () => window.open("mailto:support@emitly.ru", "_blank") },
    { path: "/profile", label: "Профиль", icon: User },
    { path: "/settings", label: "Настройки", icon: Settings },
  ];

  const renderItem = (item: NavItem) => {
    const isActive = item.path ? location.pathname === item.path : false;
    return (
      <button
        key={item.label}
        onClick={() => (item.path ? navigate(item.path) : item.onClick?.())}
        title={item.label}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors xl:justify-start justify-center ${
          isActive
            ? "bg-accent text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
        <span className="flex-1 text-left hidden xl:inline">{item.label}</span>
        {item.badge && (
          <span className="hidden xl:inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/15 text-primary leading-none">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-[68px] xl:w-[240px] shrink-0 border-r border-border bg-card h-screen sticky top-0 flex flex-col transition-[width] duration-200">
      {/* Logo + Notifications */}
      <div className="px-3 xl:px-5 h-16 flex items-center justify-between border-b border-border">
        <div
          className="flex items-center cursor-pointer flex-1 xl:justify-start justify-center"
          onClick={() => navigate("/news")}
          title="Emitly"
        >
          {/* Collapsed (tablet): green E badge */}
          <span className="xl:hidden w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-base font-bold">
            E
          </span>
          {/* Expanded (desktop): full Emitly wordmark */}
          <span className="hidden xl:inline text-xl font-bold tracking-[-0.02em]">
            <span className="text-primary">Emit</span>
            <span className="text-foreground">ly</span>
          </span>
        </div>
        <div className="hidden xl:block shrink-0">
          <NotificationsBell />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 xl:px-3 py-4 space-y-1 overflow-y-auto">
        {topNav.map(renderItem)}

        <div className="h-px bg-border my-3" />

        {middleNav.map(renderItem)}

        <div className="h-px bg-border my-3" />

        {bottomNav.map(renderItem)}
      </nav>

      <RequisitesModal open={showRequisites} onClose={() => setShowRequisites(false)} />
    </aside>
  );
}
