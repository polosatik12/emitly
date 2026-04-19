import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, MessageCircle, Newspaper } from "lucide-react";

const tabs = [
  { path: "/calendar", label: "Календарь", icon: Calendar },
  { path: "/chat", label: "Чат", icon: MessageCircle },
  { path: "/", label: "Новости", icon: Newspaper },
];

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around h-[52px] z-50 max-w-lg md:max-w-3xl mx-auto">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center gap-[1px] w-full h-full transition-all duration-200 active:scale-90 ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <tab.icon className={`w-[20px] h-[20px] transition-transform duration-200 ${isActive ? "animate-tab-pulse" : ""}`} strokeWidth={isActive ? 2.2 : 1.6} />
            <span className={`text-[10px] leading-tight transition-all duration-200 ${isActive ? "font-semibold" : "font-medium"}`}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
