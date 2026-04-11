import { BottomTabBar } from "@/components/BottomTabBar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="bg-background min-h-screen">
      <Outlet />
      <BottomTabBar />
    </div>
  );
}