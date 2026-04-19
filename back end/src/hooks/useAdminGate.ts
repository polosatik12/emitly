import { useEffect, useState } from "react";

const KEY = "emitly_admin_gate_v1";

interface GateData {
  token: string;
  expiresAt: number;
}

function read(): GateData | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GateData;
    if (!parsed?.token || !parsed?.expiresAt) return null;
    if (Date.now() >= parsed.expiresAt) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function useAdminGate() {
  const [unlocked, setUnlocked] = useState<boolean>(() => !!read());

  useEffect(() => {
    const onStorage = () => setUnlocked(!!read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const unlock = (token: string, expiresAt: number) => {
    sessionStorage.setItem(KEY, JSON.stringify({ token, expiresAt }));
    setUnlocked(true);
  };

  const lock = () => {
    sessionStorage.removeItem(KEY);
    setUnlocked(false);
  };

  return { unlocked, unlock, lock };
}
