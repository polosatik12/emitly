import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Index from "@/pages/Index";
import AuthPage from "@/pages/AuthPage";
import NewsPage from "@/pages/NewsPage";
import DesktopNewsPage from "@/pages/DesktopNewsPage";
import ChatPage from "@/pages/ChatPage";
import CalendarPage from "@/pages/CalendarPage";
import ProfilePage from "@/pages/ProfilePage";
import SavedNewsPage from "@/pages/SavedNewsPage";
import SettingsPage from "@/pages/SettingsPage";
import ServiceCatalogPage from "@/pages/ServiceCatalogPage";
import EmitterProfilePage from "@/pages/EmitterProfilePage";
import NotFound from "./pages/NotFound.tsx";
import { useIsMobile } from "@/hooks/use-mobile";

const queryClient = new QueryClient();

function AdaptiveNewsPage() {
  const isMobile = useIsMobile();
  return isMobile ? <NewsPage /> : <DesktopNewsPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<AppLayout />}>
        <Route path="/news" element={<AdaptiveNewsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/saved-news" element={<SavedNewsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/service-catalog" element={<ServiceCatalogPage />} />
        <Route path="/emitter/:ticker" element={<EmitterProfilePage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;