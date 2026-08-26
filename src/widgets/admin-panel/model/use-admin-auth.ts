import { useEffect, useState } from "react";

export type AuthViewState = { mode: "loading" } | { mode: "login" } | { mode: "ready" } | { mode: "error"; message: string };

export function useAdminAuth(loadAllAdminData: () => Promise<void>) {
  const [authView, setAuthView] = useState<AuthViewState>({ mode: "loading" });
  const [currentAdmin, setCurrentAdmin] = useState<{ name: string; email: string } | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function checkSessionAndLoad() {
    setAuthView({ mode: "loading" });
    try {
      const res = await fetch("/api/admin/session");
      if (!res.ok) throw new Error("Session check failed");
      const { authenticated, admin } = (await res.json()) as {
        authenticated: boolean;
        admin: { name: string; email: string } | null;
      };

      if (!authenticated) {
        setAuthView({ mode: "login" });
        return;
      }

      setCurrentAdmin(admin);
      await loadAllAdminData();
      setAuthView({ mode: "ready" });
    } catch {
      setAuthView({
        mode: "error",
        message: "Не удалось загрузить админ-панель. Проверьте соединение и попробуйте снова."
      });
    }
  }

  useEffect(() => {
    void checkSessionAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        setLoginError("Неверный email или пароль.");
        return;
      }

      const { admin } = (await res.json()) as { admin: { name: string; email: string } };
      setCurrentAdmin(admin);

      setPassword("");
      await loadAllAdminData();
      setAuthView({ mode: "ready" });
    } catch {
      setLoginError("Не удалось войти. Проверьте соединение и попробуйте снова.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setCurrentAdmin(null);
    setAuthView({ mode: "login" });
  };

  return {
    authView,
    currentAdmin,
    email,
    setEmail,
    password,
    setPassword,
    loginError,
    isLoggingIn,
    checkSessionAndLoad,
    handleLogin,
    handleLogout
  };
}
