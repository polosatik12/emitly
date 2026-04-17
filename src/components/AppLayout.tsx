import { BottomTabBar } from "@/components/BottomTabBar";
import { Outlet } from "react-router-dom";
import DesktopSidebar from "@/components/DesktopSidebar";
import StockLeadersWidget from "@/components/StockLeadersWidget";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlanProvider } from "@/hooks/usePlan";
import TrialPaywallModal from "@/components/TrialPaywallModal";
import WelcomeModal from "@/components/WelcomeModal";
import PaymentSuccessModal from "@/components/PaymentSuccessModal";

export default function AppLayout() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <PlanProvider>
        <div className="bg-background min-h-screen">
          <Outlet />
          <BottomTabBar />
        </div>
        <WelcomeModal />
        <TrialPaywallModal />
        <PaymentSuccessModal />
      </PlanProvider>
    );
  }

  return (
    <PlanProvider>
      <div className="flex min-h-screen bg-background w-full">
        <DesktopSidebar />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
        <StockLeadersWidget />
      </div>
      <WelcomeModal />
      <TrialPaywallModal />
      <PaymentSuccessModal />
    </PlanProvider>
  );
}
