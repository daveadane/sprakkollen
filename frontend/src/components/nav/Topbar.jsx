import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { loadProgress } from "../../utils/progressStorage";
import useAuth from "../../state/useAuth";

function getTitle(pathname) {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/checker")) return "Checker";
  if (pathname.startsWith("/practice")) return "Practice";
  if (pathname.startsWith("/vocabulary")) return "Vocabulary";
  if (pathname.startsWith("/progress")) return "Progress";
  if (pathname.startsWith("/grammar")) return "Grammar";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/admin")) return "Admin";
  return "Språkkollen";
}

export default function Topbar() {
  const location = useLocation();
  const nav = useNavigate();
  const { user, ready, logout } = useAuth();

  const [p, setP] = useState(() => loadProgress());

  useEffect(() => {
    const refresh = () => setP(loadProgress());
    window.addEventListener("sprakkollen:progress-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("sprakkollen:progress-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const title = useMemo(() => getTitle(location.pathname), [location.pathname]);
  const xp = p?.xp ?? 0;

  const initial = (user?.first_name?.[0] || user?.email?.[0] || "U").toUpperCase();

  async function onLogout() {
    try {
      await logout();
    } finally {
      nav("/login", { replace: true });
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-black tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
            XP: {xp}
          </span>

          {!ready ? null : user ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:inline">
                {user.email}
              </span>

              <button
                onClick={onLogout}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
              >
                Logout
              </button>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-black text-white">
                {initial}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
