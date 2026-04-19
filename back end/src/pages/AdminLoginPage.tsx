import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminGate } from "@/hooks/useAdminGate";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { unlock } = useAdminGate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as any)?.from || "/admin/sources";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-login", {
        body: { login: login.trim(), password },
      });
      if (error || !data?.success) {
        toast({
          title: "Доступ запрещён",
          description: data?.error || error?.message || "Неверный логин или пароль",
          variant: "destructive",
        });
        return;
      }
      unlock(data.token, data.expiresAt);
      toast({ title: "Доступ открыт", description: "Сессия админки активна 2 часа" });
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Вход в админ-панель</h1>
          <p className="text-xs text-muted-foreground">
            Закрытый раздел. Сессия действует 2 часа.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="admin-login">Логин</Label>
            <Input
              id="admin-login"
              type="text"
              autoComplete="off"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Пароль</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Проверка..." : "Войти"}
        </Button>

        <button
          type="button"
          onClick={() => navigate("/news")}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          ← На главную
        </button>
      </form>
    </div>
  );
}
