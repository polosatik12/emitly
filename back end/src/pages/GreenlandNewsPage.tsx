import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { greenlandNews } from "@/data/greenlandNews";
import { CategoryBadge } from "@/components/CategoryBadge";

export default function GreenlandNewsPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[860px] mx-auto py-6 px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate("/news")}
          className="p-2 -ml-2 rounded-full hover:bg-muted active:scale-95 transition-all"
          aria-label="Назад"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={2.2} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-br from-[#D00C33] via-white to-[#D00C33]">
            <div className="w-full h-full rounded-full bg-card flex items-center justify-center border-2 border-background">
              <span className="text-[22px] leading-none" role="img" aria-label="Флаг Гренландии">🇬🇱</span>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">Гренландия</h1>
            <p className="text-xs text-muted-foreground">Новости и события острова</p>
          </div>
        </div>
      </div>

      {/* News list */}
      <div className="space-y-3">
        {greenlandNews.map((item) => (
          <article
            key={item.id}
            className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <CategoryBadge category={item.category} />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" strokeWidth={1.8} />
                <span className="text-xs">{item.date}</span>
              </div>
            </div>
            <h2 className="text-base font-semibold text-foreground leading-snug mb-2">
              {item.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {item.bodyText}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Источник: <span className="font-medium text-foreground">{item.source}</span></span>
              <span>{item.fullDate}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
