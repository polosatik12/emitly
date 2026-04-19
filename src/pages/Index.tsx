import { Navigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import NewsPage from "@/pages/NewsPage";
import LandingPage from "@/pages/LandingPage";
import { BottomTabBar } from "@/components/BottomTabBar";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";

const Index = () => {
  const isMobile = useIsMobile();
  const { session, loading, isTelegram, error } = useTelegramAuth();

  if (isTelegram && loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Авторизация через Telegram...</p>
        </div>
      </div>
    );
  }

  if (isTelegram && !loading && !session) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-6 text-center">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-foreground">Не удалось войти через Telegram</h1>
          <p className="text-sm text-muted-foreground">
            {error || "Открой мини-апп через кнопку бота и попробуй снова."}
          </p>
        </div>
      </div>
    );
  }

  if (isMobile || isTelegram) {
    return (
      <div className="bg-background min-h-screen">
        <NewsPage />
        <BottomTabBar />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/news" replace />;
  }

  return <LandingPage />;
};

export default Index;
