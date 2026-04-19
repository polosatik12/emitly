import { Outlet } from "react-router-dom";
import DesktopSidebar from "@/components/DesktopSidebar";
import StockLeadersWidget from "@/components/StockLeadersWidget";

export default function DesktopLayout() {
  return (
    <div className="flex min-h-screen bg-background w-full">
      <DesktopSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
      <StockLeadersWidget />
    </div>
  );
}
