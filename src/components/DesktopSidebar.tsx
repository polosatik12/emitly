import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Newspaper, Calendar, MessageCircle, User, Bookmark, Settings, HelpCircle, FileText, DollarSign } from "lucide-react";
import RequisitesModal from "@/components/RequisitesModal";

const mainNav = [
  { path: "/news", label: "Главная", icon: Newspaper },
  { path: "/calendar", label: "Календарь", icon: Calendar },
  { path: "/chat", label: "Чат", icon: MessageCircle },
  { path: "/profile", label: "Профиль", icon: User },
  { path: "/saved-news", label: "Сохранённые", icon: Bookmark },
];

const bottomNav = [
  { path: "/settings", label: "Настройки", icon: Settings },
];

export default function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showRequisites, setShowRequisites] = useState(false);

  return (
    <aside className="w-[240px] shrink-0 border-r border-border bg-card h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center border-b border-border">
        <span className="text-xl font-bold tracking-[-0.02em]">
          <span className="text-primary">Emit</span>
          <span className="text-foreground">ly</span>
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {mainNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${
                isActive
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
              {item.label}
            </button>
          );
        })}

        <div className="h-px bg-border my-3" />

        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <HelpCircle className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
          Поддержка
        </button>
        <button
          onClick={() => navigate("/service-catalog")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <FileText className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
          Каталог услуг
        </button>
        <button
          onClick={() => setShowRequisites(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <DollarSign className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
          Реквизиты
        </button>
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1">
        {bottomNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${
                isActive
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
              {item.label}
            </button>
          );
        })}
      </div>
      <RequisitesModal open={showRequisites} onClose={() => setShowRequisites(false)} />
    </aside>
  );
}
