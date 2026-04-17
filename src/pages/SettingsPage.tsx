import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Loader2, Bell, Mail, Send, Globe, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabaseProxy";
import { toast } from "sonner";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notifyTg, setNotifyTg] = useState(true);
  const [notifyWeb, setNotifyWeb] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, phone, notify_telegram, notify_web, notify_email")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!mounted) return;
      setName(profile?.display_name?.trim() || "");
      setPhone(profile?.phone ?? "");
      const p: any = profile ?? {};
      setNotifyTg(p.notify_telegram ?? true);
      setNotifyWeb(p.notify_web ?? true);
      setNotifyEmail(p.notify_email ?? false);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: userId,
          display_name: name.trim() || null,
          phone: phone.trim() || null,
          notify_telegram: notifyTg,
          notify_web: notifyWeb,
          notify_email: notifyEmail,
        } as any, { onConflict: "user_id" });

      if (error) throw error;
      toast.success("Данные сохранены");
    } catch (err: any) {
      console.error("Save settings error:", err);
      toast.error("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto pb-[60px] bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <button onClick={() => navigate("/profile")} className="p-1 active:scale-95 transition-transform">
          <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.2} />
        </button>
        <h1 className="text-[17px] font-bold text-foreground">Настройки</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Личные данные */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-[16px] font-bold text-foreground">Личные данные</h2>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Эти данные необязательны и используются для персонализации
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              <div className="mt-5">
                <label className="text-[14px] font-semibold text-foreground">ФИО</label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                  <User className="h-[18px] w-[18px] text-muted-foreground shrink-0" strokeWidth={1.8} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Иванов Иван Иванович"
                    className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-[14px] font-semibold text-foreground">Телефон</label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                  <Phone className="h-[18px] w-[18px] text-muted-foreground shrink-0" strokeWidth={1.8} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                    className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
                    maxLength={20}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Уведомления */}
        {!loading && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-foreground" />
              <h2 className="text-[16px] font-bold text-foreground">Уведомления</h2>
            </div>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              Куда присылать новости по подписанным эмитентам
            </p>

            <div className="mt-4 space-y-2">
              <NotifyRow icon={<Send className="h-4 w-4 text-primary" />} label="Telegram" hint="Бот @emitly_bot" value={notifyTg} onChange={setNotifyTg} />
              <NotifyRow icon={<Globe className="h-4 w-4 text-primary" />} label="На сайте" hint="In-app пуши" value={notifyWeb} onChange={setNotifyWeb} />
              <NotifyRow icon={<Mail className="h-4 w-4 text-primary" />} label="Email" hint="Письма от support@emitly.ru" value={notifyEmail} onChange={setNotifyEmail} />
            </div>
          </div>
        )}

        {/* Мои источники */}
        <button
          onClick={() => navigate("/sources")}
          className="w-full flex items-center justify-between rounded-2xl border border-border bg-card p-5 active:scale-[0.99] hover:border-foreground/20 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-semibold text-foreground">Мои источники</p>
              <p className="text-[12.5px] text-muted-foreground">Выбрать источники в рамках тарифа</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="w-full rounded-xl bg-primary py-3.5 text-[15px] font-semibold text-primary-foreground active:scale-[0.97] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
}

function NotifyRow({ icon, label, hint, value, onChange }: {
  icon: React.ReactNode; label: string; hint: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-foreground">{label}</p>
          <p className="text-[12px] text-muted-foreground truncate">{hint}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
