import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getProgress as fetchProgress, normalizeProgress } from "../../utils/progressApi";
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

export default function Topbar({ onMenuOpen }) {
  const location = useLocation();
  const nav = useNavigate();
  const { user, ready, logout } = useAuth();

  // ✅ correct state name
  const [p, setP] = useState(() => normalizeProgress(null));

  // ✅ only try progress when logged in
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!user) return;
      try {
        const data = await fetchProgress();
        if (alive) setP(normalizeProgress(data));
      } catch {
        // backend down or unauthorized -> keep defaults
      }
    })();

    return () => {
      alive = false;
    };
  }, [user]);

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
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuOpen}
            className="md:hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-black tracking-tight text-slate-800">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="rounded-xl px-3 py-1.5 text-sm font-bold"
            style={{ background: "linear-gradient(135deg,#006AA7,#004f80)", color: "#FECC00" }}
          >
            ⚡ {xp} XP
          </span>

          {!ready ? null : user ? (
            <>
              <span className="hidden text-sm font-medium text-slate-500 sm:inline">{user.email}</span>

              <button
                onClick={onLogout}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Logout
              </button>

              <div
                className="flex h-9 w-9 items-center justify-center rounded-full font-black text-white text-sm"
                style={{ background: "linear-gradient(135deg,#006AA7,#004f80)" }}
              >
                {initial}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition"
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
