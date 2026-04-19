import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  source?: string | null;
}

/**
 * Прозрачный оверлей поверх карточки новости из недоступного источника.
 * Сама карточка сильно блюрится (через filter blur на родителе).
 */
export function LockedNewsOverlay({ source }: Props) {
  const navigate = useNavigate();
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-background/40 backdrop-blur-[2px] cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        navigate("/service-catalog");
      }}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-card border border-border shadow-sm">
        <Lock className="h-4 w-4 text-foreground" strokeWidth={2.2} />
      </div>
      <p className="text-[12px] font-semibold text-foreground text-center px-4 max-w-[260px] leading-tight">
        {source ? <>Источник <span className="text-primary">{source}</span> доступен на другом тарифе</> : "Подключите тариф, чтобы читать"}
      </p>
      <span className="text-[11px] font-medium text-primary underline">Сменить тариф</span>
    </div>
  );
}
