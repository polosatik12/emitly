import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseProxy";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowLeft, Send, Eye, EyeOff } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type Step = "form" | "otp-register" | "forgot-email" | "forgot-otp" | "forgot-newpass";

// Telegram Login Widget callback data
interface TelegramLoginData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [botId, setBotId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch bot username and render widget
  useEffect(() => {
    let mounted = true;
    const loadBot = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("telegram-widget-auth", {
          method: "GET",
        });
        if (!mounted) return;
        if (error) throw error;
        if (data?.bot_username) {
          setBotUsername(data.bot_username);
        }
        if (data?.bot_id) {
          setBotId(String(data.bot_id));
        }
      } catch (e) {
        console.warn("Failed to load Telegram bot info:", e);
      }
    };
    loadBot();
    return () => { mounted = false; };
  }, []);

  // Handle Telegram OAuth callback from URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("tgAuthResult=")) return;
    
    const params = new URLSearchParams(hash.slice(1));
    const resultStr = params.get("tgAuthResult");
    if (!resultStr) return;
    
    try {
      const user = JSON.parse(decodeURIComponent(resultStr));
      handleTelegramAuth(user);
      // Clean up URL
      window.history.replaceState(null, "", window.location.pathname);
    } catch (e) {
      console.error("Failed to parse Telegram auth result:", e);
    }
  }, []);

  // Define callback for Telegram auth data
  const handleTelegramAuth = useCallback(async (user: TelegramLoginData) => {
    setTgLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-widget-auth", {
        body: user,
      });
      if (error) throw new Error(error.message || "Telegram auth failed");

      const accessToken = data?.session?.access_token;
      const refreshToken = data?.session?.refresh_token;
      if (!accessToken || !refreshToken) {
        throw new Error("Сервер не вернул токены сессии");
      }

      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (setSessionError) throw setSessionError;

      toast.success("Вы вошли через Telegram");
      navigate("/news");
    } catch (err: any) {
      toast.error(err.message || "Ошибка авторизации через Telegram");
    } finally {
      setTgLoading(false);
    }
  }, [navigate]);

  const handleTelegramLogin = () => {
    if (!botId) {
      toast.error("Бот Telegram ещё загружается, попробуйте снова");
      return;
    }

    // Используем текущий origin — он должен быть добавлен в /setdomain у @BotFather.
    // Применяем return_to: Telegram редиректит сам попап на наш URL с tgAuthResult в hash,
    // а родительская страница (тоже на /auth) подхватит данные через storage event либо
    // мы прочитаем их прямо из попапа перед его закрытием.
    const currentOrigin = window.location.origin;
    const returnTo = `${currentOrigin}/auth`;

    const authUrl =
      `https://oauth.telegram.org/auth` +
      `?bot_id=${botId}` +
      `&origin=${encodeURIComponent(currentOrigin)}` +
      `&return_to=${encodeURIComponent(returnTo)}` +
      `&embed=0` +
      `&request_access=write`;

    const width = 550;
    const height = 470;
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);

    setTgLoading(true);

    const popup = window.open(
      authUrl,
      "telegram_auth",
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      setTgLoading(false);
      toast.error("Браузер заблокировал всплывающее окно. Разрешите попапы для этого сайта");
      return;
    }

    let handled = false;

    // Способ 1: postMessage (если Telegram пришлёт его с правильным origin)
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://oauth.telegram.org") return;
      let payload: any = event.data;
      if (typeof payload === "string") {
        try { payload = JSON.parse(payload); } catch { return; }
      }
      if (payload?.event === "auth_result" && payload.result) {
        handled = true;
        cleanup();
        try { popup.close(); } catch {}
        handleTelegramAuth(payload.result as TelegramLoginData);
      } else if (payload?.event === "unauthorized" || payload?.event === "auth_user_declined") {
        handled = true;
        cleanup();
        try { popup.close(); } catch {}
        toast.error("Авторизация в Telegram отменена");
      }
    };
    window.addEventListener("message", handleMessage);

    // Способ 2: читаем URL попапа (после return_to он будет на нашем домене с tgAuthResult)
    const urlPoll = setInterval(() => {
      if (handled) return;
      try {
        if (popup.closed) {
          cleanup();
          setTgLoading(false);
          return;
        }
        // same-origin доступ возможен только когда попап вернулся на наш домен
        const popupHref = popup.location.href;
        if (popupHref && popupHref.includes("tgAuthResult=")) {
          const hashStr = popup.location.hash.startsWith("#")
            ? popup.location.hash.slice(1)
            : popup.location.hash;
          const params = new URLSearchParams(hashStr);
          const resultStr = params.get("tgAuthResult");
          if (resultStr) {
            handled = true;
            try {
              // Telegram использует base64url-вариант, но также передаёт JSON в URI-encoded виде
              let decoded = decodeURIComponent(resultStr);
              // Если это base64 (без { в начале) — декодируем
              if (!decoded.trim().startsWith("{")) {
                const b64 = decoded.replace(/-/g, "+").replace(/_/g, "/");
                const padded = b64 + "===".slice((b64.length + 3) % 4);
                decoded = atob(padded);
              }
              const user = JSON.parse(decoded);
              cleanup();
              try { popup.close(); } catch {}
              handleTelegramAuth(user as TelegramLoginData);
            } catch (e) {
              console.error("Failed to parse tgAuthResult:", e);
              cleanup();
              try { popup.close(); } catch {}
              setTgLoading(false);
              toast.error("Не удалось обработать ответ Telegram");
            }
          }
        }
      } catch {
        // cross-origin — попап ещё на oauth.telegram.org, ждём
      }
    }, 400);

    function cleanup() {
      clearInterval(urlPoll);
      window.removeEventListener("message", handleMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        // Send OTP code via SMTP before registering
        const { data, error: otpError } = await supabase.functions.invoke("send-otp", {
          body: { email },
        });
        if (otpError) throw new Error(otpError.message || "Не удалось отправить код");
        if (data?.error) throw new Error(data.error);
        toast.success("Код отправлен на " + email);
        setStep("otp-register");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Вы успешно вошли");
        navigate("/news");
      }
    } catch (error: any) {
      toast.error(error.message || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 4) return;
    setLoading(true);

    try {
      // Verify OTP code via edge function
      const { data, error: verifyError } = await supabase.functions.invoke("verify-otp", {
        body: { email, code: otpCode },
      });
      if (verifyError) throw new Error(verifyError.message || "Ошибка проверки кода");
      if (data?.error) throw new Error(data.error);

      // Code verified — now register the user
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      if (error) throw error;
      toast.success("Регистрация завершена!");
      navigate("/news");
    } catch (error: any) {
      toast.error(error.message || "Неверный код");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const { data, error: otpError } = await supabase.functions.invoke("send-otp", {
        body: { email },
      });
      if (otpError) throw new Error(otpError.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Код отправлен повторно");
    } catch (error: any) {
      toast.error(error.message || "Не удалось отправить код");
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async () => {
    if (!email) {
      toast.error("Введите email");
      return;
    }
    setLoading(true);
    try {
      const { data, error: otpError } = await supabase.functions.invoke("send-otp", {
        body: { email },
      });
      if (otpError) throw new Error(otpError.message || "Не удалось отправить код");
      if (data?.error) throw new Error(data.error);
      toast.success("Код отправлен на " + email);
      setOtpCode("");
      setStep("forgot-otp");
    } catch (error: any) {
      toast.error(error.message || "Не удалось отправить код");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyForgotOtp = async () => {
    if (otpCode.length !== 4) return;
    setLoading(true);
    try {
      const { data, error: verifyError } = await supabase.functions.invoke("verify-otp", {
        body: { email, code: otpCode },
      });
      if (verifyError) throw new Error(verifyError.message || "Ошибка проверки кода");
      if (data?.error) throw new Error(data.error);
      // Re-issue a fresh code so reset-password edge function can verify it once more
      const { error: reErr } = await supabase.functions.invoke("send-otp", {
        body: { email },
      });
      if (reErr) throw new Error(reErr.message);
      toast.success("Код подтверждён. Проверьте почту — мы отправили новый одноразовый код для смены пароля");
      setOtpCode("");
      setStep("forgot-newpass");
    } catch (error: any) {
      toast.error(error.message || "Неверный код");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (otpCode.length !== 4) {
      toast.error("Введите 4-значный код из письма");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Пароль должен быть не менее 6 символов");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-password", {
        body: { email, code: otpCode, newPassword },
      });
      if (error) throw new Error(error.message || "Не удалось сменить пароль");
      if (data?.error) throw new Error(data.error);

      toast.success("Пароль обновлён. Выполняем вход…");
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: newPassword,
      });
      if (signInErr) {
        // Не критично — пусть пользователь войдёт сам
        setStep("form");
        setMode("login");
        setPassword("");
        setNewPassword("");
        setOtpCode("");
        toast.message("Войдите с новым паролем");
        return;
      }
      navigate("/news");
    } catch (error: any) {
      toast.error(error.message || "Ошибка смены пароля");
    } finally {
      setLoading(false);
    }
  };

  // ---- OTP for password reset (verification step) ----
  if (step === "forgot-otp") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-[400px]">
          <button
            onClick={() => { setStep("forgot-email"); setOtpCode(""); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>

          <div className="text-center mb-8">
            <div className="text-2xl font-bold mb-2">
              <span className="text-primary">Emit</span>
              <span className="text-foreground">ly</span>
            </div>
            <p className="text-muted-foreground">Введите код из письма</p>
            <p className="text-sm text-muted-foreground mt-1">
              Мы отправили 4-значный код на{" "}
              <span className="text-foreground font-medium">{email}</span>
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <InputOTP maxLength={4} value={otpCode} onChange={(v) => setOtpCode(v)}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <button
            onClick={handleVerifyForgotOtp}
            disabled={loading || otpCode.length !== 4}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Проверка..." : "Подтвердить"}
          </button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Не получили код?{" "}
            <button
              onClick={handleSendForgotOtp}
              disabled={loading}
              className="text-primary font-medium hover:underline disabled:opacity-50"
            >
              Отправить повторно
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ---- Set new password ----
  if (step === "forgot-newpass") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-[400px]">
          <button
            onClick={() => { setStep("forgot-otp"); setNewPassword(""); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>

          <div className="text-center mb-8">
            <div className="text-2xl font-bold mb-2">
              <span className="text-primary">Emit</span>
              <span className="text-foreground">ly</span>
            </div>
            <p className="text-muted-foreground">Новый пароль</p>
            <p className="text-sm text-muted-foreground mt-1">
              Введите новый код из письма и придумайте новый пароль для{" "}
              <span className="text-foreground font-medium">{email}</span>
            </p>
          </div>

          <div className="flex justify-center mb-4">
            <InputOTP maxLength={4} value={otpCode} onChange={(v) => setOtpCode(v)}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="relative mb-4">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="Новый пароль (минимум 6 символов)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              className="w-full bg-card border border-border rounded-xl pl-10 pr-11 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((v) => !v)}
              aria-label={showNewPassword ? "Скрыть пароль" : "Показать пароль"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleResetPassword}
            disabled={loading || otpCode.length !== 4 || newPassword.length < 6}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Сохранение..." : "Сменить пароль"}
          </button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Не получили код?{" "}
            <button
              onClick={handleSendForgotOtp}
              disabled={loading}
              className="text-primary font-medium hover:underline disabled:opacity-50"
            >
              Отправить повторно
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ---- Forgot password: enter email ----
  if (step === "forgot-email") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-[400px]">
          <button
            onClick={() => { setStep("form"); setOtpCode(""); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>

          <div className="text-center mb-8">
            <div className="text-2xl font-bold mb-2">
              <span className="text-primary">Emit</span>
              <span className="text-foreground">ly</span>
            </div>
            <p className="text-muted-foreground">Восстановление пароля</p>
            <p className="text-sm text-muted-foreground mt-1">
              Укажите email — мы пришлём 4-значный код для смены пароля
            </p>
          </div>

          <div className="relative mb-4">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>

          <button
            onClick={handleSendForgotOtp}
            disabled={loading || !email}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Отправка..." : "Отправить код"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "otp-register") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-[400px]">
          <button
            onClick={() => {
              setStep("form");
              setOtpCode("");
            }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>

          <div className="text-center mb-8">
            <div className="text-2xl font-bold mb-2">
              <span className="text-primary">Emit</span>
              <span className="text-foreground">ly</span>
            </div>
            <p className="text-muted-foreground">Введите код из письма</p>
            <p className="text-sm text-muted-foreground mt-1">
              Мы отправили 4-значный код на{" "}
              <span className="text-foreground font-medium">{email}</span>
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <InputOTP
              maxLength={4}
              value={otpCode}
              onChange={(value) => setOtpCode(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <button
            onClick={handleVerifyOtp}
            disabled={loading || otpCode.length !== 4}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Проверка..." : "Подтвердить"}
          </button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Не получили код?{" "}
            <button
              onClick={handleResendCode}
              disabled={loading}
              className="text-primary font-medium hover:underline disabled:opacity-50"
            >
              Отправить повторно
            </button>
          </p>
        </div>
      </div>
    );
  }

  const formContent = (
    <div className="w-full max-w-[400px]">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        На главную
      </button>

      <div className="text-center mb-8">
        <div className="text-3xl font-bold mb-2">
          <span className="text-primary">Emit</span>
          <span className="text-foreground">ly</span>
        </div>
        <p className="text-muted-foreground text-base">
          {mode === "login" ? "Войдите в аккаунт" : "Создайте аккаунт"}
        </p>
      </div>

      {/* Telegram Login Button */}
      <div className="mb-6">
        <button
          onClick={handleTelegramLogin}
          disabled={tgLoading || !botUsername}
          className="w-full flex items-center justify-center gap-2.5 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
        >
          <Send className="w-5 h-5" />
          {tgLoading ? "Авторизация..." : "Войти через Telegram"}
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">или</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Имя"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-11 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {mode === "login" && (
          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={() => { setStep("forgot-email"); setOtpCode(""); setNewPassword(""); }}
              className="text-xs text-primary font-medium hover:underline"
            >
              Забыли пароль?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading
            ? "Загрузка..."
            : mode === "login"
            ? "Войти"
            : "Зарегистрироваться"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="text-primary font-medium hover:underline"
        >
          {mode === "login" ? "Зарегистрироваться" : "Войти"}
        </button>
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left branding panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-accent to-primary/5 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        
        <div className="relative z-10 max-w-md text-center">
          <div className="text-5xl font-extrabold mb-6">
            <span className="text-primary">Emit</span>
            <span className="text-foreground">ly</span>
          </div>
          <p className="text-lg text-foreground/70 leading-relaxed mb-8">
            Аналитика российского фондового рынка, новости эмитентов и инструменты для инвесторов — всё в одном месте.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span>Аналитика</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <span>Новости</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span>Календарь</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {formContent}
      </div>
    </div>
  );
}
