import { Coins, Users, CalendarDays, FileText, TrendingUp } from "lucide-react";

const badgeConfig: Record<string, { bg: string; text: string; icon?: React.ReactNode }> = {
  "Событие": {
    bg: "bg-accent",
    text: "text-accent-foreground",
    icon: <CalendarDays className="w-[10px] h-[10px]" strokeWidth={2} />,
  },
  "Сделка": {
    bg: "bg-[hsl(var(--badge-deal)/0.15)]",
    text: "text-[hsl(var(--badge-deal))]",
    icon: <TrendingUp className="w-[10px] h-[10px]" strokeWidth={2} />,
  },
  "Собрание": {
    bg: "bg-[hsl(var(--badge-deal)/0.15)]",
    text: "text-[hsl(var(--badge-deal))]",
    icon: <Users className="w-[10px] h-[10px]" strokeWidth={2} />,
  },
  "Дивиденды": {
    bg: "bg-accent",
    text: "text-accent-foreground",
    icon: <Coins className="w-[10px] h-[10px]" strokeWidth={2} />,
  },
  "Отчёты": {
    bg: "bg-[hsl(var(--news-blue-soft))]",
    text: "text-[hsl(var(--news-blue))]",
    icon: <FileText className="w-[10px] h-[10px]" strokeWidth={2} />,
  },
};

export function CategoryBadge({ category }: { category: string }) {
  const config = badgeConfig[category] || { bg: "bg-muted", text: "text-muted-foreground" };
  return (
    <span className={`inline-flex items-center gap-[3px] px-2 py-[2.5px] rounded-full text-[10.5px] font-semibold leading-none ${config.bg} ${config.text}`}>
      {config.icon}
      {category}
    </span>
  );
}
