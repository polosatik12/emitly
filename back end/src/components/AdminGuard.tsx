import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminGate } from "@/hooks/useAdminGate";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { unlocked } = useAdminGate();
  const location = useLocation();

  if (!unlocked) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
