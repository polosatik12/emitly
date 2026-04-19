import { useTriggerCategories } from "@/hooks/useTriggerCategories";

interface Props {
  active: string | null; // code или null = «Все»
  onChange: (code: string | null) => void;
  variant?: "mobile" | "desktop";
}

/**
 * Чипсы фильтров по триггерам новостей.
 * Используются на главной ленте (мобайл и десктоп).
 */
export function TriggerChips({ active, onChange, variant = "mobile" }: Props) {
  const { categories } = useTriggerCategories();

  const baseClass =
    variant === "mobile"
      ? "px-3 py-[6px] text-[12px] font-medium rounded-full border transition-all duration-200 active:scale-[0.93] shrink-0"
      : "px-3.5 py-1.5 text-[12.5px] font-medium rounded-full border transition-all duration-200 hover:scale-[1.02] shrink-0";

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
      <button
        onClick={() => onChange(null)}
        className={`${baseClass} ${
          active === null
            ? "bg-foreground text-background border-foreground"
            : "bg-card text-muted-foreground border-border"
        }`}
      >
        Все
      </button>
      {categories.map((c) => {
        const isActive = active === c.code;
        return (
          <button
            key={c.code}
            onClick={() => onChange(isActive ? null : c.code)}
            className={`${baseClass}`}
            style={
              isActive
                ? { backgroundColor: c.color, color: "white", borderColor: c.color }
                : { borderColor: "hsl(var(--border))" }
            }
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
