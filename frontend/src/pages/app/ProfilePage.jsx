import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import { getAccessToken, clearAccessToken } from "../../state/auth_store";
import { useNavigate } from "react-router-dom";

const LEVELS = [
  { value: "beginner", label: "Beginner", desc: "A1–A2", ring: "ring-green-400", bg: "bg-green-50", text: "text-green-700", badge: "bg-green-100 text-green-700" },
  { value: "intermediate", label: "Intermediate", desc: "B1–B2", ring: "ring-blue-400", bg: "bg-blue-50", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
  { value: "advanced", label: "Advanced", desc: "C1+", ring: "ring-purple-400", bg: "bg-purple-50", text: "text-purple-700", badge: "bg-purple-100 text-purple-700" },
];

export default function ProfilePage() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [levelSaving, setLevelSaving] = useState(false);

  const loadMe = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const data = await apiFetch("/auth/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMe(data);
    } catch {
      clearAccessToken();
      setMe(null);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  async function changeLevel(level) {
    if (levelSaving || level === me?.level) return;
    setLevelSaving(true);
    try {
      await apiFetch("/auth/me", { method: "PATCH", body: { level } });
      setMe((prev) => ({ ...prev, level }));
    } finally {
      setLevelSaving(false);
    }
  }

  async function onLogout() {
    const token = getAccessToken();
    try {
      if (token) {
        await apiFetch("/auth/logout", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // ignore
    } finally {
      clearAccessToken();
      navigate("/login");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <h1 className="text-4xl font-black tracking-tight">Profile</h1>
        <p className="text-slate-600">Loading profile…</p>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <h1 className="text-4xl font-black tracking-tight">Profile</h1>
        <p className="text-red-600">Not logged in.</p>
      </div>
    );
  }

  const currentLevel = LEVELS.find((l) => l.value === me.level) || LEVELS[0];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header>
        <h1 className="text-4xl font-black tracking-tight">Profile</h1>
      </header>

      {/* Level selector */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Swedish Level</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${currentLevel.badge}`}>
            {currentLevel.label} · {currentLevel.desc}
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Your level adjusts the difficulty of grammar questions, book quizzes, and more.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {LEVELS.map((lvl) => {
            const isActive = me.level === lvl.value;
            return (
              <button
                key={lvl.value}
                onClick={() => changeLevel(lvl.value)}
                disabled={levelSaving}
                className={[
                  "rounded-xl border-2 p-4 text-center transition",
                  isActive
                    ? `${lvl.ring} ring-2 ${lvl.bg} ${lvl.text} border-transparent`
                    : "border-slate-200 hover:border-slate-300 text-slate-700",
                  levelSaving ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
              >
                <p className="font-black text-sm">{lvl.label}</p>
                <p className="text-xs mt-0.5 opacity-70">{lvl.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Account info */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold mb-4">Account</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Info label="Email" value={me.email} />
          <Info label="User ID" value={me.id} />
          <Info label="First name" value={me.first_name || "—"} />
          <Info label="Last name" value={me.last_name || "—"} />
          <Info
            label="Member since"
            value={me.created_at ? new Date(me.created_at).toLocaleDateString("sv-SE") : "—"}
          />
          <Info label="Admin" value={me.is_admin ? "Yes" : "No"} />
        </div>
      </section>

      {/* Actions */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold mb-4">Actions</h2>
        <button
          onClick={onLogout}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-800 hover:bg-slate-50"
        >
          Logout
        </button>
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900 wrap-break-word">{value}</p>
    </div>
  );
}
