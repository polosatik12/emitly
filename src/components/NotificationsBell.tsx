import { useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/useNotifications";
import NewsDetailDrawer from "@/components/NewsDetailDrawer";
import { getEmitterByTicker } from "@/data/emitters";

export default function NotificationsBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const handleClick = async (n: typeof notifications[number]) => {
    await markAsRead(n.id);
    setSelected(n);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Уведомления"
            className="relative w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors active:scale-93"
          >
            <Bell className="w-[18px] h-[18px] text-foreground" strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[360px] p-0 overflow-hidden bg-card border-border"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="text-[14px] font-semibold">Уведомления</div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[12px] text-primary hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Прочитать все
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[13px] text-muted-foreground">
                Подпишитесь на эмитентов, чтобы получать уведомления о новых новостях.
              </div>
            ) : (
              notifications.map((n) => {
                const emitter = getEmitterByTicker(n.ticker);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors ${
                      !n.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      {emitter?.logo ? (
                        <img
                          src={emitter.logo}
                          alt={n.ticker}
                          className="w-9 h-9 rounded-full object-cover bg-muted"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                          {n.ticker}
                        </div>
                      )}
                      {!n.isRead && (
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12px] font-semibold text-foreground">{n.ticker}</span>
                        <span className="text-[11px] text-muted-foreground">{n.date}</span>
                      </div>
                      <div className="text-[13px] text-foreground line-clamp-2 leading-snug">
                        {n.title}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {createPortal(
        <NewsDetailDrawer
          open={!!selected}
          onClose={() => setSelected(null)}
          news={selected}
        />,
        document.body
      )}
    </>
  );
}
