// src/pages/app/AdminPage.jsx
import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

function fmt(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [cache, setCache] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      // Matches your backend admin.py exactly:
      // GET /api/admin/users
      // GET /api/admin/admin/cache-stats
      const [u, c] = await Promise.all([
        apiFetch("/admin/users"),
        apiFetch("/admin/admin/cache-stats"),
      ]);
      setUsers(u || []);
      setCache(c || null);
    } catch (e) {
      console.error("Admin load error:", e);
      if (e?.status === 401 || e?.status === 403) {
        setErr("Admin access required (401/403).");
      } else {
        setErr(e?.message || "Failed to load admin data.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRole(user) {
    setErr("");
    try {
      const updated = await apiFetch(`/admin/users/${user.id}/role`, {
        method: "PATCH",
        body: { is_admin: !user.is_admin },
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch (e) {
      console.error("Role update error:", e);
      setErr(e?.message || "Failed to update role.");
    }
  }

  async function removeUser(user) {
    const ok = confirm(`Delete ${user.email}? This cannot be undone.`);
    if (!ok) return;

    setErr("");
    try {
      await apiFetch(`/admin/users/${user.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (e) {
      console.error("Delete user error:", e);
      setErr(e?.message || "Failed to delete user.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Admin</h1>
          <p className="mt-2 text-slate-600">
            Manage users + view lookup cache stats.
          </p>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </header>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700">{err}</p>
        </div>
      )}

      {/* Summary */}
      <section className="grid gap-4 md:grid-cols-4">
        <Card title="Total users">
          <Big>{users.length}</Big>
        </Card>

        <Card title="Cache entries">
          <Big>{cache?.total_entries ?? "—"}</Big>
        </Card>

        <Card title="Cache TTL (min)">
          <Big>{cache?.ttl_minutes ?? "—"}</Big>
        </Card>

        <Card title="Cache fresh/expired">
          <p className="text-lg font-black text-slate-900">
            {cache?.fresh_entries ?? "—"} / {cache?.expired_entries ?? "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">fresh / expired</p>
        </Card>
      </section>

      {/* Cache details */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black">Lookup cache</h2>
        <p className="mt-1 text-sm text-slate-600">
          Oldest/newest cache update timestamps.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Mini label="Oldest entry" value={fmt(cache?.oldest_entry)} />
          <Mini label="Newest entry" value={fmt(cache?.newest_entry)} />
        </div>
      </section>

      {/* Users table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black">Users</h2>
        <p className="mt-1 text-sm text-slate-600">
          Promote/demote admins. Delete users carefully.
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <Th>ID</Th>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Created</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {u.id}
                    </td>

                    <td className="px-4 py-3 text-slate-900">
                      {(u.first_name || u.last_name)
                        ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                        : "—"}
                    </td>

                    <td className="px-4 py-3 text-slate-900">{u.email}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                          u.is_admin
                            ? "bg-purple-100 text-purple-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {u.is_admin ? "Admin" : "User"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {fmt(u.created_at)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleRole(u)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-900 hover:bg-slate-50"
                        >
                          {u.is_admin ? "Demote" : "Promote"}
                        </button>

                        <button
                          onClick={() => removeUser(u)}
                          className="rounded-xl border border-red-200 bg-white px-3 py-2 font-bold text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Big({ children }) {
  return <p className="text-4xl font-black text-slate-900">{children}</p>;
}

function Mini({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-4 py-3 text-xs font-semibold text-slate-600 ${className}`}>
      {children}
    </th>
  );
}