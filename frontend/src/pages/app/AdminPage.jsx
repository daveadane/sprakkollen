import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/db-info`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setErr("Could not load admin DB info. Is FastAPI running on port 8000?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight">Admin</h1>
        <p className="text-slate-600">Database status, tables, and migrations.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card title="API Status">
          {loading ? (
            <Muted>Loading…</Muted>
          ) : err ? (
            <ErrorText>{err}</ErrorText>
          ) : data?.ok ? (
            <p className="text-2xl font-black text-green-700">OK ✅</p>
          ) : (
            <p className="text-2xl font-black text-red-700">NOT OK ❌</p>
          )}
        </Card>

        <Card title="Alembic Version">
          {loading ? (
            <Muted>Loading…</Muted>
          ) : err ? (
            <Muted>—</Muted>
          ) : (
            <p className="font-mono text-sm text-slate-700">
              {data?.alembic_version ?? "—"}
            </p>
          )}
        </Card>

        <Card title="Actions">
          <button
            onClick={load}
            className="w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
          >
            Refresh
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Later: seed words, reset DB, export CSV.
          </p>
        </Card>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black">Tables</h2>
        <p className="mt-1 text-sm text-slate-600">
          Current row counts from the database.
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                  Table
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                  Rows
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={2}>
                    Loading…
                  </td>
                </tr>
              ) : err ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={2}>
                    —
                  </td>
                </tr>
              ) : (
                (data?.tables ?? []).map((t) => (
                  <tr key={t.name} className="border-t">
                    <td className="px-4 py-4 font-mono text-sm text-slate-800">
                      {t.name}
                    </td>
                    <td className="px-4 py-4 text-slate-800">{t.rows}</td>
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
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Muted({ children }) {
  return <p className="text-slate-500">{children}</p>;
}

function ErrorText({ children }) {
  return <p className="text-sm font-semibold text-red-600">{children}</p>;
}
