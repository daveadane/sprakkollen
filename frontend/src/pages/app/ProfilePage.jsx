import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import { getAccessToken, clearAccessToken } from "../../state/auth_store";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function loadMe() {
    const token = getAccessToken();
    if (!token) {
      // Not logged in -> go to login (or show message)
      navigate("/login");
      return;
    }

    try {
      setErr("");
      setLoading(true);

      const data = await apiFetch("/auth/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      setMe(data);
    } catch (e) {
      // If token is invalid/expired, logout locally
      clearAccessToken();
      setMe(null);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLogout() {
    const token = getAccessToken();
    try {
      if (token) {
        await apiFetch("/auth/logout", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (_) {
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
        <p className="text-red-600">{err || "Not logged in."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header>
        <h1 className="text-4xl font-black tracking-tight">Profile</h1>
        <p className="mt-2 text-slate-600">
          Backend profile (from database via <code>/auth/me</code>)
        </p>
      </header>

      {/* User card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Account</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Info label="Email" value={me.email} />
          <Info label="User ID" value={me.id} />
          <Info label="First name" value={me.first_name || "—"} />
          <Info label="Last name" value={me.last_name || "—"} />
          <Info label="Admin" value={me.is_admin ? "Yes" : "No"} />
          <Info label="Active" value={me.is_active ? "Yes" : "No"} />
          <Info
            label="Created at"
            value={me.created_at ? new Date(me.created_at).toLocaleDateString("sv-SE") : "—"}
          />
        </div>
      </section>

      {/* Actions */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Actions</h2>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onLogout}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-800 hover:bg-slate-50"
          >
            Logout
          </button>

          <button
            onClick={loadMe}
            className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 font-bold text-slate-700 hover:bg-slate-200"
          >
            Refresh
          </button>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900 break-words">{value}</p>
    </div>
  );
}

