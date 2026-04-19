import { useNavigate } from "react-router-dom";

interface Props {
  size?: "sm" | "md";
  label?: string;
  /** Компактный режим: маленький кружок без подписи (для встраивания в шапку) */
  compact?: boolean;
}

/**
 * Круглая кнопка «Гренландия» — визуально как эмитент в подписках,
 * но ведёт на /news/greenland (новости по Гренландии).
 */
export function GreenlandCircle({ size = "md", label = "Гренландия", compact = false }: Props) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <button
        onClick={() => navigate("/news/greenland")}
        className="shrink-0 active:scale-95 transition-transform"
        aria-label="Новости по Гренландии"
      >
        <div className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-br from-[#D00C33] via-[#E63950] to-[#A30922]">
          <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden border border-background">
            <span className="text-[16px] leading-none" role="img" aria-label="Флаг Гренландии">
              🇬🇱
            </span>
          </div>
        </div>
      </button>
    );
  }

  const ringSize = "w-[44px] h-[44px]";
  const flagSize = "text-[20px]";
  const labelSize = "text-[9px]";

  return (
    <button
      onClick={() => navigate("/news/greenland")}
      className="flex flex-col items-center gap-1 shrink-0 active:scale-95 transition-transform"
      aria-label="Новости по Гренландии"
    >
      <div className={`${ringSize} rounded-full p-[2.5px] bg-gradient-to-br from-[#D00C33] via-[#E63950] to-[#A30922]`}>
        <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden border-2 border-background">
          <span className={`${flagSize} leading-none`} role="img" aria-label="Флаг Гренландии">
            🇬🇱
          </span>
        </div>
      </div>
      <span className={`${labelSize} font-medium text-muted-foreground truncate max-w-[70px]`}>
        {label}
      </span>
    </button>
  );
}
