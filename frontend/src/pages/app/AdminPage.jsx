import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../utils/api";

function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d.getTime()) ? String(s) : d.toLocaleString();
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  const [errUsers, setErrUsers] = useState("");
  const [errStats, setErrStats] = useState("");

  const [busyUserId, setBusyUserId] = useState(null);

  async function loadUsers() {
    setLoadingUsers(true);
    setErrUsers("");
    try {
      const data = await apiFetch("/admin/users", { method: "GET" });
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e?.status === 403) setErrUsers("Forbidden: Admin only.");
      else if (e?.status === 401) setErrUsers("Unauthorized: Please login.");
      else setErrUsers(e?.message || "Failed to load users.");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadStats() {
    setLoadingStats(true);
    setErrStats("");
    try {
      // NOTE: your backend route is /admin/admin/cache-stats
      const data = await apiFetch("/admin/admin/cache-stats", { method: "GET" });
      setStats(data);
    } catch (e) {
      if (e?.status === 403) setErrStats("Forbidden: Admin only.");
      else if (e?.status === 401) setErrStats("Unauthorized: Please login.");
      else setErrStats(e?.message || "Failed to load cache stats.");
    } finally {
      setLoadingStats(false);
    }
  }

  async function refreshAll() {
    await Promise.allSettled([loadUsers(), loadStats()]);
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.is_admin).length;
    const active = users.filter((u) => u.is_active).length;
    return { total, admins, active };
  }, [users]);

  async function toggleAdmin(user) {
    const next = !user.is_admin;
    const ok = confirm(`Set admin=${next ? "YES" : "NO"} for ${user.email}?`);
    if (!ok) return;

    setBusyUserId(user.id);
    try {
      const updated = await apiFetch(`/admin/users/${user.id}/role`, {
        method: "PATCH",
        body: { is_admin: next },
      });

      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch (e) {
      alert(e?.message || "Failed to update role.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function deleteUser(user) {
    const ok = confirm(`Delete user ${user.email}? This cannot be undone.`);
    if (!ok) return;

    setBusyUserId(user.id);
    try {
      await apiFetch(`/admin/users/${user.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (e) {
      alert(e?.message || "Failed to delete user.");
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight">Admin</h1>
        <p className="text-slate-600">Manage users and view cache statistics.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Card title="Users">
          <Big>{counts.total}</Big>
          <Muted>Total</Muted>
        </Card>

        <Card title="Admins">
          <Big>{counts.admins}</Big>
          <Muted>Admin accounts</Muted>
        </Card>

        <Card title="Active">
          <Big>{counts.active}</Big>
          <Muted>Active accounts</Muted>
        </Card>

        <Card title="Actions">
          <button
            onClick={refreshAll}
            className="w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
          >
            Refresh
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Uses: /admin/users + /admin/admin/cache-stats
          </p>
        </Card>
      </section>

      {/* Cache stats */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black">Lookup cache</h2>
        <p className="mt-1 text-sm text-slate-600">Fresh vs expired entries.</p>

        {loadingStats ? (
          <Muted className="mt-4">Loading…</Muted>
        ) : errStats ? (
          <ErrorText className="mt-4">{errStats}</ErrorText>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-5">
            <Mini label="Total" value={stats?.total_entries ?? "—"} />
            <Mini label="Fresh" value={stats?.fresh_entries ?? "—"} />
            <Mini label="Expired" value={stats?.expired_entries ?? "—"} />
            <Mini label="TTL (min)" value={stats?.ttl_minutes ?? "—"} />
            <Mini label="Newest" value={fmtDate(stats?.newest_entry)} />
          </div>
        )}
      </section>

      {/* Users */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black">Users</h2>
        <p className="mt-1 text-sm text-slate-600">
          Toggle admin role or delete user.
        </p>

        {loadingUsers ? (
          <Muted className="mt-4">Loading…</Muted>
        ) : errUsers ? (
          <ErrorText className="mt-4">{errUsers}</ErrorText>
        ) : users.length === 0 ? (
          <Muted className="mt-4">No users.</Muted>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <Th>ID</Th>
                  <Th>Email</Th>
                  <Th>First</Th>
                  <Th>Last</Th>
                  <Th>Admin</Th>
                  <Th>Active</Th>
                  <Th>Created</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <Td className="font-mono text-sm">{u.id}</Td>
                    <Td className="font-mono text-sm">{u.email}</Td>
                    <Td>{u.first_name ?? "—"}</Td>
                    <Td>{u.last_name ?? "—"}</Td>
                    <Td>{u.is_admin ? "Yes" : "No"}</Td>
                    <Td>{u.is_active ? "Yes" : "No"}</Td>
                    <Td className="text-sm">{fmtDate(u.created_at)}</Td>

                    <Td className="text-right">
                      <div className="inline-flex gap-2">
                        <button
                          disabled={busyUserId === u.id}
                          onClick={() => toggleAdmin(u)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                        >
                          Toggle admin
                        </button>

                        <button
                          disabled={busyUserId === u.id}
                          onClick={() => deleteUser(u)}
                          className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Big({ children }) {
  return <p className="text-4xl font-black">{children}</p>;
}

function Mini({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-4 py-3 text-sm font-semibold text-slate-600 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`px-4 py-4 text-slate-800 ${className}`}>{children}</td>;
}

function Muted({ children, className = "" }) {
  return <p className={`text-slate-500 ${className}`}>{children}</p>;
}

function ErrorText({ children, className = "" }) {
  return <p className={`text-sm font-semibold text-red-600 ${className}`}>{children}</p>;
}
